from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .core.config import settings
from .db.base import Base
from .db.session import get_db
from .db.init_db import init_db
from .api import auth, users, deliveries, ratings, gamification, market, wallet, traffic, manager, transport
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
app.include_router(transport.router)

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
