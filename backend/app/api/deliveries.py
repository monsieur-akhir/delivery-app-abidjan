
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.dependencies import get_current_user, get_db
from ..models.user import User
from ..models.delivery import Delivery, DeliveryStatus
from ..schemas.delivery import (
    DeliveryCreate,
    DeliveryUpdate,
    DeliveryResponse,
    DeliverySearchResponse,
    PriceEstimateRequest,
    PriceEstimateResponse,
    TrackingUpdateResponse,
    CourierAssignmentRequest
)
from ..services.delivery import (
    create_delivery,
    get_delivery,
    update_delivery,
    get_user_deliveries,
    get_available_deliveries,
    estimate_delivery_price,
    assign_courier_to_delivery,
    update_delivery_status,
    get_delivery_tracking,
    search_deliveries,
    get_delivery_stats
)
from ..services.notification import send_delivery_notification
from ..services.geolocation import calculate_distance, get_route_directions

router = APIRouter()

@router.post("/", response_model=DeliveryResponse)
async def create_new_delivery(
    delivery_data: DeliveryCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle livraison"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des livraisons")
    
    # Créer la livraison
    delivery = create_delivery(db, delivery_data, current_user.id)
    
    # Envoyer notification de création
    background_tasks.add_task(
        send_delivery_notification,
        delivery.id,
        "delivery_created",
        f"Nouvelle livraison #{delivery.id} créée"
    )
    
    return delivery

