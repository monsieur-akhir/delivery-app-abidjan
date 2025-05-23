from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.delivery import (
    DeliveryCreate, DeliveryUpdate, DeliveryResponse, StatusUpdate,
    BidCreate, BidResponse, TrackingPointCreate, TrackingPointResponse,
    CollaborativeDeliveryCreate, CollaborativeDeliveryResponse,
    ExpressDeliveryCreate
)
from ..schemas.user import UserResponse
from ..services.delivery import (
    create_delivery, get_delivery, get_deliveries, update_delivery,
    update_delivery_status, delete_delivery, get_user_deliveries,
    create_bid, get_bids, accept_bid, get_bid,
    add_tracking_point, get_tracking_points,
    create_collaborative_delivery, get_collaborative_deliveries, join_collaborative_delivery,
    create_express_delivery
)
from ..services.notification import send_delivery_notification
from ..services.gamification import add_points_for_delivery
from ..services.payment import process_payment
from ..services.geolocation import calculate_distance_and_duration
from ..models.user import UserRole

router = APIRouter()

# Routes pour les livraisons
@router.post("/", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def create_new_delivery(
    delivery: DeliveryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle demande de livraison.
    Seuls les clients et les entreprises peuvent créer des livraisons.
    """
    if current_user.role not in [UserRole.client, UserRole.business]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les clients et les entreprises peuvent créer des livraisons"
        )
    
    # Calculer la distance et la durée estimée
    distance, duration = calculate_distance_and_duration(
        delivery.pickup_lat, delivery.pickup_lng,
        delivery.delivery_lat, delivery.delivery_lng
    )
    
    # Créer la livraison
    db_delivery = create_delivery(
        db=db,
        delivery=delivery,
        client_id=current_user.id,
        estimated_distance=distance,
        estimated_duration=duration
    )
    
    # Envoyer des notifications aux coursiers à proximité
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=db_delivery.id,
        message=f"Nouvelle livraison disponible de {db_delivery.pickup_commune} à {db_delivery.delivery_commune}"
    )
    
    return db_delivery

@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def read_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une livraison.
    """
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager:
        return delivery
    elif current_user.id == delivery.client_id or (delivery.courier_id and current_user.id == delivery.courier_id):
        return delivery
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette livraison"
        )

@router.get("/", response_model=List[DeliveryResponse])
async def read_deliveries(
    status: Optional[str] = None,
    commune: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des livraisons.
    Filtrage par statut et commune possible.
    """
    if current_user.role == UserRole.manager:
        # Les gestionnaires peuvent voir toutes les livraisons
        return get_deliveries(db, status=status, commune=commune, skip=skip, limit=limit)
    elif current_user.role == UserRole.courier:
        # Les coursiers voient les livraisons disponibles et les leurs
        return get_user_deliveries(db, user_id=current_user.id, role=UserRole.courier, status=status, commune=commune, skip=skip, limit=limit)
    else:
        # Les clients et entreprises ne voient que leurs livraisons
        return get_user_deliveries(db, user_id=current_user.id, role=UserRole.client, status=status, commune=commune, skip=skip, limit=limit)

@router.put("/{delivery_id}", response_model=DeliveryResponse)
async def update_existing_delivery(
    delivery_id: int,
    delivery: DeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour une livraison existante.
    Seul le client qui a créé la livraison ou un gestionnaire peut la modifier.
    """
    db_delivery = get_delivery(db, delivery_id)
    if not db_delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or current_user.id == db_delivery.client_id:
        # Vérifier si la livraison peut être modifiée (statut pending ou bidding)
        if db_delivery.status not in ["pending", "bidding"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette livraison ne peut plus être modifiée"
            )
        
        return update_delivery(db, delivery_id, delivery)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier cette livraison"
        )

@router.put("/{delivery_id}/status", response_model=DeliveryResponse)
async def update_delivery_status_endpoint(
    delivery_id: int,
    status_update: StatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour le statut d'une livraison.
    """
    db_delivery = get_delivery(db, delivery_id)
    if not db_delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions selon le statut demandé
    if status_update.status == "cancelled":
        # Seul le client ou un gestionnaire peut annuler
        if current_user.role != UserRole.manager and current_user.id != db_delivery.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission d'annuler cette livraison"
            )
    elif status_update.status in ["in_progress", "delivered"]:
        # Seul le coursier assigné peut mettre à jour ces statuts
        if current_user.role != UserRole.manager and current_user.id != db_delivery.courier_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission de mettre à jour cette livraison"
            )
    elif status_update.status == "completed":
        # Seul le client peut confirmer la livraison
        if current_user.role != UserRole.manager and current_user.id != db_delivery.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas la permission de confirmer cette livraison"
            )
    
    # Mettre à jour le statut
    updated_delivery = update_delivery_status(db, delivery_id, status_update.status)
    
    # Actions supplémentaires selon le statut
    if status_update.status == "completed":
        # Ajouter des points au coursier
        background_tasks.add_task(
            add_points_for_delivery,
            db=db,
            courier_id=db_delivery.courier_id,
            delivery_id=delivery_id
        )
        
        # Traiter le paiement final
        background_tasks.add_task(
            process_payment,
            db=db,
            delivery_id=delivery_id
        )
    
    # Envoyer des notifications
    status_messages = {
        "accepted": "Votre livraison a été acceptée par un coursier",
        "in_progress": "Votre livraison est en cours",
        "delivered": "Votre colis a été livré, veuillez confirmer la réception",
        "completed": "Livraison confirmée, merci de votre confiance !",
        "cancelled": "La livraison a été annulée"
    }
    
    if status_update.status in status_messages:
        if status_update.status in ["accepted", "in_progress", "delivered", "cancelled"]:
            # Notifier le client
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                delivery_id=delivery_id,
                user_id=db_delivery.client_id,
                message=status_messages[status_update.status]
            )
        
        if status_update.status in ["completed", "cancelled"] and db_delivery.courier_id:
            # Notifier le coursier
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                delivery_id=delivery_id,
                user_id=db_delivery.courier_id,
                message=f"La livraison #{delivery_id} a été {status_update.status}"
            )
    
    return updated_delivery

@router.delete("/{delivery_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer une livraison.
    Seul le client qui a créé la livraison ou un gestionnaire peut la supprimer.
    """
    db_delivery = get_delivery(db, delivery_id)
    if not db_delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or current_user.id == db_delivery.client_id:
        # Vérifier si la livraison peut être supprimée (statut pending ou bidding)
        if db_delivery.status not in ["pending", "bidding"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette livraison ne peut plus être supprimée"
            )
        
        delete_delivery(db, delivery_id)
        return {"detail": "Livraison supprimée"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer cette livraison"
        )

# Routes pour les enchères
@router.post("/{delivery_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def create_new_bid(
    delivery_id: int,
    bid: BidCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle enchère pour une livraison.
    Seuls les coursiers peuvent créer des enchères.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent créer des enchères"
        )
    
    # Vérifier si la livraison existe et est en attente d'enchères
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.status != "bidding":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas ouverte aux enchères"
        )
    
    # Créer l'enchère
    db_bid = create_bid(db, delivery_id, current_user.id, bid)
    
    # Notifier le client
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=delivery_id,
        user_id=delivery.client_id,
        message=f"Nouvelle enchère de {db_bid.amount} FCFA pour votre livraison"
    )
    
    return db_bid

