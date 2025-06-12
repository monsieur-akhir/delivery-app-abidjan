from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas import delivery as delivery_schemas
from ..services import delivery as delivery_service
from ..services import matching as matching_service
from ..services import geolocation as geolocation_service

router = APIRouter()

from ..services.delivery import get_delivery, get_courier_deliveries
from ..services.matching import MatchingService

@router.get("/deliveries/{delivery_id}/suggested-couriers")
async def get_suggested_couriers(
    delivery_id: int,
    max_distance: float = Query(10.0, description="Distance maximale en km"),
    limit: int = Query(5, description="Nombre maximum de coursiers"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir les coursiers suggérés pour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier que l'utilisateur peut voir cette livraison
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    suggested_couriers = MatchingService.find_best_couriers(
        db, delivery, max_distance, limit
    )

    return {
        "delivery_id": delivery_id,
        "suggested_couriers": suggested_couriers
    }

@router.post("/deliveries/{delivery_id}/auto-assign")
async def auto_assign_delivery(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assigner automatiquement la livraison au meilleur coursier"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier les permissions
    if current_user.role not in ["manager", "admin"] and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Livraison déjà assignée")

    assigned_courier_id = MatchingService.auto_assign_delivery(db, delivery_id)

    if assigned_courier_id:
        return {
            "message": "Livraison assignée automatiquement",
            "courier_id": assigned_courier_id,
            "delivery_id": delivery_id
        }
    else:
        raise HTTPException(
            status_code=404, 
            detail="Aucun coursier disponible trouvé"
        )

@router.post("/deliveries/{delivery_id}/client-confirm")
async def client_confirm_delivery(
    delivery_id: int,
    confirm_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison côté client avec notation"""

@router.post("/smart-matching", response_model=dict)
async def smart_matching_endpoint(
    delivery_request: delivery_schemas.SmartMatchingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Matching intelligent des coursiers pour une livraison"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    return await matching_service.smart_matching(db, delivery_request, current_user.id)

@router.get("/address-autocomplete")
async def address_autocomplete_endpoint(
    query: str = Query(..., min_length=2, description="Texte de recherche"),
    user_lat: Optional[float] = Query(None, description="Latitude de l'utilisateur"),
    user_lng: Optional[float] = Query(None, description="Longitude de l'utilisateur"),
    limit: int = Query(8, ge=1, le=20, description="Nombre maximum de suggestions"),
    db: Session = Depends(get_db)
):
    """Autocomplétion intelligente d'adresses pour Abidjan"""
    try:
        user_location = None
        if user_lat is not None and user_lng is not None:
            user_location = {"latitude": user_lat, "longitude": user_lng}

        suggestions = await geolocation_service.get_address_suggestions(
            db, query, user_location, limit
        )

        return {
            "success": True,
            "suggestions": suggestions,
            "query": query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'autocomplétion: {str(e)}")

@router.get("/popular-places")
async def popular_places_endpoint(
    user_lat: Optional[float] = Query(None, description="Latitude de l'utilisateur"),
    user_lng: Optional[float] = Query(None, description="Longitude de l'utilisateur"),
    category: Optional[str] = Query(None, description="Catégorie de lieu"),
    limit: int = Query(10, ge=1, le=20, description="Nombre maximum de lieux"),
    db: Session = Depends(get_db)
):
    """Récupérer les lieux populaires d'Abidjan"""
    try:
        user_location = None
        if user_lat is not None and user_lng is not None:
            user_location = {"latitude": user_lat, "longitude": user_lng}

        places = await geolocation_service.get_popular_places(
            db, user_location, category, limit
        )

        return {
            "success": True,
            "places": places
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des lieux: {str(e)}")