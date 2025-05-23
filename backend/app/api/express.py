from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import UserRole
from ..schemas.user import UserResponse
from ..schemas.delivery import (
    DeliveryResponse, ExpressDeliveryCreate, ExpressDeliveryUpdate
)
from ..services.delivery import (
    get_express_deliveries, get_delivery, create_express_delivery,
    update_express_delivery, assign_courier_to_express_delivery,
    cancel_express_delivery, complete_express_delivery,
    get_express_delivery_stats, get_express_delivery_analytics
)
from ..services.notification import send_delivery_notification
from ..services.donation import (
    get_donation_organizations, get_donation_stats,
    create_donation, get_donations
)

router = APIRouter()

@router.get("/", response_model=List[DeliveryResponse])
async def read_express_deliveries(
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des livraisons express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_express_deliveries(db, status, commune, search, start_date, end_date, skip, limit)

@router.post("/", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
async def create_new_express_delivery(
    delivery: ExpressDeliveryCreate,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle livraison express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    db_delivery = create_express_delivery(db, delivery, current_user.id)
    
    # Créer un don si un pourcentage de don est spécifié
    if delivery.donation_percentage > 0 and delivery.charity_organization:
        donation_amount = (delivery.express_surcharge * delivery.donation_percentage) / 100
        
        # Créer le don
        create_donation(
            db,
            amount=donation_amount,
            organization=delivery.charity_organization,
            delivery_id=db_delivery.id,
            created_by=current_user.id
        )
    
    # Envoyer une notification au client
    if background_tasks and delivery.client_id:
        message = f"Une nouvelle livraison express a été créée pour vous. ID: {db_delivery.id}"
        background_tasks.add_task(
            send_delivery_notification,
            db=db,
            user_id=delivery.client_id,
            message=message
        )
    
    return db_delivery

@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def read_express_delivery(
    delivery_id: int = Path(..., title="ID de la livraison express"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une livraison express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas express"
        )
    
    return delivery

@router.put("/{delivery_id}", response_model=DeliveryResponse)
async def update_express_delivery_details(
    delivery_update: ExpressDeliveryUpdate,
    delivery_id: int = Path(..., title="ID de la livraison express"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour les détails d'une livraison express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas express"
        )
    
    updated_delivery = update_express_delivery(db, delivery_id, delivery_update)
    
    # Envoyer une notification au client
    if background_tasks and delivery.client_id:
        message = f"Votre livraison express #{delivery_id} a été mise à jour"
        background_tasks.add_task(
            send_delivery_notification,
            db=db,
            user_id=delivery.client_id,
            message=message
        )
    
    return updated_delivery

@router.put("/{delivery_id}/assign/{courier_id}", response_model=DeliveryResponse)
async def assign_courier(
    delivery_id: int = Path(..., title="ID de la livraison express"),
    courier_id: int = Path(..., title="ID du coursier"),
    send_notification: bool = True,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Assigner un coursier à une livraison express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas express"
        )
    
    if delivery.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les livraisons en attente peuvent être assignées"
        )
    
    updated_delivery = assign_courier_to_express_delivery(db, delivery_id, courier_id)
    
    # Envoyer une notification au coursier
    if background_tasks and send_notification:
        message = f"Vous avez été assigné à une livraison express #{delivery_id}"
        background_tasks.add_task(
            send_delivery_notification,
            db=db,
            user_id=courier_id,
            message=message
        )
    
    return updated_delivery

@router.put("/{delivery_id}/cancel", response_model=DeliveryResponse)
async def cancel_delivery(
    reason: str,
    delivery_id: int = Path(..., title="ID de la livraison express"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Annuler une livraison express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas express"
        )
    
    if delivery.status not in ["pending", "accepted"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les livraisons en attente ou acceptées peuvent être annulées"
        )
    
    cancelled_delivery = cancel_express_delivery(db, delivery_id, reason)
    
    # Envoyer des notifications
    if background_tasks:
        # Notification au client
        if delivery.client_id:
            message = f"Votre livraison express #{delivery_id} a été annulée. Raison: {reason}"
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                user_id=delivery.client_id,
                message=message
            )
        
        # Notification au coursier
        if delivery.courier_id:
            message = f"La livraison express #{delivery_id} a été annulée. Raison: {reason}"
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                user_id=delivery.courier_id,
                message=message
            )
    
    return cancelled_delivery

@router.put("/{delivery_id}/complete", response_model=DeliveryResponse)
async def complete_delivery(
    delivery_id: int = Path(..., title="ID de la livraison express"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Marquer une livraison express comme terminée.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livraison non trouvée"
        )
    
    if delivery.delivery_type != "express":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas express"
        )
    
    if delivery.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les livraisons en cours peuvent être marquées comme terminées"
        )
    
    completed_delivery = complete_express_delivery(db, delivery_id)
    
    # Envoyer des notifications
    if background_tasks:
        # Notification au client
        if delivery.client_id:
            message = f"Votre livraison express #{delivery_id} a été livrée avec succès"
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                user_id=delivery.client_id,
                message=message
            )
        
        # Notification au coursier
        if delivery.courier_id:
            message = f"La livraison express #{delivery_id} a été marquée comme terminée"
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                user_id=delivery.courier_id,
                message=message
            )
    
    return completed_delivery

@router.get("/stats", response_model=Dict[str, Any])
async def get_express_stats(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques des livraisons express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_express_delivery_stats(db)

@router.get("/analytics", response_model=Dict[str, Any])
async def get_express_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les analyses des livraisons express.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    # Si aucune date n'est fournie, utiliser les 30 derniers jours
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    return get_express_delivery_analytics(db, start_date, end_date)

@router.get("/donations/organizations", response_model=List[Dict[str, Any]])
async def get_charity_organizations(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des organisations caritatives.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_donation_organizations(db)

@router.get("/donations/stats", response_model=Dict[str, Any])
async def get_donations_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques des dons.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    # Si aucune date n'est fournie, utiliser les 30 derniers jours
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    return get_donation_stats(db, start_date, end_date)

@router.get("/donations", response_model=List[Dict[str, Any]])
async def get_donation_list(
    organization: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des dons.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_donations(db, organization, start_date, end_date, skip, limit)
