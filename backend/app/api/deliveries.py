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

from ..services.delivery import get_delivery, get_courier_deliveries, get_user_deliveries_with_filters, create_delivery
from ..services.matching import MatchingService

@router.post("/deliveries", response_model=delivery_schemas.DeliveryResponse)
async def create_new_delivery(
    delivery_data: delivery_schemas.DeliveryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle demande de livraison.
    Seuls les clients et les entreprises peuvent créer des livraisons.
    """
    if current_user.role not in ["client", "business"]:
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des livraisons")
    
    try:
        delivery = create_delivery(db, delivery_data, current_user)
        return delivery
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la livraison: {str(e)}")

@router.get("/deliveries")
async def get_deliveries(
    user_id: Optional[int] = Query(None, description="ID de l'utilisateur"),
    status: Optional[str] = Query(None, description="Statut de la livraison"),
    date_from: Optional[str] = Query(None, description="Date de début (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Date de fin (YYYY-MM-DD)"),
    commune: Optional[str] = Query(None, description="Commune"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(20, ge=1, le=100, description="Nombre maximum d'éléments"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons avec filtres"""
    try:
        # Si user_id est fourni, vérifier les permissions
        if user_id and current_user.role not in ["admin", "manager"]:
            if current_user.id != user_id:
                raise HTTPException(status_code=403, detail="Accès non autorisé")
        
        # Si aucun user_id n'est fourni, utiliser l'utilisateur connecté
        if not user_id:
            user_id = current_user.id

        deliveries = get_user_deliveries_with_filters(
            db, 
            user_id, 
            status=status,
            date_from=date_from,
            date_to=date_to,
            commune=commune,
            skip=skip,
            limit=limit
        )

        return {
            "success": True,
            "deliveries": deliveries,
            "total": len(deliveries),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des livraisons: {str(e)}")

@router.get("/deliveries/{delivery_id}")
async def get_delivery_by_id(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer une livraison par son ID"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"]:
        if delivery.client_id != current_user.id and delivery.courier_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

    return {
        "success": True,
        "delivery": delivery
    }

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

@router.post("/recommend-vehicle")
async def recommend_vehicle_endpoint(
    request_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recommander un véhicule pour une livraison"""
    try:
        from ..services.transport import TransportService
        from ..schemas.transport import VehicleRecommendationRequest
        
        transport_service = TransportService(db)
        
        recommendation_data = VehicleRecommendationRequest(
            cargo_category=request_data.get("cargo_category"),
            distance=request_data.get("distance", 10),
            weight=request_data.get("weight"),
            is_fragile=request_data.get("is_fragile", False),
            is_urgent=request_data.get("is_urgent", False)
        )
        
        recommendation = transport_service.recommend_vehicle(recommendation_data)
        
        return {
            "success": True,
            "recommendation": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recommandation: {str(e)}")

@router.get("/options")
async def get_delivery_options():
    """Retourne la structure dynamique des options de livraison pour l'UI mobile"""
    return {
        "vehicle_types": [
            {"type": "moto", "label": "Livraison à moto", "min_price": 500},
            {"type": "voiture", "label": "Livraison en voiture", "min_price": 500},
            {"type": "interville", "label": "Intervilles", "min_price": 1990}
        ],
        "delivery_speeds": [
            {"key": "urgent", "label": "Urgent", "description": "", "min_price": 700, "delay": "30min"},
            {"key": "normal", "label": "Un peu plus long", "description": "Le coursier peut livrer un autre colis sur la route", "min_price": 600, "delay": "1h"},
            {"key": "slow", "label": "En 3 heures", "description": "", "min_price": 500, "delay": "3h"}
        ],
        "options": [
            {"key": "isotherme", "label": "Sac de livraison isotherme", "price": 0},
            {"key": "comment", "label": "Commentaire à l'attention du coursier"}
        ]
    }