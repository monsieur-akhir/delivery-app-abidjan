from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional
import os
from datetime import datetime

from .core.config import settings
from .db.base import Base
from .db.session import get_db
from .db.init_db import init_db
from .api import (
    auth, users, deliveries, ratings, gamification, market, wallet, traffic, manager, transport, assistant, courier, complaints, business
)
from .websockets import tracking

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
app.include_router(complaints.router, prefix=f"{settings.API_V1_STR}/complaints", tags=["complaints"])
app.include_router(business.router, prefix=f"{settings.API_V1_STR}/business", tags=["business"])

# Endpoint WebSocket pour le tracking en temps réel
@app.websocket("/ws/tracking/{delivery_id}")
async def websocket_tracking(websocket: WebSocket, delivery_id: int, db = Depends(get_db)):
    await tracking.tracking_endpoint(websocket, delivery_id, db)

# Import all models to initialize them correctly
from .models import *

# Événement de démarrage
@app.on_event("startup")
async def startup_event():
    # Créer les tables dans la base de données si elles n'existent pas
    from .db.base import engine
    Base.metadata.create_all(bind=engine)

    # Initialiser la base de données avec les données de base
    db = next(get_db())
    init_db(db)
    
    # Démarrer le nettoyage automatique des WebSockets
    from .websockets.tracking import start_cleanup_task
    await start_cleanup_task()

# Route de base
@app.get("/")
async def root():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }

# Route de santé
@app.get("/health")
async def health():
    return {"status": "ok"}

