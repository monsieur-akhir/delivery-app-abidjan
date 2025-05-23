from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import User, UserRole
from ..schemas.user import UserResponse
from ..schemas.delivery import DeliveryResponse
from ..schemas.collaborative import (
    CollaborativeDeliveryResponse, CollaborativeMessageResponse,
    CollaborativeDeliveryCreate, CollaborativeMessageCreate,
    JoinDeliveryRequest
)
from ..services.delivery import get_delivery, get_courier_deliveries
from ..services.collaborative_service import (
    get_collaborative_deliveries, get_collaborative_delivery_details,
    join_collaborative_delivery, send_collaborative_message,
    calculate_collaborative_earnings, get_collaborative_stats
)
from ..services.notification import send_delivery_notification

router = APIRouter()

@router.get("/deliveries", response_model=List[DeliveryResponse])
async def read_courier_deliveries(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les livraisons d'un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    return get_courier_deliveries(db, current_user.id, status, start_date, end_date, skip, limit)

@router.get("/collaborative-deliveries", response_model=List[Dict[str, Any]])
async def read_collaborative_deliveries(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les livraisons collaboratives disponibles pour un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    return get_collaborative_deliveries(db, skip, limit, status)

@router.get("/collaborative-deliveries/{delivery_id}", response_model=Dict[str, Any])
async def read_collaborative_delivery_details(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    return get_collaborative_delivery_details(db, delivery_id)

@router.post("/collaborative-deliveries/{delivery_id}/join", response_model=CollaborativeDeliveryResponse)
async def join_collaborative_delivery_endpoint(
    join_request: JoinDeliveryRequest,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Rejoindre une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    try:
        collaboration = join_collaborative_delivery(db, delivery_id, current_user.id, join_request)
        
        # Envoyer une notification au client
        if background_tasks:
            delivery = get_delivery(db, delivery_id)
            if delivery and delivery.client_id:
                message = f"Le coursier {current_user.full_name} a rejoint votre livraison collaborative #{delivery_id} en tant que {join_request.role.value}."
                background_tasks.add_task(
                    send_delivery_notification,
                    db=db,
                    user_id=delivery.client_id,
                    message=message
                )
        
        return collaboration
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/collaborative-deliveries/{delivery_id}/message", response_model=CollaborativeMessageResponse)
async def send_collaborative_message_endpoint(
    message_data: CollaborativeMessageCreate,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Envoyer un message dans le chat d'une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    try:
        message = send_collaborative_message(db, delivery_id, current_user.id, message_data)
        
        # Envoyer des notifications aux autres participants
        if background_tasks:
            delivery_details = get_collaborative_delivery_details(db, delivery_id)
            for collaborator in delivery_details["collaborators"]:
                if collaborator["courier_id"] != current_user.id:
                    notification_message = f"Nouveau message de {current_user.full_name} dans la livraison collaborative #{delivery_id}"
                    background_tasks.add_task(
                        send_delivery_notification,
                        db=db,
                        user_id=collaborator["courier_id"],
                        message=notification_message
                    )
        
        return message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/collaborative-stats", response_model=Dict[str, Any])
async def get_courier_collaborative_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques des livraisons collaboratives pour un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )
    
    return get_collaborative_stats(db, current_user.id)
