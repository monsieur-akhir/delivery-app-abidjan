from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import redis.asyncio as redis
import json
import logging
import os
from datetime import datetime, timedelta
import time

from .database import get_db, engine
from . import models, schemas, crud, auth
from .config import settings
from .websockets import ConnectionManager

# Initialiser les logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Créer les tables dans la base de données
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Livraison Abidjan API",
    description="API pour l'application de livraison à Abidjan",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware pour mesurer le temps de réponse
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Gestionnaire d'exceptions global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Exception non gérée: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur interne s'est produite. Veuillez réessayer plus tard."}
    )

# Initialiser le gestionnaire de connexions WebSocket
manager = ConnectionManager()

# Connexion Redis pour le cache et les WebSockets
redis_pool = None

@app.on_event("startup")
async def startup_db_client():
    global redis_pool
    redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL, 
        max_connections=10,
        decode_responses=True
    )
    logger.info("Connected to Redis")

@app.on_event("shutdown")
async def shutdown_db_client():
    global redis_pool
    if redis_pool:
        await redis_pool.disconnect()
    logger.info("Disconnected from Redis")

# Route de base
@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de Livraison Abidjan", "version": "1.0.0"}

# Route de santé
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Routes d'authentification
@app.post("/auth/register", response_model=schemas.UserResponse)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_phone(db, phone=user.phone)
    if db_user:
        raise HTTPException(status_code=400, detail="Numéro de téléphone déjà enregistré")
    return crud.create_user(db=db, user=user)

@app.post("/auth/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, user_credentials.phone, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Numéro de téléphone ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.phone, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Routes pour les utilisateurs
@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: schemas.UserResponse = Depends(auth.get_current_user)):
    return current_user