# Endpoints supplémentaires pour les clients
@app.get("/api/client/deliveries/active")
async def get_active_client_deliveries(
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les livraisons actives du client"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    from .services.delivery import get_user_active_deliveries
    return get_user_active_deliveries(db, current_user.id)

@app.get("/api/client/delivery-history")
async def get_client_delivery_history(
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des livraisons du client"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    from .services.delivery import get_deliveries_by_client
    return get_deliveries_by_client(db, current_user.id, skip, limit, status)

@app.get("/api/courier/delivery-history")
async def get_courier_delivery_history(
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    skip: int = 0,
    limit: int = 20,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique des livraisons du coursier"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    from .services.delivery import get_courier_deliveries
    return get_courier_deliveries(db, current_user.id, status, limit, skip)

# Endpoints pour les marchands
@app.get("/api/merchants/nearby")
async def get_nearby_merchants(
    commune: str = None,
    category: str = None,
    lat: float = None,
    lng: float = None,
    radius: float = 5.0,
    db: Session = Depends(get_db)
):
    """Récupérer les marchands à proximité"""
    from .services.market import get_nearby_merchants as get_merchants

    # Si commune est fournie, convertir en coordonnées
    if commune and not lat and not lng:
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

    return get_merchants(db, lat, lng, radius, category)

@app.get("/api/merchants/{merchant_id}")
async def get_merchant_details(
    merchant_id: int,
    db: Session = Depends(get_db)
):
    """Récupérer les détails d'un marchand"""
    from .services.market import get_merchant
    merchant = get_merchant(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Marchand non trouvé")
    return merchant

@app.get("/api/merchants/{merchant_id}/products")
async def get_merchant_products(
    merchant_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Récupérer les produits d'un marchand"""
    from .services.market import get_merchant_products
    return get_merchant_products(db, merchant_id, skip, limit)

# Endpoints météo
@app.get("/api/weather")
async def get_weather(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les données météo actuelles"""
    from .services.weather import get_current_weather
    return await get_current_weather(lat, lng)

@app.get("/api/weather/current")
async def get_current_weather_detailed(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les données météo actuelles détaillées"""
    from .services.weather import get_current_weather
    return await get_current_weather(lat, lng)

@app.get("/api/weather/forecast")
async def get_weather_forecast(
    lat: float,
    lng: float,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Récupérer les prévisions météo"""
    from .services.weather import get_weather_forecast_by_coordinates
    return await get_weather_forecast_by_coordinates(lat, lng, days)

@app.get("/api/weather/alerts")
async def get_weather_alerts_endpoint(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les alertes météo"""
    from .services.weather import get_weather_alerts
    return await get_weather_alerts(db, lat, lng)

# Endpoints pour les directions
@app.get("/api/directions")
async def get_directions(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les directions entre deux points"""
    from .services.directions import get_route_directions
    return await get_route_directions(start_lat, start_lng, end_lat, end_lng)

# Endpoint pour l'estimation de prix
@app.post("/api/deliveries/price-estimate")
async def estimate_delivery_price_endpoint(
    request: dict,
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison"""
    from .services.delivery import estimate_delivery_price

    # Extraire les paramètres de la requête
    pickup_lat = request.get("pickup_lat")
    pickup_lng = request.get("pickup_lng") 
    delivery_lat = request.get("delivery_lat")
    delivery_lng = request.get("delivery_lng")
    package_weight = request.get("package_weight")
    cargo_category = request.get("cargo_category") 
    is_fragile = request.get("is_fragile", False)
    is_express = request.get("is_express", False)

    # Vérifier les paramètres obligatoires
    if not all([pickup_lat, pickup_lng, delivery_lat, delivery_lng]):
        raise HTTPException(status_code=400, detail="Coordonnées de pickup et delivery requises")

    return estimate_delivery_price(
        pickup_lat,
        pickup_lng, 
        delivery_lat,
        delivery_lng,
        package_weight,
        cargo_category,
        is_fragile,
        is_express
    )

# Alias pour l'estimation de prix (compatibilité mobile)
@app.post("/api/v1/deliveries/estimate-price/")
async def estimate_delivery_price_v1_endpoint(
    request: dict,
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison (version v1)"""
    return await estimate_delivery_price_endpoint(request, db)

# Endpoint de création de livraison (compatibilité mobile)
@app.post("/api/v1/deliveries/")
async def create_delivery_v1_endpoint(
    delivery_data: dict,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle livraison (version v1)"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    from .services.delivery import create_delivery
    from .schemas.delivery import DeliveryCreate
    
    # Convertir le dict en DeliveryCreate
    delivery_create = DeliveryCreate(**delivery_data)
    return create_delivery(db, delivery_create, current_user)

# Endpoint de confirmation côté client
@app.post("/api/deliveries/{delivery_id}/client-confirm")
async def client_confirm_delivery_endpoint(
    delivery_id: int,
    confirm_data: dict,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Confirmer la livraison côté client avec notation"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    from .services.delivery import get_delivery
    from .services.rating import create_rating
    
    delivery = get_delivery(db, delivery_id)
    if delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    # Confirmer la livraison
    delivery.status = "completed"
    delivery.completed_at = datetime.utcnow()
    db.commit()
    
    # Créer une évaluation si fournie
    if "rating" in confirm_data and "comment" in confirm_data:
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
    
    return {"message": "Livraison confirmée avec succès"}

# Endpoint de matching intelligent
@app.post("/api/deliveries/smart-matching")
async def smart_matching_endpoint(
    delivery_request: dict,
    current_user = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Matching intelligent des coursiers pour une livraison"""
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    from .services.matching import MatchingService
    return await MatchingService.smart_matching(db, delivery_request, current_user.id)

# Endpoint d'autocomplétion d'adresses
@app.get("/api/deliveries/address-autocomplete")
async def address_autocomplete_endpoint(
    query: str = Query(..., min_length=2),
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Autocomplétion intelligente d'adresses pour Abidjan"""
    from .services.geolocation import get_address_suggestions
    
    user_location = None
    if user_lat is not None and user_lng is not None:
        user_location = {"latitude": user_lat, "longitude": user_lng}

    suggestions = await get_address_suggestions(db, query, user_location, limit)
    return {
        "success": True,
        "suggestions": suggestions,
        "query": query
    }

# Endpoint des lieux populaires
@app.get("/api/deliveries/popular-places")
async def popular_places_endpoint(
    user_lat: Optional[float] = Query(None),
    user_lng: Optional[float] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Récupérer les lieux populaires d'Abidjan"""
    from .services.geolocation import get_popular_places
    
    user_location = None
    if user_lat is not None and user_lng is not None:
        user_location = {"latitude": user_lat, "longitude": user_lng}

    places = await get_popular_places(db, user_location, category, limit)
    return {
        "success": True,
        "places": places
    }

from .api import business_analytics
app.include_router(business_analytics.router, prefix="/api/v1/business/analytics", tags=["business-analytics"])
# Importer les nouveaux routers
from .api import support, zones, promotions

# Ajouter après les autres includes
app.include_router(support.router, prefix="/api/v1/support", tags=["support"])
app.include_router(zones.router, prefix="/api/v1/zones", tags=["zones"])
app.include_router(promotions.router, prefix="/api/v1/promotions", tags=["promotions"])
