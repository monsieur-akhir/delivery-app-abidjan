from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
import yaml
from datetime import datetime

from ..db.session import get_db
from app.core.auth import get_current_active_user
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.services.settings import SettingsService
from ..services.geolocation import get_google_places_suggestions

router = APIRouter()

@router.get("/")
async def get_settings(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Récupérer tous les paramètres de l'application"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder aux paramètres"
        )
    
    return SettingsService.get_all_settings(db)

@router.put("/")
async def update_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Mettre à jour les paramètres de l'application"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent modifier les paramètres"
        )
    
    return SettingsService.update_settings(db, settings, current_user.id)

@router.post("/reset")
async def reset_settings(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Réinitialiser aux paramètres par défaut"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent réinitialiser les paramètres"
        )
    
    return SettingsService.reset_to_defaults(db, current_user.id)

@router.get("/history")
async def get_settings_history(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Récupérer l'historique des modifications de paramètres"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    
    return SettingsService.get_settings_history(db)

@router.get("/export")
async def export_settings(
    format: str = "json",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Exporter la configuration"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    
    return SettingsService.export_settings(db, format)

@router.post("/import")
async def import_settings(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Importer la configuration"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    
    return SettingsService.import_settings(db, file, current_user.id)

@router.post("/validate")
async def validate_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Valider une configuration"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    
    return SettingsService.validate_settings(settings)

@router.post("/test-connections")
async def test_connections(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Tester la connectivité des services externes"""
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    
    return SettingsService.test_external_connections(db)

@router.get("/test-google-places")
async def test_google_places(query: str):
    """Test rapide du proxy Google Places (sans auth)"""
    suggestions = await get_google_places_suggestions(query)
    return {"suggestions": suggestions, "query": query}