@router.get("/user/{user_id}", response_model=List[DeliveryResponse])
async def get_user_deliveries_endpoint(
    user_id: int,
    status: Optional[DeliveryStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons d'un utilisateur"""
    # Vérifier les permissions
    if current_user.id != user_id and current_user.role not in ["manager", "admin"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return get_user_deliveries(
        db, user_id, status, skip, limit, start_date, end_date
    )

@router.get("/available", response_model=List[DeliveryResponse])
async def get_available_deliveries_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    max_distance: Optional[float] = Query(None, ge=0),
    courier_lat: Optional[float] = None,
    courier_lng: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons disponibles pour les coursiers"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")
    
    return get_available_deliveries(
        db, skip, limit, max_distance, courier_lat, courier_lng
    )

@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery_endpoint(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une livraison par ID"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return delivery

@router.put("/{delivery_id}", response_model=DeliveryResponse)
async def update_delivery_endpoint(
    delivery_id: int,
    delivery_update: DeliveryUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Envoyer notification de mise à jour
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_updated",
        f"Livraison #{delivery_id} mise à jour"
    )
    
    return updated_delivery

@router.post("/price-estimate", response_model=PriceEstimateResponse)
async def estimate_price_endpoint(
    estimate_request: PriceEstimateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison"""
    return estimate_delivery_price(
        estimate_request.pickup_lat,
        estimate_request.pickup_lng,
        estimate_request.delivery_lat,
        estimate_request.delivery_lng,
        estimate_request.package_weight,
        estimate_request.cargo_category,
        estimate_request.is_fragile,
        estimate_request.is_express
    )

@router.post("/{delivery_id}/accept", response_model=DeliveryResponse)
async def accept_delivery(
    delivery_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepter une livraison (coursier)"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent accepter des livraisons")
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.status != DeliveryStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cette livraison ne peut plus être acceptée")
    
    # Assigner le coursier et changer le statut
    delivery_update = DeliveryUpdate(
        courier_id=current_user.id,
        status=DeliveryStatus.ACCEPTED
    )
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notification au client
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_accepted",
        f"Votre livraison #{delivery_id} a été acceptée par un coursier"
    )
    
    return updated_delivery

@router.post("/{delivery_id}/reject")
async def reject_delivery(
    delivery_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rejeter une livraison (coursier)"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent rejeter des livraisons")
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    # Remettre la livraison en attente
    delivery_update = DeliveryUpdate(
        courier_id=None,
        status=DeliveryStatus.PENDING
    )
    update_delivery(db, delivery_id, delivery_update)
    
    return {"message": "Livraison rejetée avec succès"}

@router.post("/{delivery_id}/start-pickup", response_model=DeliveryResponse)
async def start_pickup(
    delivery_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Commencer la collecte"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    if delivery.status != DeliveryStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="La livraison doit être acceptée pour commencer la collecte")
    
    delivery_update = DeliveryUpdate(status=DeliveryStatus.PICKUP_IN_PROGRESS)
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notification au client
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "pickup_started",
        f"Le coursier se dirige vers l'adresse de collecte pour la livraison #{delivery_id}"
    )
    
    return updated_delivery

@router.post("/{delivery_id}/confirm-pickup", response_model=DeliveryResponse)
async def confirm_pickup(
    delivery_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la collecte"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    if delivery.status != DeliveryStatus.PICKUP_IN_PROGRESS:
        raise HTTPException(status_code=400, detail="La collecte doit être en cours")
    
    delivery_update = DeliveryUpdate(
        status=DeliveryStatus.PICKED_UP,
        pickup_time=datetime.utcnow()
    )
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notification au client
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "package_picked_up",
        f"Votre colis a été collecté. Livraison #{delivery_id} en transit"
    )
    
    return updated_delivery

@router.post("/{delivery_id}/start-delivery", response_model=DeliveryResponse)
async def start_delivery(
    delivery_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Commencer la livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    if delivery.status != DeliveryStatus.PICKED_UP:
        raise HTTPException(status_code=400, detail="Le colis doit être collecté avant de commencer la livraison")
    
    delivery_update = DeliveryUpdate(status=DeliveryStatus.IN_TRANSIT)
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notification au client
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_started",
        f"Votre colis est en route ! Livraison #{delivery_id}"
    )
    
    return updated_delivery

@router.post("/{delivery_id}/confirm-delivery", response_model=DeliveryResponse)
async def confirm_delivery(
    delivery_id: int,
    confirmation_code: Optional[str] = None,
    delivery_photo: Optional[str] = None,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    if delivery.status != DeliveryStatus.IN_TRANSIT:
        raise HTTPException(status_code=400, detail="La livraison doit être en transit")
    
    delivery_update = DeliveryUpdate(
        status=DeliveryStatus.DELIVERED,
        delivery_time=datetime.utcnow(),
        confirmation_code=confirmation_code,
        delivery_photo=delivery_photo
    )
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notification au client
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_completed",
        f"Votre livraison #{delivery_id} a été livrée avec succès !"
    )
    
    return updated_delivery

@router.post("/{delivery_id}/cancel", response_model=DeliveryResponse)
async def cancel_delivery(
    delivery_id: int,
    reason: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annuler une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if delivery.status in [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cette livraison ne peut plus être annulée")
    
    delivery_update = DeliveryUpdate(
        status=DeliveryStatus.CANCELLED,
        cancellation_reason=reason,
        cancelled_at=datetime.utcnow()
    )
    updated_delivery = update_delivery(db, delivery_id, delivery_update)
    
    # Notifications
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_cancelled",
        f"Livraison #{delivery_id} annulée. Raison: {reason}"
    )
    
    return updated_delivery

@router.get("/{delivery_id}/tracking", response_model=List[TrackingUpdateResponse])
async def get_tracking_updates(
    delivery_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les mises à jour de suivi"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return get_delivery_tracking(db, delivery_id)

@router.post("/{delivery_id}/location")
async def update_courier_location(
    delivery_id: int,
    latitude: float,
    longitude: float,
    timestamp: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour la position du coursier"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    # Logique de mise à jour de la position (à implémenter)
    # Cela pourrait inclure la sauvegarde dans une table de tracking
    
    return {"message": "Position mise à jour avec succès"}

@router.get("/search", response_model=List[DeliverySearchResponse])
async def search_deliveries_endpoint(
    q: str = Query(..., min_length=1),
    status: Optional[DeliveryStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rechercher des livraisons"""
    return search_deliveries(db, q, current_user.id, status, skip, limit)

@router.get("/stats")
async def get_delivery_stats_endpoint(
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques de livraison"""
    # Si user_id n'est pas fourni, utiliser l'utilisateur courant
    target_user_id = user_id or current_user.id
    
    # Vérifier les permissions
    if (current_user.id != target_user_id and 
        current_user.role not in ["manager", "admin"]):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    return get_delivery_stats(db, target_user_id, start_date, end_date)

@router.get("/{delivery_id}/directions")
async def get_delivery_directions(
    delivery_id: int,
    current_lat: float,
    current_lng: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les directions pour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas assigné à cette livraison")
    
    # Déterminer la destination en fonction du statut
    if delivery.status in [DeliveryStatus.ACCEPTED, DeliveryStatus.PICKUP_IN_PROGRESS]:
        # Aller vers l'adresse de collecte
        destination_lat = delivery.pickup_latitude
        destination_lng = delivery.pickup_longitude
    else:
        # Aller vers l'adresse de livraison
        destination_lat = delivery.delivery_latitude
        destination_lng = delivery.delivery_longitude
    
    # Obtenir les directions
    directions = await get_route_directions(
        current_lat, current_lng, 
        destination_lat, destination_lng
    )
    
    return directions

@router.post("/{delivery_id}/message")
async def send_delivery_message(
    delivery_id: int,
    message: str,
    recipient_type: str,  # 'client' ou 'courier'
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Envoyer un message concernant une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Déterminer le destinataire
    if recipient_type == "client" and delivery.client_id:
        recipient_id = delivery.client_id
    elif recipient_type == "courier" and delivery.courier_id:
        recipient_id = delivery.courier_id
    else:
        raise HTTPException(status_code=400, detail="Destinataire invalide")
    
    # Envoyer le message
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_message",
        message,
        recipient_id
    )
    
    return {"message": "Message envoyé avec succès"}

@router.post("/{delivery_id}/report-issue")
async def report_delivery_issue(
    delivery_id: int,
    issue_type: str,
    description: str,
    photos: Optional[List[str]] = None,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Signaler un problème avec une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les permissions
    if (current_user.id != delivery.client_id and 
        current_user.id != delivery.courier_id):
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Créer le rapport de problème (à implémenter dans le service)
    # report = create_delivery_issue_report(db, delivery_id, current_user.id, issue_type, description, photos)
    
    # Notifier les managers
    background_tasks.add_task(
        send_delivery_notification,
        delivery_id,
        "delivery_issue_reported",
        f"Problème signalé pour la livraison #{delivery_id}: {issue_type}"
    )
    
    return {"message": "Problème signalé avec succès"}

# Endpoints pour les clients actifs
@router.get("/client/active", response_model=List[DeliveryResponse])
async def get_active_client_deliveries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons actives du client connecté"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")
    
    active_statuses = [
        DeliveryStatus.PENDING,
        DeliveryStatus.ACCEPTED,
        DeliveryStatus.PICKUP_IN_PROGRESS,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT
    ]
    
    deliveries = []
    for status in active_statuses:
        user_deliveries = get_user_deliveries(db, current_user.id, status, 0, 50)
        deliveries.extend(user_deliveries)
    
    return deliveries

# Endpoints pour les coursiers actifs
@router.get("/courier/active", response_model=List[DeliveryResponse])
async def get_active_courier_deliveries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons actives du coursier connecté"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")
    
    active_statuses = [
        DeliveryStatus.ACCEPTED,
        DeliveryStatus.PICKUP_IN_PROGRESS,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT
    ]
    
    deliveries = []
    for status in active_statuses:
        courier_deliveries = db.query(Delivery).filter(
            Delivery.courier_id == current_user.id,
            Delivery.status == status
        ).all()
        deliveries.extend(courier_deliveries)
    
    return deliveries