# Routes pour les livraisons
@app.post("/deliveries/", response_model=schemas.DeliveryResponse)
async def create_delivery(
    delivery: schemas.DeliveryCreate,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent créer des livraisons")
    return crud.create_delivery(db=db, delivery=delivery, client_id=current_user.id)

@app.get("/deliveries/", response_model=List[schemas.DeliveryResponse])
async def read_deliveries(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "client":
        return crud.get_deliveries_by_client(db, client_id=current_user.id, skip=skip, limit=limit, status=status)
    elif current_user.role == "courier":
        return crud.get_deliveries_by_courier(db, courier_id=current_user.id, skip=skip, limit=limit, status=status)
    elif current_user.role in ["business", "manager"]:
        return crud.get_deliveries(db, skip=skip, limit=limit, status=status)
    else:
        raise HTTPException(status_code=403, detail="Rôle non autorisé")

@app.get("/deliveries/{delivery_id}", response_model=schemas.DeliveryResponse)
async def read_delivery(
    delivery_id: int,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    delivery = crud.get_delivery(db, delivery_id=delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les autorisations
    if current_user.role == "client" and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette livraison")
    if current_user.role == "courier" and delivery.courier_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cette livraison")
    
    return delivery

@app.put("/deliveries/{delivery_id}/bid", response_model=schemas.DeliveryResponse)
async def bid_for_delivery(
    delivery_id: int,
    bid: schemas.BidCreate,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers peuvent enchérir")
    
    delivery = crud.get_delivery(db, delivery_id=delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Cette livraison n'est plus disponible pour enchérir")
    
    return crud.create  detail="Cette livraison n'est plus disponible pour enchérir")
    
    return crud.create_bid(db=db, delivery_id=delivery_id, courier_id=current_user.id, bid=bid)

@app.put("/deliveries/{delivery_id}/accept-bid/{courier_id}", response_model=schemas.DeliveryResponse)
async def accept_bid(
    delivery_id: int,
    courier_id: int,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent accepter une enchère")
    
    delivery = crud.get_delivery(db, delivery_id=delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à accepter cette enchère")
    
    if delivery.status != "pending":
        raise HTTPException(status_code=400, detail="Cette livraison n'est plus en attente")
    
    return crud.accept_bid(db=db, delivery_id=delivery_id, courier_id=courier_id)

@app.put("/deliveries/{delivery_id}/status", response_model=schemas.DeliveryResponse)
async def update_delivery_status(
    delivery_id: int,
    status_update: schemas.StatusUpdate,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    delivery = crud.get_delivery(db, delivery_id=delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les autorisations selon le rôle
    if current_user.role == "courier":
        if delivery.courier_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas le coursier assigné à cette livraison")
        
        # Vérifier les transitions d'état valides pour un coursier
        valid_transitions = {
            "accepted": ["in_progress"],
            "in_progress": ["delivered"],
        }
        
        if delivery.status not in valid_transitions or status_update.status not in valid_transitions.get(delivery.status, []):
            raise HTTPException(status_code=400, detail="Transition d'état non valide")
    
    elif current_user.role == "client":
        if delivery.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas le client de cette livraison")
        
        # Vérifier les transitions d'état valides pour un client
        valid_transitions = {
            "delivered": ["completed"],
        }
        
        if delivery.status not in valid_transitions or status_update.status not in valid_transitions.get(delivery.status, []):
            raise HTTPException(status_code=400, detail="Transition d'état non valide")
    
    elif current_user.role == "manager":
        # Les gestionnaires peuvent effectuer toutes les transitions
        pass
    
    else:
        raise HTTPException(status_code=403, detail="Rôle non autorisé")
    
    updated_delivery = crud.update_delivery_status(db=db, delivery_id=delivery_id, status=status_update.status)
    
    # Notifier les utilisateurs concernés via WebSocket
    notification = {
        "type": "delivery_status_update",
        "delivery_id": delivery_id,
        "status": status_update.status,
        "timestamp": datetime.now().isoformat()
    }
    
    # Notifier le client
    await manager.send_personal_message(json.dumps(notification), f"client_{delivery.client_id}")
    
    # Notifier le coursier s'il est assigné
    if delivery.courier_id:
        await manager.send_personal_message(json.dumps(notification), f"courier_{delivery.courier_id}")
    
    return updated_delivery

# Routes pour les évaluations
@app.post("/ratings/", response_model=schemas.RatingResponse)
async def create_rating(
    rating: schemas.RatingCreate,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    delivery = crud.get_delivery(db, delivery_id=rating.delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.status != "completed":
        raise HTTPException(status_code=400, detail="La livraison doit être complétée pour pouvoir laisser une évaluation")
    
    # Vérifier qui évalue qui
    if current_user.role == "client" and current_user.id == delivery.client_id:
        # Le client évalue le coursier
        if rating.rated_user_id != delivery.courier_id:
            raise HTTPException(status_code=400, detail="Vous ne pouvez évaluer que le coursier de cette livraison")
    
    elif current_user.role == "courier" and current_user.id == delivery.courier_id:
        # Le coursier évalue le client
        if rating.rated_user_id != delivery.client_id:
            raise HTTPException(status_code=400, detail="Vous ne pouvez évaluer que le client de cette livraison")
    
    else:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à créer cette évaluation")
    
    return crud.create_rating(db=db, rating=rating, rater_id=current_user.id)

@app.get("/ratings/me", response_model=List[schemas.RatingResponse])
async def read_my_ratings(
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_ratings_for_user(db, user_id=current_user.id)

# Routes pour la gamification
@app.get("/gamification/points", response_model=schemas.PointsResponse)
async def get_points(
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Seuls les coursiers ont des points de gamification")
    
    return crud.get_courier_points(db, courier_id=current_user.id)

@app.get("/gamification/leaderboard", response_model=List[schemas.LeaderboardEntry])
async def get_leaderboard(
    commune: Optional[str] = None,
    limit: int = 10,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_leaderboard(db, commune=commune, limit=limit)

# WebSocket pour le tracking en temps réel
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Si c'est une mise à jour de position d'un coursier
            if message.get("type") == "location_update" and client_id.startswith("courier_"):
                courier_id = int(client_id.split("_")[1])
                delivery_id = message.get("delivery_id")
                
                # Stocker la position dans Redis avec une expiration de 5 minutes
                r = redis.Redis(connection_pool=redis_pool)
                await r.setex(
                    f"location:{courier_id}:{delivery_id}",
                    300,  # 5 minutes
                    json.dumps({
                        "lat": message.get("lat"),
                        "lng": message.get("lng"),
                        "timestamp": datetime.now().isoformat()
                    })
                )
                
                # Transmettre la mise à jour au client concerné
                delivery = await crud.get_delivery_async(delivery_id)
                if delivery and delivery.client_id:
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "courier_location",
                            "courier_id": courier_id,
                            "delivery_id": delivery_id,
                            "lat": message.get("lat"),
                            "lng": message.get("lng"),
                            "timestamp": datetime.now().isoformat()
                        }),
                        f"client_{delivery.client_id}"
                    )
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Route pour obtenir la dernière position connue d'un coursier
@app.get("/tracking/{delivery_id}")
async def get_courier_location(
    delivery_id: int,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    delivery = crud.get_delivery(db, delivery_id=delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les autorisations
    if current_user.role == "client" and delivery.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à suivre cette livraison")
    
    if not delivery.courier_id:
        raise HTTPException(status_code=400, detail="Aucun coursier n'est assigné à cette livraison")
    
    # Récupérer la dernière position depuis Redis
    r = redis.Redis(connection_pool=redis_pool)
    location_data = await r.get(f"location:{delivery.courier_id}:{delivery_id}")
    
    if not location_data:
        return {"message": "Aucune position récente disponible"}
    
    return json.loads(location_data)

# Routes pour le marché intégré
@app.get("/marketplace/merchants", response_model=List[schemas.MerchantResponse])
async def get_merchants(
    commune: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return crud.get_merchants(db, commune=commune, category=category, skip=skip, limit=limit)

@app.get("/marketplace/products", response_model=List[schemas.ProductResponse])
async def get_products(
    merchant_id: Optional[int] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return crud.get_products(db, merchant_id=merchant_id, category=category, skip=skip, limit=limit)

# Routes pour la gestion d'entreprise
@app.get("/business/dashboard", response_model=schemas.BusinessDashboard)
async def get_business_dashboard(
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "business":
        raise HTTPException(status_code=403, detail="Accès réservé aux entreprises")
    
    return crud.get_business_dashboard(db, business_id=current_user.id)

# Routes pour les gestionnaires
@app.get("/manager/dashboard", response_model=schemas.ManagerDashboard)
async def get_manager_dashboard(
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Accès réservé aux gestionnaires")
    
    return crud.get_manager_dashboard(db)

@app.get("/manager/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Accès réservé aux gestionnaires")
    
    return crud.get_users(db, role=role, status=status, skip=skip, limit=limit)

@app.put("/manager/users/{user_id}/status", response_model=schemas.UserResponse)
async def update_user_status(
    user_id: int,
    status_update: schemas.UserStatusUpdate,
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "manager":
        raise HTTPException(status_code=403, detail="Accès réservé aux gestionnaires")
    
    return crud.update_user_status(db, user_id=user_id, status=status_update.status)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
