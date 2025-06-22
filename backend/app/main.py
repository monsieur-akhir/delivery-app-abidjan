from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import os
from datetime import datetime
from dotenv import load_dotenv

from .core.config import settings
from .core.security import get_current_user
from .db.base import Base, engine
from .db.session import get_db
from .db.init_db import init_db
from .api import (
    auth, users, deliveries, ratings, gamification, market, wallet, traffic, 
    manager, transport, assistant, courier, complaints, business, business_analytics,
    support, zones, promotions, scheduled_deliveries
)
from .websockets import tracking
from .services.geolocation import get_google_places_suggestions

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# Créer l'application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="API pour l'application de livraison à Abidjan",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Monter le dossier des fichiers statiques
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Inclure les routes API
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentification"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Utilisateurs"])
app.include_router(deliveries.router, prefix=f"{settings.API_V1_STR}", tags=["Livraisons"])
app.include_router(ratings.router, prefix=f"{settings.API_V1_STR}/ratings", tags=["Évaluations"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}/gamification", tags=["Gamification"])
app.include_router(market.router, prefix=f"{settings.API_V1_STR}/market", tags=["Marché"])
app.include_router(wallet.router, prefix=f"{settings.API_V1_STR}/wallet", tags=["Portefeuille"])
app.include_router(traffic.router, prefix=f"{settings.API_V1_STR}/traffic", tags=["Trafic et Météo"])
app.include_router(manager.router, prefix=f"{settings.API_V1_STR}/manager", tags=["Gestionnaires"])
app.include_router(transport.router, prefix=f"{settings.API_V1_STR}/transport", tags=["Transport"])
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["Assistant"])
app.include_router(courier.router, prefix=f"{settings.API_V1_STR}/courier", tags=["Coursiers"])
app.include_router(complaints.router, prefix=f"{settings.API_V1_STR}/complaints", tags=["Réclamations"])
app.include_router(business.router, prefix=f"{settings.API_V1_STR}/business", tags=["Entreprises"])
app.include_router(business_analytics.router, prefix=f"{settings.API_V1_STR}/business/analytics", tags=["Analyses Entreprises"])
app.include_router(support.router, prefix=f"{settings.API_V1_STR}/support", tags=["Support"])
app.include_router(zones.router, prefix=f"{settings.API_V1_STR}/zones", tags=["Zones"])
app.include_router(promotions.router, prefix=f"{settings.API_V1_STR}/promotions", tags=["Promotions"])
app.include_router(scheduled_deliveries.router, prefix=f"{settings.API_V1_STR}/scheduled-deliveries", tags=["scheduled-deliveries"])

# Endpoint WebSocket pour le tracking en temps réel
@app.websocket("/ws/tracking/{delivery_id}")
async def websocket_tracking(websocket: WebSocket, delivery_id: int, db: Session = Depends(get_db)):
    await tracking.tracking_endpoint(websocket, delivery_id, db)

# Import all models to initialize them correctly
from .models import *

# Événement de démarrage
@app.on_event("startup")
async def startup_event():
    try:
        # Créer les tables dans la base de données si elles n'existent pas
        Base.metadata.create_all(bind=engine)

        # Initialiser la base de données avec les données de base
        db = next(get_db())
        init_db(db)

        # Démarrer le nettoyage automatique des WebSockets
        from .websockets.tracking import start_cleanup_task
        await start_cleanup_task()

        print(f"✅ Application {settings.APP_NAME} démarrée avec succès")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {str(e)}")
        raise

# Route de base
@app.get("/")
async def root():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "healthy"
    }

# Route de santé
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION
    }

