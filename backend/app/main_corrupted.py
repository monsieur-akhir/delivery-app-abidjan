from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from .core.config import settings
from .db.base import Base
from .db.session import get_db
from .db.init_db import init_db
from .api import auth, users, deliveries, ratings, gamification, market, wallet, traffic, manager, transport, assistant, courier
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
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monter le dossier des fichiers statiques
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Inclure les routes API
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentification"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Utilisateurs"])
app.include_router(deliveries.router, prefix=f"{settings.API_V1_STR}/deliveries", tags=["Livraisons"])
app.include_router(ratings.router, prefix=f"{settings.API_V1_STR}/ratings", tags=["Évaluations"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}/gamification", tags=["Gamification"])
app.include_router(market.router, prefix=f"{settings.API_V1_STR}/market", tags=["Marché"])
app.include_router(wallet.router, prefix=f"{settings.API_V1_STR}/wallet", tags=["Portefeuille"])
app.include_router(traffic.router, prefix=f"{settings.API_V1_STR}/traffic", tags=["Trafic et Météo"])
app.include_router(manager.router, prefix=f"{settings.API_V1_STR}/manager", tags=["Gestionnaires"])
app.include_router(transport.router, prefix=f"{settings.API_V1_STR}/transport", tags=["Transport"])
app.include_router(assistant.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["Assistant"])
app.include_router(courier.router, prefix=f"{settings.API_V1_STR}/courier", tags=["Coursiers"])

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
    
    from .services.delivery import get_user_deliveries
    return get_user_deliveries(db, current_user.id, status="active")

# Endpoints pour les marchands
@app.get("/merchants/nearby")
async def get_nearby_merchants(
    lat: float,
    lng: float,
    radius: float = 5.0,
    db: Session = Depends(get_db)
):
    """Récupérer les marchands à proximité"""
    from .services.market import get_nearby_merchants as get_merchants
    return get_merchants(db, lat, lng, radius)

@app.get("/merchants/{merchant_id}")
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

@app.get("/merchants/{merchant_id}/products")
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
    """Récupérer les données météo"""
    from .services.weather import get_current_weather
    return get_current_weather(lat, lng)

@app.get("/api/weather/current")
async def get_current_weather_detailed(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les données météo actuelles détaillées"""
    from .services.weather import get_current_weather
    return get_current_weather(lat, lng)

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
async def get_weather_alerts(
    lat: float,
    lng: float,
    db: Session = Depends(get_db)
):
    """Récupérer les alertes météo"""
    from .services.weather import get_weather_alerts
    return get_weather_alerts(lat, lng)

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
    return get_route_directions(start_lat, start_lng, end_lat, end_lng)

# Endpoint pour l'estimation de prix
@app.post("/api/deliveries/price-estimate")
async def estimate_delivery_price(
    request: dict,
    db: Session = Depends(get_db)
):
    """Estimer le prix d'une livraison"""
    from .services.delivery import estimate_delivery_price
    return estimate_delivery_price(db, request)