@router.get("/{delivery_id}/bids", response_model=List[BidResponse])
async def read_bids(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des enchères pour une livraison.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or current_user.id == delivery.client_id:
        return get_bids(db, delivery_id)
    elif current_user.role == UserRole.courier:
        # Les coursiers ne peuvent voir que leurs propres enchères
        bids = get_bids(db, delivery_id)
        return [bid for bid in bids if bid.courier_id == current_user.id]
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux enchères de cette livraison"
        )

@router.post("/{delivery_id}/bids/{bid_id}/accept", response_model=DeliveryResponse)
async def accept_bid_endpoint(
    delivery_id: int,
    bid_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Accepter une enchère pour une livraison.
    Seul le client qui a créé la livraison ou un gestionnaire peut accepter une enchère.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != delivery.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission d'accepter une enchère pour cette livraison"
        )
    
    # Vérifier si la livraison est en attente d'enchères
    if delivery.status != "bidding":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas ouverte aux enchères"
        )
    
    # Vérifier si l'enchère existe
    bid = get_bid(db, bid_id)
    if not bid or bid.delivery_id != delivery_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enchère non trouvée"
        )
    
    # Accepter l'enchère
    updated_delivery = accept_bid(db, delivery_id, bid_id)
    
    # Notifier le coursier
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=delivery_id,
        user_id=bid.courier_id,
        message=f"Votre enchère de {bid.amount} FCFA a été acceptée pour la livraison #{delivery_id}"
    )
    
    return updated_delivery

