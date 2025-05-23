from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.user import UserResponse
from ..models.user import UserRole
from ..services.sms_notification import SmsNotificationService

router = APIRouter()

class SmsRequest(BaseModel):
    phone_number: str = Field(..., description="Numéro de téléphone du destinataire")
    message: str = Field(..., description="Contenu du message SMS")
    priority: Optional[str] = Field("normal", description="Priorité du message (normal, high, critical)")

class TemplateRequest(BaseModel):
    phone_number: str = Field(..., description="Numéro de téléphone du destinataire")
    template_name: str = Field(..., description="Nom du modèle à utiliser")
    variables: Dict[str, Any] = Field({}, description="Variables à remplacer dans le modèle")

class BulkSmsRequest(BaseModel):
    user_ids: List[int] = Field(..., description="Liste des IDs utilisateurs")
    message: str = Field(..., description="Contenu du message SMS")
    priority: Optional[str] = Field("normal", description="Priorité du message (normal, high, critical)")

class CriticalAlertRequest(BaseModel):
    user_id: int = Field(..., description="ID de l'utilisateur")
    message: str = Field(..., description="Contenu de l'alerte critique")

@router.post("/send")
async def send_sms(
    request: SmsRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Envoyer un SMS à un numéro de téléphone.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    sms_service = SmsNotificationService(db)
    result = await sms_service.send_sms(
        request.phone_number,
        request.message,
        request.priority
    )
    
    return result

@router.post("/send-template")
async def send_template(
    request: TemplateRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Envoyer un SMS en utilisant un modèle prédéfini.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    sms_service = SmsNotificationService(db)
    result = await sms_service.send_template(
        request.phone_number,
        request.template_name,
        request.variables
    )
    
    return result

@router.post("/send-bulk")
async def send_bulk_sms(
    request: BulkSmsRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Envoyer un SMS à plusieurs utilisateurs.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    sms_service = SmsNotificationService(db)
    result = await sms_service.send_bulk_sms(
        request.user_ids,
        request.message,
        request.priority
    )
    
    return result

@router.post("/critical-alert")
async def send_critical_alert(
    request: CriticalAlertRequest,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Envoyer une alerte critique à un utilisateur.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    sms_service = SmsNotificationService(db)
    result = await sms_service.send_critical_alert(
        request.user_id,
        request.message
    )
    
    return result
