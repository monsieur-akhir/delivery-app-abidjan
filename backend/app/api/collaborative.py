from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import UserRole
from ..schemas.user import UserResponse
from ..schemas.delivery import (
    DeliveryResponse, CollaborativeDeliveryResponse
)
from ..services.delivery import (
    get_collaborative_deliveries, get_delivery, get_collaborative_delivery,
    update_collaborative_delivery_status, calculate_collaborative_earnings
)
from ..services.notification import send_delivery_notification

router = APIRouter()

@router.get("/", response_model=List[DeliveryResponse])
async def read_collaborative_deliveries(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des livraisons collaboratives.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_collaborative_deliveries(db, status, start_date, end_date, skip, limit)

@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def read_collaborative_delivery(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une livraison collaborative.
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
    
    if delivery.delivery_type != "collaborative":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas collaborative"
        )
    
    return delivery

@router.get("/{delivery_id}/participants", response_model=List[CollaborativeDeliveryResponse])
async def read_collaborative_participants(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des participants à une livraison collaborative.
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
    
    if delivery.delivery_type != "collaborative":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas collaborative"
        )
    
    return delivery.collaborative_couriers

@router.put("/{delivery_id}/participants/{participant_id}/status", response_model=CollaborativeDeliveryResponse)
async def update_participant_status(
    status: str,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    participant_id: int = Path(..., title="ID du participant"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour le statut d'un participant à une livraison collaborative.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    if status not in ["pending", "accepted", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statut invalide"
        )
    
    collaborative = get_collaborative_delivery(db, delivery_id, participant_id)
    if not collaborative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant non trouvé pour cette livraison collaborative"
        )
    
    updated_collaborative = update_collaborative_delivery_status(db, delivery_id, participant_id, status)
    
    # Envoyer une notification au coursier
    if background_tasks:
        message = f"Votre statut pour la livraison collaborative #{delivery_id} a été mis à jour: {status}"
        background_tasks.add_task(
            send_delivery_notification,
            db=db,
            user_id=participant_id,
            message=message
        )
    
    return updated_collaborative

@router.put("/{delivery_id}/participants/{participant_id}/share", response_model=CollaborativeDeliveryResponse)
async def update_participant_share(
    share_percentage: float,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    participant_id: int = Path(..., title="ID du participant"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour le pourcentage de partage d'un participant à une livraison collaborative.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    if share_percentage < 0 or share_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le pourcentage de partage doit être compris entre 0 et 100"
        )
    
    collaborative = get_collaborative_delivery(db, delivery_id, participant_id)
    if not collaborative:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant non trouvé pour cette livraison collaborative"
        )
    
    # Mettre à jour le pourcentage de partage
    collaborative.share_percentage = share_percentage
    db.commit()
    db.refresh(collaborative)
    
    # Envoyer une notification au coursier
    if background_tasks:
        message = f"Votre pourcentage de partage pour la livraison collaborative #{delivery_id} a été mis à jour: {share_percentage}%"
        background_tasks.add_task(
            send_delivery_notification,
            db=db,
            user_id=participant_id,
            message=message
        )
    
    return collaborative

@router.get("/{delivery_id}/earnings", response_model=Dict[str, Any])
async def get_collaborative_earnings(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Calculer les gains pour chaque participant à une livraison collaborative.
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
    
    if delivery.delivery_type != "collaborative":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas collaborative"
        )
    
    earnings = calculate_collaborative_earnings(db, delivery_id)
    return earnings

@router.post("/{delivery_id}/distribute-earnings", status_code=status.HTTP_200_OK)
async def distribute_collaborative_earnings(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Distribuer les gains aux participants d'une livraison collaborative.
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
    
    if delivery.delivery_type != "collaborative":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette livraison n'est pas collaborative"
        )
    
    if delivery.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La livraison doit être complétée pour distribuer les gains"
        )
    
    # Calculer et distribuer les gains
    earnings = calculate_collaborative_earnings(db, delivery_id)
    
    # Créer des transactions pour chaque participant
    for participant_id, amount in earnings["participant_earnings"].items():
        # Créer une transaction pour le participant
        # (Cette partie dépend de l'implémentation du service de paiement)
        
        # Envoyer une notification au coursier
        if background_tasks:
            message = f"Vous avez reçu {amount} FCFA pour votre participation à la livraison collaborative #{delivery_id}"
            background_tasks.add_task(
                send_delivery_notification,
                db=db,
                user_id=int(participant_id),
                message=message
            )
    
    return {"status": "success", "message": "Gains distribués avec succès", "earnings": earnings}