# Routes pour le tracking
@router.post("/{delivery_id}/tracking", response_model=TrackingPointResponse, status_code=status.HTTP_201_CREATED)
async def add_tracking_point_endpoint(
    delivery_id: int,
    tracking_point: TrackingPointCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Ajouter un point de tracking pour une livraison.
    Seul le coursier assigné à la livraison peut ajouter des points de tracking.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != delivery.courier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission d'ajouter des points de tracking pour cette livraison"
        )
    
    # Vérifier si la livraison est en cours
    if delivery.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas en cours"
        )
    
    # Ajouter le point de tracking
    return add_tracking_point(db, delivery_id, tracking_point)

@router.get("/{delivery_id}/tracking", response_model=List[TrackingPointResponse])
async def get_tracking_points_endpoint(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les points de tracking pour une livraison.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or current_user.id == delivery.client_id or current_user.id == delivery.courier_id:
        return get_tracking_points(db, delivery_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux points de tracking de cette livraison"
        )

# Routes pour les livraisons collaboratives
@router.post("/collaborative", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def create_collaborative_delivery_endpoint(
    delivery: DeliveryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle livraison collaborative.
    """
    if current_user.role not in [UserRole.client, UserRole.business]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les clients et les entreprises peuvent créer des livraisons"
        )
    
    # Créer la livraison collaborative
    db_delivery = create_collaborative_delivery(db, delivery, current_user.id)
    
    # Envoyer des notifications aux coursiers à proximité
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=db_delivery.id,
        message=f"Nouvelle livraison collaborative disponible de {db_delivery.pickup_commune} à {db_delivery.delivery_commune}"
    )
    
    return db_delivery

@router.post("/{delivery_id}/collaborative/join", response_model=CollaborativeDeliveryResponse)
async def join_collaborative_delivery_endpoint(
    delivery_id: int,
    collaborative: CollaborativeDeliveryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Rejoindre une livraison collaborative.
    Seuls les coursiers peuvent rejoindre une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent rejoindre une livraison collaborative"
        )
    
    # Vérifier si la livraison existe et est collaborative
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "collaborative":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas collaborative"
        )
    
    # Rejoindre la livraison collaborative
    db_collaborative = join_collaborative_delivery(db, delivery_id, current_user.id, collaborative)
    
    # Notifier le client
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=delivery_id,
        user_id=delivery.client_id,
        message=f"Un coursier a rejoint votre livraison collaborative #{delivery_id}"
    )
    
    return db_collaborative

@router.get("/{delivery_id}/collaborative", response_model=List[CollaborativeDeliveryResponse])
async def get_collaborative_couriers_endpoint(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des coursiers pour une livraison collaborative.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role == UserRole.manager or current_user.id == delivery.client_id:
        return get_collaborative_deliveries(db, delivery_id)
    elif current_user.role == UserRole.courier:
        # Vérifier si le coursier participe à cette livraison
        collaboratives = get_collaborative_deliveries(db, delivery_id)
        if any(collab.courier_id == current_user.id for collab in collaboratives):
            return collaboratives
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne participez pas à cette livraison collaborative"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès aux détails de cette livraison collaborative"
        )

# Route pour les livraisons express
@router.post("/express", response_model=DeliveryResponse)
async def create_express_delivery_endpoint(
    express: ExpressDeliveryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Convertir une livraison standard en livraison express.
    """
    # Vérifier si la livraison existe
    delivery = get_delivery(db, express.delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != delivery.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de convertir cette livraison en express"
        )
    
    # Vérifier si la livraison peut être convertie
    if delivery.status not in ["pending", "bidding"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison ne peut plus être convertie en express"
        )
    
    if delivery.delivery_type == "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison est déjà en mode express"
        )
    
    # Convertir en livraison express
    updated_delivery = create_express_delivery(db, express.delivery_id, express.donation_percentage)
    
    # Notifier les coursiers à proximité
    background_tasks.add_task(
        send_delivery_notification,
        db=db,
        delivery_id=express.delivery_id,
        message=f"Nouvelle livraison express disponible de {delivery.pickup_commune} à {delivery.delivery_commune}"
    )
    
    return updated_delivery
