from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import logging
import asyncio

from ..db.session import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas import delivery as delivery_schemas
from ..services import delivery as delivery_service
from ..services.otp_delivery_service import OTPDeliveryService
from ..services import matching as matching_service
from ..services import geolocation as geolocation_service
from ..services.geolocation import get_google_places_suggestions
from ..services.transport_service import get_delivery_options

# Configuration du logger
logger = logging.getLogger(__name__)

router = APIRouter()

from ..services.delivery import get_delivery, get_courier_deliveries, get_user_deliveries_with_filters, create_delivery
from ..services.matching import MatchingService

# Schéma flexible pour l'autocomplétion
class FlexibleAutocompleteResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    status: str = "OK"
    query: Optional[str] = None

    class Config:
        extra = "allow"  # Accepte des champs supplémentaires

class CancelReason(BaseModel):
    reason: str = None

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
        from ..services.delivery import create_delivery

        # Traitement des données supplémentaires du frontend
        delivery_dict = delivery_data.dict(exclude_unset=True)

        # Informations du créateur (utilisateur connecté)
        delivery_dict['client_id'] = current_user.id
        delivery_dict['client_name'] = current_user.full_name or "Utilisateur"
        delivery_dict['client_phone'] = current_user.phone
        delivery_dict['client_email'] = current_user.email

        # Auto-remplir les contacts si vides
        if not delivery_dict.get('pickup_contact_name'):
            delivery_dict['pickup_contact_name'] = delivery_dict['client_name']
        if not delivery_dict.get('pickup_contact_phone'):
            delivery_dict['pickup_contact_phone'] = current_user.phone

        # Mapper les champs recipient vers delivery_contact
        if delivery_dict.get('recipient_name'):
            delivery_dict['delivery_contact_name'] = delivery_dict['recipient_name']
        if delivery_dict.get('recipient_phone'):
            delivery_dict['delivery_contact_phone'] = delivery_dict['recipient_phone']

        # Convertir les champs string en float si nécessaire
        if delivery_dict.get('weight'):
            try:
                delivery_dict['package_weight'] = float(delivery_dict['weight'])
            except (ValueError, TypeError):
                pass

        if delivery_dict.get('custom_price'):
            try:
                delivery_dict['proposed_price'] = float(delivery_dict['custom_price'])
            except (ValueError, TypeError):
                pass

        # Mapper les champs du frontend vers le backend
        if delivery_dict.get('description'):
            delivery_dict['package_description'] = delivery_dict['description']

        if delivery_dict.get('is_urgent'):
            delivery_dict['is_fragile'] = delivery_dict.get('is_urgent', False)

        # Gestion du type de véhicule
        if delivery_dict.get('vehicle_type'):
            vehicle_mapping = {
                'camion': 'truck',
                'moto': 'motorcycle',
                'voiture': 'car',
                'vélo': 'bicycle',
                'scooter': 'scooter',
                'van': 'van'
            }
            delivery_dict['required_vehicle_type'] = vehicle_mapping.get(
                delivery_dict['vehicle_type'].lower(), 
                delivery_dict['vehicle_type']
            )

        # Créer l'objet DeliveryCreate avec les données traitées
        processed_data = delivery_schemas.DeliveryCreate(**delivery_dict)

        delivery = create_delivery(db, processed_data, current_user.id)

        # Retourner la réponse avec les informations du créateur
        delivery_response = {
            "id": delivery.id,
            "client_id": delivery.client_id,
            "courier_id": delivery.courier_id,
            "pickup_address": delivery.pickup_address,
            "pickup_commune": delivery.pickup_commune,
            "pickup_lat": delivery.pickup_lat,
            "pickup_lng": delivery.pickup_lng,
            "pickup_contact_name": delivery.pickup_contact_name,
            "pickup_contact_phone": delivery.pickup_contact_phone,
            "delivery_address": delivery.delivery_address,
            "delivery_commune": delivery.delivery_commune,
            "delivery_lat": delivery.delivery_lat,
            "delivery_lng": delivery.delivery_lng,
            "delivery_contact_name": delivery.delivery_contact_name,
            "delivery_contact_phone": delivery.delivery_contact_phone,
            "package_description": delivery.package_description,
            "package_size": delivery.package_size,
            "package_weight": delivery.package_weight,
            "is_fragile": delivery.is_fragile,
            "cargo_category": delivery.cargo_category,
            "required_vehicle_type": delivery.required_vehicle_type,
            "proposed_price": delivery.proposed_price,
            "delivery_type": delivery.delivery_type,
            "final_price": delivery.final_price,
            "status": delivery.status,
            "estimated_distance": delivery.estimated_distance,
            "estimated_duration": delivery.estimated_duration,
            "actual_duration": delivery.actual_duration,
            "created_at": delivery.created_at,
            "accepted_at": delivery.accepted_at,
            "pickup_at": delivery.pickup_at,
            "delivered_at": delivery.delivered_at,
            "completed_at": delivery.completed_at,
            "cancelled_at": delivery.cancelled_at,
            "vehicle_id": delivery.vehicle_id,
            # Informations du créateur
            "client": {
                "id": current_user.id,
                "name": delivery_dict['client_name'],
                "phone": current_user.phone,
                "email": current_user.email,
                "role": current_user.role
            },
            "courier": None,
            "vehicle": None
        }

        return delivery_response

    except Exception as e:
        logger.error(f"Erreur création livraison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Erreur lors de la création: {str(e)}")

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

    # Sérialiser l'objet Delivery pour éviter les erreurs Pydantic
    delivery_dict = {
        "id": delivery.id,
        "client_id": delivery.client_id,
        "courier_id": delivery.courier_id,
        "pickup_address": delivery.pickup_address,
        "pickup_commune": delivery.pickup_commune,
        "pickup_lat": delivery.pickup_lat,
        "pickup_lng": delivery.pickup_lng,
        "pickup_contact_name": delivery.pickup_contact_name,
        "pickup_contact_phone": delivery.pickup_contact_phone,
        "delivery_address": delivery.delivery_address,
        "delivery_commune": delivery.delivery_commune,
        "delivery_lat": delivery.delivery_lat,
        "delivery_lng": delivery.delivery_lng,
        "delivery_contact_name": delivery.delivery_contact_name or '',
        "delivery_contact_phone": delivery.delivery_contact_phone or '',
        "package_description": delivery.package_description,
        "package_size": delivery.package_size,
        "package_weight": delivery.package_weight,
        "is_fragile": delivery.is_fragile,
        "cargo_category": delivery.cargo_category,
        "required_vehicle_type": delivery.required_vehicle_type,
        "proposed_price": delivery.proposed_price,
        "delivery_type": delivery.delivery_type,
        "final_price": delivery.final_price,
        "status": delivery.status,
        "estimated_distance": delivery.estimated_distance,
        "estimated_duration": delivery.estimated_duration,
        "actual_duration": delivery.actual_duration,
        "created_at": delivery.created_at,
        "accepted_at": delivery.accepted_at,
        "pickup_at": delivery.pickup_at,
        "delivered_at": delivery.delivered_at,
        "completed_at": delivery.completed_at,
        "cancelled_at": delivery.cancelled_at,
        "vehicle_id": delivery.vehicle_id,
        # Relations sérialisées en dictionnaires
        "client": None,
        "courier": None,
        "vehicle": None
    }

    return {
        "success": True,
        "delivery": delivery_dict
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

@router.get("/test-autocomplete")
async def test_autocomplete_endpoint(
    input: str = Query(..., description="Test simple"),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de test pour diagnostiquer l'autocomplétion
    """
    return {
        "message": "Test réussi",
        "input_received": input,
        "user_id": current_user.id,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/address-autocomplete")
async def address_autocomplete_get(
    input: str = Query(..., min_length=2, description="Texte de recherche pour l'autocomplétion"),
    current_user: User = Depends(get_current_user)
):
    """
    Autocomplétion d'adresses avec Google Places API (GET)
    """
    logger.info(f"[DEBUG] Appel GET /address-autocomplete avec input='{input}' (type: {type(input)})")
    try:
        logger.info(f"[DEBUG] Utilisateur courant: {current_user}")
        # Appeler le service de géolocalisation
        suggestions = await get_google_places_suggestions(input)
        logger.info(f"[DEBUG] Suggestions retournées: {suggestions}")
        # Retourner directement les données sans validation Pydantic stricte
        return {
            "predictions": suggestions,
            "status": "OK",
            "query": input
        }
    except Exception as e:
        logger.error(f"[ERROR] Exception dans /address-autocomplete: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'autocomplétion d'adresse"
        )

@router.get("/address-autocomplete/public")
async def address_autocomplete_public(
    input: str = Query(..., min_length=1, description="Texte de recherche pour l'autocomplétion")
):
    logger.info(f"[DEBUG] Appel GET /address-autocomplete/public avec input='{input}'")
    try:
        start = datetime.now()
        try:
            suggestions = await asyncio.wait_for(get_google_places_suggestions(input), timeout=8)
        except asyncio.TimeoutError:
            logger.warning(f"[TIMEOUT] L'appel à Google Places a dépassé 8s pour input='{input}'")
            return {
                "predictions": [],
                "status": "TIMEOUT",
                "query": input,
                "message": "Le service d'autocomplétion est temporairement lent. Veuillez réessayer."
            }
        elapsed = (datetime.now() - start).total_seconds()
        if elapsed > 5:
            logger.warning(f"[LENT] L'appel à Google Places a pris {elapsed:.2f}s pour input='{input}'")
        return {
            "predictions": suggestions,
            "status": "OK",
            "query": input
        }
    except Exception as e:
        logger.error(f"[ERROR] Exception dans /address-autocomplete/public: {str(e)}", exc_info=True)
        return {
            "predictions": [],
            "status": "ERROR",
            "query": input,
            "message": "Erreur lors de l'autocomplétion d'adresse. Veuillez réessayer plus tard."
        }

@router.post("/address-autocomplete/public")
async def address_autocomplete_public_post(
    search_data: dict = Body(..., description="Données de recherche")
):
    try:
        input_text = search_data.get("input", "").strip()
        if len(input_text) < 1:
            return {
                "predictions": [],
                "status": "INVALID_REQUEST",
                "query": input_text,
                "message": "Le terme de recherche ne peut pas être vide"
            }
        start = datetime.now()
        try:
            suggestions = await asyncio.wait_for(get_google_places_suggestions(input_text), timeout=8)
        except asyncio.TimeoutError:
            logger.warning(f"[TIMEOUT] L'appel à Google Places a dépassé 8s pour input='{input_text}'")
            return {
                "predictions": [],
                "status": "TIMEOUT",
                "query": input_text,
                "message": "Le service d'autocomplétion est temporairement lent. Veuillez réessayer."
            }
        elapsed = (datetime.now() - start).total_seconds()
        if elapsed > 5:
            logger.warning(f"[LENT] L'appel à Google Places a pris {elapsed:.2f}s pour input='{input_text}'")
        return {
            "predictions": suggestions,
            "status": "OK",
            "query": input_text
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'autocomplétion publique: {str(e)}")
        return {
            "predictions": [],
            "status": "ERROR",
            "query": search_data.get("input", ""),
            "message": "Erreur lors de l'autocomplétion d'adresse. Veuillez réessayer plus tard."
        }

@router.post("/address-autocomplete", response_model=FlexibleAutocompleteResponse)
async def address_autocomplete(
    search_data: dict = Body(..., description="Données de recherche"),
    current_user: User = Depends(get_current_user)
):
    try:
        input_text = search_data.get("input", "").strip()
        user_lat = search_data.get("lat")
        user_lng = search_data.get("lng")
        if len(input_text) < 2:
            return {
                "predictions": [],
                "status": "INVALID_REQUEST",
                "query": input_text,
                "message": "Le terme de recherche doit contenir au moins 2 caractères"
            }
        start = datetime.now()
        try:
            suggestions = await asyncio.wait_for(get_google_places_suggestions(
                input_text,
                user_lat=user_lat,
                user_lng=user_lng
            ), timeout=8)
        except asyncio.TimeoutError:
            logger.warning(f"[TIMEOUT] L'appel à Google Places a dépassé 8s pour input='{input_text}'")
            return {
                "predictions": [],
                "status": "TIMEOUT",
                "query": input_text,
                "message": "Le service d'autocomplétion est temporairement lent. Veuillez réessayer."
            }
        elapsed = (datetime.now() - start).total_seconds()
        if elapsed > 5:
            logger.warning(f"[LENT] L'appel à Google Places a pris {elapsed:.2f}s pour input='{input_text}'")
        return {
            "predictions": suggestions,
            "status": "OK",
            "query": input_text
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'autocomplétion: {str(e)}")
        return {
            "predictions": [],
            "status": "ERROR",
            "query": search_data.get("input", ""),
            "message": "Erreur lors de l'autocomplétion d'adresse. Veuillez réessayer plus tard."
        }

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
    """Obtenir les options de livraison disponibles"""
    return {
        "package_sizes": ["small", "medium", "large", "extra_large"],
        "delivery_types": ["standard", "express", "collaborative"],
        "cargo_categories": ["electronics", "clothing", "food", "fragile", "documents", "other"],
        "vehicle_types": ["bicycle", "motorcycle", "car", "van", "truck"]
    }

# Endpoints pour le suivi des consultations de coursiers
@router.get("/deliveries/{delivery_id}/consultations")
async def get_delivery_consultations(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer les consultations de coursiers pour une livraison
    """
    try:
        # Vérifier que la livraison existe et appartient à l'utilisateur
        delivery = get_delivery(db, delivery_id)
        if delivery.client_id != current_user.id and current_user.role not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Simuler les consultations (à remplacer par une vraie implémentation)
        consultations = [
            {
                "id": "1",
                "courier_id": "101",
                "courier_name": "Kouassi Jean",
                "courier_rating": 4.8,
                "consultation_time": datetime.now().isoformat(),
                "status": "viewing"
            },
            {
                "id": "2", 
                "courier_id": "102",
                "courier_name": "Traoré Fatou",
                "courier_rating": 4.6,
                "consultation_time": datetime.now().isoformat(),
                "status": "interested"
            }
        ]

        return {"consultations": consultations}

    except Exception as e:
        logger.error(f"Erreur récupération consultations: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur: {str(e)}")

@router.post("/deliveries/{delivery_id}/consultations")
async def record_courier_consultation(
    delivery_id: int,
    consultation_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enregistrer une consultation de coursier
    """
    try:
        # Vérifier que l'utilisateur est un coursier
        if current_user.role != "courier":
            raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent consulter")

        # Vérifier que la livraison existe
        delivery = get_delivery(db, delivery_id)

        # Enregistrer la consultation (simulation)
        consultation = {
            "id": f"{delivery_id}_{current_user.id}",
            "courier_id": str(current_user.id),
            "courier_name": current_user.full_name,
            "courier_rating": 4.5,  # À récupérer depuis le profil
            "consultation_time": datetime.now().isoformat(),
            "status": consultation_data.get("status", "viewing")
        }

        return consultation

    except Exception as e:
        logger.error(f"Erreur enregistrement consultation: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erreur: {str(e)}")

# Endpoints pour les enchères (bids)
@router.get("/deliveries/{delivery_id}/bids")
async def get_delivery_bids(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les enchères pour une livraison"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier les permissions
    if current_user.role not in ["admin", "manager"]:
        if delivery.client_id != current_user.id and delivery.courier_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

    bids = delivery_service.get_bids_for_delivery(db, delivery_id)

    return {
        "success": True,
        "bids": bids,
        "delivery_id": delivery_id
    }

@router.post("/deliveries/{delivery_id}/bids")
async def create_bid(
    delivery_id: int,
    bid_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une enchère pour une livraison"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent créer des enchères")

    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Cette livraison n'accepte plus d'enchères")

    try:
        bid = delivery_service.create_bid(db, delivery_id, current_user.id, bid_data)
        return {
            "success": True,
            "bid": bid,
            "message": "Enchère créée avec succès"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'enchère: {str(e)}")

@router.post("/deliveries/{delivery_id}/bids/{bid_id}/accept")
async def accept_bid(
    delivery_id: int,
    bid_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepter une enchère"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier que l'utilisateur est le client de la livraison
    if delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le client peut accepter une enchère")

    try:
        updated_delivery = delivery_service.accept_bid(db, delivery_id, bid_id, current_user.id)
        return {
            "success": True,
            "delivery": updated_delivery,
            "message": "Enchère acceptée avec succès"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'acceptation de l'enchère: {str(e)}")

@router.post("/deliveries/{delivery_id}/bids/{bid_id}/decline")
async def decline_bid(
    delivery_id: int,
    bid_id: int,
    reason: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refuser une enchère"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")

    # Vérifier que l'utilisateur est le client de la livraison
    if delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Seul le client peut refuser une enchère")

    try:
        # Marquer l'enchère comme refusée
        bid = delivery_service.get_bid(db, bid_id)
        bid.status = "rejected"
        db.commit()

        return {
            "success": True,
            "message": "Enchère refusée avec succès"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du refus de l'enchère: {str(e)}")

@router.get("/bids")
async def get_bids(
    delivery_id: Optional[int] = Query(None, description="ID de la livraison"),
    courier_id: Optional[int] = Query(None, description="ID du coursier"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les enchères avec filtres"""
    try:
        bids = delivery_service.get_bids(db, delivery_id=delivery_id, courier_id=courier_id)
        return {
            "success": True,
            "bids": bids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des enchères: {str(e)}")

@router.post("/deliveries/{delivery_id}/cancel")
async def cancel_delivery(
    delivery_id: int,
    reason_body: CancelReason,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annuler une livraison (accessible au client ou à l'entreprise)"""
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    # Vérifier que l'utilisateur est bien le client ou l'entreprise propriétaire
    if current_user.role not in ["client", "business", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if delivery.client_id != current_user.id and current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Seul le client ou un admin peut annuler")
    if delivery.status in ['delivered', 'completed']:
        raise HTTPException(status_code=400, detail="Cette livraison ne peut plus être annulée")
    delivery.status = 'cancelled'
    delivery.cancelled_at = datetime.utcnow()
    # Notifier le coursier si assigné
    if delivery.courier_id:
        # Remplace send_notification par ta fonction de notification réelle si besoin
        pass
    db.commit()
    return {"message": "Livraison annulée avec succès"}

@router.get("/delivery-options")
async def get_delivery_options_endpoint(
    package_type: str,
    package_size: str,
    package_weight: float,
    distance: float,
    is_fragile: bool = False,
    is_urgent: bool = False,
    weather_condition: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Obtenir les options de livraison en fonction des caractéristiques du colis
    """
    try:
        options = get_delivery_options(
            db=db,
            package_type=package_type,
            package_size=package_size,
            package_weight=package_weight,
            distance=distance,
            is_fragile=is_fragile,
            is_urgent=is_urgent,
            weather_condition=weather_condition
        )

        return {
            "success": True,
            "data": options
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des options de livraison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération des options: {str(e)}")

@router.post("/deliveries/{delivery_id}/bids/{bid_id}/counter-offer")
async def create_counter_offer(
    delivery_id: int,
    bid_id: int,
    counter_offer_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer une contre-offre pour une enchère existante.
    Le client peut proposer un nouveau prix en réponse à une enchère.
    """
    try:
        from ..services.delivery import get_delivery
        from ..services.bid import get_bid, create_counter_offer

        # Vérifier que la livraison existe et appartient au client
        delivery = get_delivery(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")

        if delivery.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Vérifier que l'enchère existe
        bid = get_bid(db, bid_id)
        if not bid or bid.delivery_id != delivery_id:
            raise HTTPException(status_code=404, detail="Enchère non trouvée")

        # Vérifier que la livraison n'est pas déjà acceptée
        if delivery.status in ['accepted', 'confirmed', 'picked_up', 'in_progress']:
            raise HTTPException(status_code=400, detail="La livraison a déjà été acceptée")

        # Extraire les données de la contre-offre
        new_price = counter_offer_data.get('proposed_price')
        message = counter_offer_data.get('message', '')

        if not new_price or new_price <= 0:
            raise HTTPException(status_code=400, detail="Prix invalide")

        # Créer la contre-offre
        counter_offer = create_counter_offer(
            db=db,
            original_bid_id=bid_id,
            new_price=new_price,
            message=message,
            client_id=current_user.id
        )

        return {
            "id": counter_offer.id,
            "original_bid_id": bid_id,
            "new_price": new_price,
            "message": message,
            "status": counter_offer.status,
            "created_at": counter_offer.created_at,
            "client_id": current_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur création contre-offre: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.post("/deliveries/{delivery_id}/bids/{bid_id}/counter-offer/{counter_offer_id}/respond")
async def respond_to_counter_offer(
    delivery_id: int,
    bid_id: int,
    counter_offer_id: int,
    response_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Répondre à une contre-offre (accepter, refuser, ou faire une nouvelle contre-offre).
    Le coursier peut accepter, refuser, ou faire une nouvelle proposition.
    """
    try:
        from ..services.delivery import get_delivery
        from ..services.bid import get_bid, get_counter_offer, respond_to_counter_offer

        # Vérifier que la livraison existe
        delivery = get_delivery(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")

        # Vérifier que l'enchère existe et appartient au coursier
        bid = get_bid(db, bid_id)
        if not bid or bid.delivery_id != delivery_id:
            raise HTTPException(status_code=404, detail="Enchère non trouvée")

        if bid.courier_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Vérifier que la contre-offre existe
        counter_offer = get_counter_offer(db, counter_offer_id)
        if not counter_offer or counter_offer.original_bid_id != bid_id:
            raise HTTPException(status_code=404, detail="Contre-offre non trouvée")

        # Extraire la réponse
        response_type = response_data.get('response_type')  # 'accept', 'decline', 'counter'
        new_price = response_data.get('new_price')
        message = response_data.get('message', '')

        if response_type not in ['accept', 'decline', 'counter']:
            raise HTTPException(status_code=400, detail="Type de réponse invalide")

        if response_type == 'counter' and (not new_price or new_price <= 0):
            raise HTTPException(status_code=400, detail="Prix invalide pour la contre-offre")

        # Traiter la réponse
        result = respond_to_counter_offer(
            db=db,
            counter_offer_id=counter_offer_id,
            response_type=response_type,
            new_price=new_price,
            message=message,
            courier_id=current_user.id
        )

        return {
            "success": True,
            "response_type": response_type,
            "counter_offer_id": counter_offer_id,
            "new_price": new_price if response_type == 'counter' else None,
            "message": message
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur réponse contre-offre: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.put("/deliveries/{delivery_id}")
async def update_delivery(
    delivery_id: int,
    update_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Modifier une livraison existante.
    Seul le client qui a créé la livraison peut la modifier.
    """
    try:
        from ..services.delivery import get_delivery, update_delivery_service

        # Vérifier que la livraison existe et appartient au client
        delivery = get_delivery(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")

        if delivery.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Vérifier que la livraison peut être modifiée
        if delivery.status not in ['pending', 'bidding']:
            raise HTTPException(status_code=400, detail="La livraison ne peut plus être modifiée")

        # Vérifier qu'aucune enchère n'a été acceptée
        from ..services.bid import get_accepted_bid
        accepted_bid = get_accepted_bid(db, delivery_id)
        if accepted_bid:
            raise HTTPException(status_code=400, detail="Une enchère a déjà été acceptée")

        # Mettre à jour la livraison
        updated_delivery = update_delivery_service(
            db=db,
            delivery_id=delivery_id,
            update_data=update_data,
            user_id=current_user.id
        )

        return {
            "id": updated_delivery.id,
            "pickup_address": updated_delivery.pickup_address,
            "delivery_address": updated_delivery.delivery_address,
            "package_description": updated_delivery.package_description,
            "package_size": updated_delivery.package_size,
            "package_weight": updated_delivery.package_weight,
            "is_fragile": updated_delivery.is_fragile,
            "proposed_price": updated_delivery.proposed_price,
            "status": updated_delivery.status,
            "updated_at": updated_delivery.updated_at
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur modification livraison: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@router.get("/deliveries/{delivery_id}/counter-offers")
async def get_counter_offers(
    delivery_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupérer toutes les contre-offres pour une livraison.
    """
    try:
        from ..services.delivery import get_delivery
        from ..services.bid import get_counter_offers_for_delivery

        # Vérifier que la livraison existe et appartient au client
        delivery = get_delivery(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")

        if delivery.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Récupérer les contre-offres
        counter_offers = get_counter_offers_for_delivery(db, delivery_id)

        return {
            "delivery_id": delivery_id,
            "counter_offers": [
                {
                    "id": co.id,
                    "original_bid_id": co.original_bid_id,
                    "new_price": co.new_price,
                    "message": co.message,
                    "status": co.status,
                    "created_at": co.created_at,
                    "responded_at": co.responded_at,
                    "response_type": co.response_type,
                    "courier_response_price": co.courier_response_price,
                    "courier_response_message": co.courier_response_message
                }
                for co in counter_offers
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération contre-offres: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

# ===============================
# ROUTES OTP POUR LES LIVRAISONS
# ===============================

@router.post("/{delivery_id}/otp/generate")
def generate_delivery_otp(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Générer et envoyer un code OTP pour la livraison
    """
    try:
        otp_service = OTPDeliveryService(db)
        result = otp_service.generate_and_send_otp(delivery_id)
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la génération OTP: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{delivery_id}/otp/verify")
def verify_delivery_otp(
    delivery_id: int,
    otp_data: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vérifier le code OTP pour la livraison
    """
    try:
        otp_code = otp_data.get("otp_code")
        if not otp_code:
            raise HTTPException(status_code=400, detail="Code OTP requis")

        otp_service = OTPDeliveryService(db)
        result = otp_service.verify_otp(delivery_id, otp_code, current_user.id)
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la vérification OTP: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{delivery_id}/otp/resend")
def resend_delivery_otp(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renvoyer le code OTP pour la livraison
    """
    try:
        otp_service = OTPDeliveryService(db)
        result = otp_service.resend_otp(delivery_id)
        return result
    except Exception as e:
        logger.error(f"Erreur lors du renvoi OTP: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{delivery_id}/otp/fallback")
def save_fallback_validation(
    delivery_id: int,
    validation_data: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sauvegarder une validation alternative (signature ou photo)
    """
    try:
        validation_type = validation_data.get("type")
        validation_content = validation_data.get("data")

        if not validation_type or not validation_content:
            raise HTTPException(status_code=400, detail="Type et données de validation requis")

        otp_service = OTPDeliveryService(db)
        result = otp_service.save_fallback_validation(
            delivery_id, validation_type, validation_content, current_user.id
        )
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde de validation alternative: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))