# Endpoints supplémentaires pour les clients
@app.get("/api/client/deliveries/active")
async def get_active_client_deliveries(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons actives du client"""
    try:
        if current_user.role != "client":
            raise HTTPException(status_code=403, detail="Accès réservé aux clients")

        from .services.delivery import get_user_active_deliveries
        deliveries = get_user_active_deliveries(db, current_user.id)

        # Sérialiser les livraisons
        serialized_deliveries = [serialize_delivery(delivery) for delivery in deliveries]

        return {
            "success": True,
            "deliveries": serialized_deliveries,
            "count": len(serialized_deliveries)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des livraisons: {str(e)}")

@app.get("/api/client/delivery-history")
async def get_client_delivery_history(
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des livraisons du client"""
    try:
        if current_user.role != "client":
            raise HTTPException(status_code=403, detail="Accès réservé aux clients")

        from .services.delivery import get_deliveries_by_client
        deliveries = get_deliveries_by_client(db, current_user.id, skip, limit, status)

        # Sérialiser les livraisons
        serialized_deliveries = [serialize_delivery(delivery) for delivery in deliveries]

        return {
            "success": True,
            "deliveries": serialized_deliveries,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": len(serialized_deliveries)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'historique: {str(e)}")

@app.get("/api/courier/delivery-history")
async def get_courier_delivery_history(
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des livraisons du coursier"""
    try:
        if current_user.role != "courier":
            raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

        from .services.delivery import get_courier_deliveries
        deliveries = get_courier_deliveries(db, current_user.id, status, limit, skip)

        # Sérialiser les livraisons
        serialized_deliveries = [serialize_delivery(delivery) for delivery in deliveries]

        return {
            "success": True,
            "deliveries": serialized_deliveries,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": len(serialized_deliveries)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'historique: {str(e)}")

# Endpoints pour les marchands
@app.get("/api/merchants/nearby")
async def get_nearby_merchants(
    commune: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: float = Query(5.0, ge=0.1, le=50.0),
    db: Session = Depends(get_db)
):
    """Récupérer les marchands à proximité"""
    try:
        from .services.market import get_nearby_merchants as get_merchants

        # Coordonnées des communes d'Abidjan
        commune_coordinates = {
            "Abobo": {"lat": 5.4414, "lng": -4.0444},
            "Adjamé": {"lat": 5.3667, "lng": -4.0167},
            "Attécoubé": {"lat": 5.3333, "lng": -4.0333},
            "Cocody": {"lat": 5.3600, "lng": -3.9678},
            "Koumassi": {"lat": 5.3000, "lng": -3.9500},
            "Marcory": {"lat": 5.3000, "lng": -3.9833},
            "Plateau": {"lat": 5.3167, "lng": -4.0167},
            "Port-Bouët": {"lat": 5.2500, "lng": -3.9333},
            "Treichville": {"lat": 5.2833, "lng": -4.0000},
            "Yopougon": {"lat": 5.3167, "lng": -4.0833}
        }

        # Si commune est fournie, convertir en coordonnées
        if commune and not lat and not lng:
            if commune in commune_coordinates:
                lat = commune_coordinates[commune]["lat"]
                lng = commune_coordinates[commune]["lng"]
            else:
                # Coordonnées par défaut (centre d'Abidjan)
                lat = 5.3167
                lng = -4.0167

        # Si aucune coordonnée n'est fournie, utiliser le centre d'Abidjan
        if not lat or not lng:
            lat = 5.3167
            lng = -4.0167

        merchants = get_merchants(db, lat, lng, radius, category)
        return {
            "success": True,
            "merchants": merchants,
            "location": {"lat": lat, "lng": lng, "radius": radius},
            "filters": {"commune": commune, "category": category}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des marchands: {str(e)}")

@app.get("/api/merchants/{merchant_id}")
async def get_merchant_details(
    merchant_id: int,
    db: Session = Depends(get_db)
):
    """Récupérer les détails d'un marchand"""
    try:
        from .services.market import get_merchant
        merchant = get_merchant(db, merchant_id)
        if not merchant:
            raise HTTPException(status_code=404, detail="Marchand non trouvé")

        return {
            "success": True,
            "merchant": merchant
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du marchand: {str(e)}")

@app.get("/api/merchants/{merchant_id}/products")
async def get_merchant_products(
    merchant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Récupérer les produits d'un marchand"""
    try:
        from .services.market import get_merchant_products
        products = get_merchant_products(db, merchant_id, skip, limit)
        return {
            "success": True,
            "products": products,
            "merchant_id": merchant_id,
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": len(products)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des produits: {str(e)}")

# Endpoints météo
@app.get("/api/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    db: Session = Depends(get_db)
):
    """Récupérer les données météo actuelles"""
    try:
        from .services.weather import get_current_weather
        weather_data = await get_current_weather(lat, lng)
        return {
            "success": True,
            "weather": weather_data,
            "location": {"lat": lat, "lng": lng}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des données météo: {str(e)}")

@app.get("/api/weather/current")
async def get_current_weather_detailed(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    db: Session = Depends(get_db)
):
    """Récupérer les données météo actuelles détaillées"""
    try:
        from .services.weather import get_current_weather
        weather_data = await get_current_weather(lat, lng)
        return {
            "success": True,
            "weather": weather_data,
            "location": {"lat": lat, "lng": lng},
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des données météo: {str(e)}")

@app.get("/api/weather/forecast")
async def get_weather_forecast(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=14, description="Nombre de jours de prévision"),
    db: Session = Depends(get_db)
):
    """Récupérer les prévisions météo"""
    try:
        from .services.weather import get_weather_forecast_by_coordinates
        forecast_data = await get_weather_forecast_by_coordinates(lat, lng, days)
        return {
            "success": True,
            "forecast": forecast_data,
            "location": {"lat": lat, "lng": lng},
            "days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des prévisions: {str(e)}")

@app.get("/api/weather/alerts")
async def get_weather_alerts_endpoint(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    db: Session = Depends(get_db)
):
    """Récupérer les alertes météo"""
    try:
        from .services.weather import get_weather_alerts
        alerts = await get_weather_alerts(db, lat, lng)
        return {
            "success": True,
            "alerts": alerts,
            "location": {"lat": lat, "lng": lng}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des alertes: {str(e)}")

# Endpoints pour les directions
@app.get("/api/directions")
async def get_directions(
    start_lat: float = Query(..., description="Latitude de départ"),
    start_lng: float = Query(..., description="Longitude de départ"),
    end_lat: float = Query(..., description="Latitude d'arrivée"),
    end_lng: float = Query(..., description="Longitude d'arrivée"),
    db: Session = Depends(get_db)
):
    """Récupérer les directions entre deux points"""
    try:
        from .services.directions import get_route_directions
        directions = await get_route_directions(start_lat, start_lng, end_lat, end_lng)
        return {
            "success": True,
            "directions": directions,
            "start": {"lat": start_lat, "lng": start_lng},
            "end": {"lat": end_lat, "lng": end_lng}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des directions: {str(e)}")

# Endpoint pour l'estimation de prix
@app.post("/api/deliveries/price-estimate")
async def estimate_delivery_price_endpoint(
    request: dict,
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison"""
    try:
        from .services.delivery import estimate_delivery_price

        # Extraire les paramètres de la requête
        pickup_lat = request.get("pickup_lat")
        pickup_lng = request.get("pickup_lng") 
        delivery_lat = request.get("delivery_lat")
        delivery_lng = request.get("delivery_lng")
        package_weight = request.get("package_weight", 1.0)
        cargo_category = request.get("cargo_category", "standard") 
        is_fragile = request.get("is_fragile", False)
        is_express = request.get("is_express", False)

        # Vérifier les paramètres obligatoires
        if not all([pickup_lat, pickup_lng, delivery_lat, delivery_lng]):
            raise HTTPException(
                status_code=400, 
                detail="Coordonnées de pickup et delivery requises"
            )

        estimate = estimate_delivery_price(
            pickup_lat,
            pickup_lng, 
            delivery_lat,
            delivery_lng,
            package_weight,
            cargo_category,
            is_fragile,
            is_express
        )

        return {
            "success": True,
            "estimate": estimate,
            "parameters": {
                "pickup": {"lat": pickup_lat, "lng": pickup_lng},
                "delivery": {"lat": delivery_lat, "lng": delivery_lng},
                "package_weight": package_weight,
                "cargo_category": cargo_category,
                "is_fragile": is_fragile,
                "is_express": is_express
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'estimation: {str(e)}")

# Alias pour l'estimation de prix (compatibilité mobile)
@app.post("/api/v1/deliveries/estimate-price/")
async def estimate_delivery_price_v1_endpoint(
    request: dict,
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison (version v1)"""
    return await estimate_delivery_price_endpoint(request, db)

# Fonction utilitaire pour sérialiser un objet Delivery
def serialize_delivery(delivery):
    """Sérialise un objet Delivery en dictionnaire"""
    if not delivery:
        return None

    # Convertir l'objet Delivery en dictionnaire
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
        "delivery_contact_name": delivery.delivery_contact_name,
        "delivery_contact_phone": delivery.delivery_contact_phone,
        "package_description": delivery.package_description,
        "package_size": delivery.package_size,
        "package_weight": delivery.package_weight,
        "is_fragile": delivery.is_fragile,
        "cargo_category": delivery.cargo_category,
        "required_vehicle_type": delivery.required_vehicle_type,
        "proposed_price": delivery.proposed_price,
        "final_price": delivery.final_price,
        "total_discount": delivery.total_discount,
        "cashback_earned": delivery.cashback_earned,
        "applied_promotions": delivery.applied_promotions,
        "delivery_type": delivery.delivery_type,
        "status": delivery.status,
        "created_at": delivery.created_at.isoformat() if delivery.created_at else None,
        "accepted_at": delivery.accepted_at.isoformat() if delivery.accepted_at else None,
        "pickup_at": delivery.pickup_at.isoformat() if delivery.pickup_at else None,
        "delivered_at": delivery.delivered_at.isoformat() if delivery.delivered_at else None,
        "completed_at": delivery.completed_at.isoformat() if delivery.completed_at else None,
        "cancelled_at": delivery.cancelled_at.isoformat() if delivery.cancelled_at else None,
        "estimated_distance": delivery.estimated_distance,
        "estimated_duration": delivery.estimated_duration,
        "actual_duration": delivery.actual_duration,
        "vehicle_id": delivery.vehicle_id,
        "client": None,  # Ne pas inclure les relations pour éviter les erreurs
        "courier": None,
        "vehicle": None
    }

    return delivery_dict

@app.post("/api/v1/deliveries/")
async def create_delivery_v1_endpoint(
    delivery_data: dict,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle livraison (version v1)"""
    try:
        if current_user.role != "client":
            raise HTTPException(status_code=403, detail="Accès réservé aux clients")

        from .services.delivery import create_delivery
        from .schemas.delivery import DeliveryCreate

        # Convertir le dict en DeliveryCreate
        delivery_create = DeliveryCreate(**delivery_data)
        delivery = create_delivery(db, delivery_create, current_user)

        # Notifier les coursiers disponibles
        if delivery:
            background_tasks.add_task(
                notify_available_couriers,
                db,
                delivery.id
            )

        # Sérialiser l'objet delivery
        serialized_delivery = serialize_delivery(delivery)

        return {
            "success": True,
            "delivery": serialized_delivery,
            "message": "Livraison créée avec succès"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création: {str(e)}")

# Endpoint de confirmation côté client
@app.post("/api/deliveries/{delivery_id}/client-confirm")
async def client_confirm_delivery_endpoint(
    delivery_id: int,
    confirm_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison côté client avec notation"""
    try:
        if current_user.role != "client":
            raise HTTPException(status_code=403, detail="Accès réservé aux clients")

        from .services.delivery import get_delivery
        from .services.rating import create_rating

        delivery = get_delivery(db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Livraison non trouvée")

        if delivery.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

        # Confirmer la livraison
        delivery.status = "completed"
        delivery.completed_at = datetime.utcnow()
        db.commit()

        # Créer une évaluation si fournie
        if confirm_data.get("rating") and confirm_data.get("comment"):
            try:
                from .schemas.rating import RatingCreate
                rating_data = RatingCreate(
                    delivery_id=delivery_id,
                    rated_user_id=delivery.courier_id,
                    score=confirm_data["rating"],
                    comment=confirm_data["comment"]
                )
                create_rating(db, rating_data, current_user.id)
            except Exception as e:
                print(f"Erreur lors de la création de l'évaluation: {e}")

        return {
            "success": True,
            "message": "Livraison confirmée avec succès",
            "delivery_id": delivery_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la confirmation: {str(e)}")

# Endpoint de matching intelligent
@app.post("/api/deliveries/smart-matching")
async def smart_matching_endpoint(
    delivery_request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Matching intelligent des coursiers pour une livraison"""
    try:
        if current_user.role != "client":
            raise HTTPException(status_code=403, detail="Accès réservé aux clients")

        from .services.matching import MatchingService
        matches = await MatchingService.smart_matching(db, delivery_request, current_user.id)

        return {
            "success": True,
            "matches": matches,
            "count": len(matches)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du matching: {str(e)}")

# Endpoint des lieux populaires
@app.get("/api/deliveries/popular-places")
async def popular_places_endpoint(
    user_lat: Optional[float] = Query(None, description="Latitude utilisateur"),
    user_lng: Optional[float] = Query(None, description="Longitude utilisateur"),
    category: Optional[str] = Query(None, description="Catégorie de lieu"),
    limit: int = Query(10, ge=1, le=20, description="Nombre de lieux"),
    db: Session = Depends(get_db)
):
    """Récupérer les lieux populaires d'Abidjan"""
    try:
        from .services.geolocation import get_popular_places

        user_location = None
        if user_lat is not None and user_lng is not None:
            user_location = {"latitude": user_lat, "longitude": user_lng}

        places = await get_popular_places(db, user_location, category, limit)

        return {
            "success": True,
            "places": places,
            "filters": {
                "category": category,
                "user_location": user_location
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des lieux: {str(e)}")

# Fonction utilitaire pour notifier les coursiers
async def notify_available_couriers(db: Session, delivery_id: int):
    """Notifier les coursiers disponibles d'une nouvelle livraison"""
    try:
        from .services.notification import send_delivery_notification
        from .services.delivery import get_delivery
        from .models.user import User

        delivery = get_delivery(db, delivery_id)
        if not delivery:
            return

        # Récupérer les coursiers actifs dans la zone
        available_couriers = db.query(User).filter(
            User.role == "courier",
            User.status == "active"
        ).all()

        # Envoyer notification à chaque coursier
        for courier in available_couriers:
            await send_delivery_notification(
                db=db,
                user_id=courier.id,
                message=f"Nouvelle livraison disponible #{delivery_id}",
                delivery_id=delivery_id
            )
    except Exception as e:
        print(f"Erreur lors de la notification des coursiers: {e}")

# Gestionnaire d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Erreur globale: {str(exc)}")
    return {
        "success": False,
        "error": "Erreur interne du serveur",
        "message": "Une erreur inattendue s'est produite"
    }

# Middleware pour gérer les erreurs de connexion
@app.middleware("http")
async def connection_error_handler(request, call_next):
    """Gère les erreurs de connexion HTTP"""
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        # Log l'erreur mais ne la fait pas remonter
        print(f"⚠️  Erreur de connexion ignorée: {type(e).__name__}: {e}")
        # Retourner une réponse d'erreur propre
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"error": "Erreur de connexion temporaire", "detail": str(e)}
        )

# Middleware pour logger les requêtes
@app.middleware("http")
async def log_requests(request, call_next):
    """Log les requêtes avec gestion d'erreur"""
    try:
        start_time = datetime.now()
        response = await call_next(request)
        process_time = (datetime.now() - start_time).total_seconds()

        # Log seulement si le temps de traitement est > 1 seconde
        if process_time > 1.0:
            print(f"🐌 Requête lente: {request.method} {request.url.path} - {process_time:.2f}s")

        return response
    except Exception as e:
        print(f"❌ Erreur dans log_requests: {e}")
        raise

@app.get("/test-google-places")
async def test_google_places(query: str):
    """Test rapide du proxy Google Places (aucune authentification)"""
    suggestions = await get_google_places_suggestions(query)
    return {
        "status": "ok",
        "query": query,
        "suggestions": suggestions
    }