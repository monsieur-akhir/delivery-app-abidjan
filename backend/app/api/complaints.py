from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintResponse
from ..services.complaint import create_complaint, get_complaint, get_complaints, update_complaint
from ..services.notification import NotificationService
from ..models.user import UserRole

router = APIRouter()

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_new_complaint(
    complaint: ComplaintCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Créer une nouvelle plainte.
    """
    # Créer la plainte
    db_complaint = create_complaint(db=db, complaint=complaint, user_id=current_user.id)
    
    # Notifier les gestionnaires
    notification_service = NotificationService(db)
    background_tasks.add_task(
        notification_service.create_notification,
        user_id=current_user.id,
        title="Nouvelle plainte",
        message=f"Nouvelle plainte soumise: {complaint.subject}",
        notification_type="complaint",
        data={"complaint_id": db_complaint.id},
        channel="in_app"
    )
    
    return db_complaint

@router.get("/", response_model=List[ComplaintResponse])
async def read_complaints(
    status: Optional[str] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Récupérer la liste des plaintes.
    """
    if current_user.role == UserRole.manager:
        # Les gestionnaires voient toutes les plaintes
        return get_complaints(db, status=status, type=type, skip=skip, limit=limit)
    else:
        # Les autres utilisateurs ne voient que leurs plaintes
        return get_complaints(db, user_id=current_user.id, status=status, type=type, skip=skip, limit=limit)

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def read_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une plainte.
    """
    complaint = get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plainte non trouvée"
        )
    
    # Vérifier les permissions
    if current_user.role != UserRole.manager and current_user.id != complaint.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette plainte"
        )
    
    return complaint

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_existing_complaint(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Mettre à jour une plainte (pour les gestionnaires).
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent mettre à jour les plaintes"
        )
    
    db_complaint = get_complaint(db, complaint_id)
    if not db_complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plainte non trouvée"
        )
    
    # Mettre à jour la plainte
    updated_complaint = update_complaint(db, complaint_id, complaint_update)
    
    # Notifier l'utilisateur si le statut change
    if complaint_update.status and complaint_update.status != db_complaint.status:
        background_tasks.add_task(
            send_notification,
            db=db,
            user_id=db_complaint.user_id,
            title="Mise à jour de plainte",
            message=f"Votre plainte #{complaint_id} a été mise à jour",
            data={"complaint_id": complaint_id}
        )
    
    return updated_complaint
