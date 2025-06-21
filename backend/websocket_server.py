#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Serveur WebSocket pour Livraison Abidjan
Gère les connexions en temps réel pour le suivi des livraisons, les notifications et le chat.
"""

import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime
from typing import Dict, List, Optional, Set, Union

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("websocket_server")

# Création de l'application FastAPI
app = FastAPI(
    title="Livraison Abidjan WebSocket Server",
    description="Serveur WebSocket pour les communications en temps réel",
    version="1.0.0",
)

# Configuration CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_pool = None


# Modèles de données
class WebSocketMessage(BaseModel):
    type: str
    payload: dict
    room: Optional[str] = None
    sender_id: Optional[str] = None
    timestamp: Optional[datetime] = None

    @field_validator("timestamp", mode="before")
    @classmethod
    def set_timestamp(cls, v):
        return v or datetime.utcnow()

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


# Gestionnaire de connexions WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_subscriber = None
        self.listening = False

    async def connect(self, websocket: WebSocket, user_id: str, room: Optional[str] = None):
        await websocket.accept()
        
        # Ajouter à la liste des connexions par utilisateur
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        
        # Ajouter à la liste des connexions par salle
        if room:
            if room not in self.active_connections:
                self.active_connections[room] = []
            self.active_connections[room].append(websocket)
        
        logger.info(f"Client connecté: user_id={user_id}, room={room}")
        
        # Envoyer un message de bienvenue
        await self.send_personal_message(
            WebSocketMessage(
                type="connection_established",
                payload={"message": "Connexion établie avec succès"},
                sender_id="system",
                room=room,
            ),
            websocket,
        )
        
        # S'abonner au canal Redis si pas déjà fait
        if redis_pool and not self.listening:
            await self.start_redis_listener()

    async def disconnect(self, websocket: WebSocket, user_id: str, room: Optional[str] = None):
        # Supprimer des connexions par utilisateur
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Supprimer des connexions par salle
        if room and room in self.active_connections:
            if websocket in self.active_connections[room]:
                self.active_connections[room].remove(websocket)
            if not self.active_connections[room]:
                del self.active_connections[room]
        
        logger.info(f"Client déconnecté: user_id={user_id}, room={room}")

    async def broadcast(self, message: WebSocketMessage, room: Optional[str] = None):
        """Diffuse un message à tous les clients d'une salle spécifique ou à tous les clients."""
        if room and room in self.active_connections:
            for connection in self.active_connections[room]:
                await self.send_personal_message(message, connection)
        elif not room:
            # Diffuser à tous les clients
            for room_connections in self.active_connections.values():
                for connection in room_connections:
                    await self.send_personal_message(message, connection)

    async def send_personal_message(self, message: WebSocketMessage, websocket: WebSocket):
        """Envoie un message à un client spécifique."""
        try:
            await websocket.send_text(message.json())
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi du message: {str(e)}")

    async def send_to_user(self, message: WebSocketMessage, user_id: str):
        """Envoie un message à tous les appareils d'un utilisateur spécifique."""
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                await self.send_personal_message(message, connection)

    async def start_redis_listener(self):
        """Démarre l'écoute des messages Redis."""
        if self.listening:
            return
        
        try:
            self.listening = True
            if redis_pool:
                # Utiliser pubsub correctement avec redis.from_url
                pubsub = redis_pool.pubsub()
                await pubsub.subscribe("notifications", "tracking", "chat")
                self.redis_subscriber = pubsub
                
                # Démarrer la tâche d'écoute
                asyncio.create_task(self.redis_listener())
                logger.info("Écoute Redis démarrée")
            else:
                logger.info("Redis non disponible, mode WebSocket seul")
        except Exception as e:
            logger.warning(f"Redis non disponible, mode WebSocket seul: {str(e)}")
            self.listening = False

    async def redis_listener(self):
        """Écoute les messages Redis et les transmet aux clients WebSocket."""
        try:
            while True:
                message = await self.redis_subscriber.get_message(ignore_subscribe_messages=True)
                if message:
                    try:
                        data = json.loads(message["data"])
                        ws_message = WebSocketMessage(**data)
                        
                        # Diffuser selon le type de message
                        if ws_message.room:
                            await self.broadcast(ws_message, ws_message.room)
                        elif ws_message.payload.get("recipient_id"):
                            await self.send_to_user(ws_message, ws_message.payload["recipient_id"])
                        else:
                            await self.broadcast(ws_message)
                    except Exception as e:
                        logger.error(f"Erreur lors du traitement du message Redis: {str(e)}")
                
                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            logger.info("Tâche d'écoute Redis annulée")
        except Exception as e:
            logger.error(f"Erreur dans l'écouteur Redis: {str(e)}")
            # Redémarrer l'écouteur après une courte pause
            await asyncio.sleep(5)
            asyncio.create_task(self.redis_listener())


# Instance du gestionnaire de connexions
manager = ConnectionManager()


@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage du serveur."""
    global redis_pool
    logger.info("Démarrage du serveur WebSocket")
    try:
        # Créer la connection pool Redis correctement
        redis_pool = redis.from_url(REDIS_URL, decode_responses=True)
        # Test de la connexion Redis
        await redis_pool.ping()
        logger.info("Connexion Redis établie")
    except Exception as e:
        logger.warning(f"Redis non disponible, mode WebSocket seul: {str(e)}")
        redis_pool = None
    
    # Note: Signal handlers ne sont pas supportés sur Windows avec asyncio
    # La gestion des signaux est gérée par uvicorn directement


@app.on_event("shutdown")
async def shutdown_event(sig=None):
    """Nettoyage à l'arrêt du serveur."""
    if sig:
        logger.info(f"Signal reçu: {sig.name}")
    logger.info("Arrêt du serveur WebSocket")
    
    # Fermer toutes les connexions WebSocket
    for room_connections in manager.active_connections.values():
        for connection in room_connections:
            try:
                await connection.close()
            except:
                pass
    
    # Fermer la connexion Redis
    if redis_pool:
        await redis_pool.disconnect()


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, room: Optional[str] = None):
    """Point d'entrée WebSocket principal."""
    
    # Authentification WebSocket
    from app.core.dependencies import get_current_user_ws
    from app.db.session import get_db
    
    db = None
    try:
        # Obtenir une session de base de données
        db_gen = get_db()
        db = next(db_gen)
        
        # Vérifier l'authentification
        user = await get_current_user_ws(websocket, db)
        
        # Vérifier que l'utilisateur correspond à l'ID fourni
        if str(user.id) != user_id:
            logger.warning(f"WebSocket: User ID mismatch - token: {user.id}, requested: {user_id}")
            await websocket.close(code=4001, reason="User ID mismatch")
            return
            
    except HTTPException as e:
        if e.status_code == 401:
            logger.warning(f"WebSocket: Token expiré ou invalide pour user_id {user_id}")
            await websocket.close(code=4001, reason="Token expired or invalid")
        else:
            logger.error(f"WebSocket: Erreur d'authentification HTTP {e.status_code}: {e.detail}")
            await websocket.close(code=4002, reason="Authentication error")
        return
    except Exception as e:
        logger.error(f"WebSocket: Erreur d'authentification inattendue: {str(e)}")
        await websocket.close(code=4003, reason="Authentication failed")
        return
    finally:
        # Fermer la session de base de données proprement
        if db:
            db.close()
    
    await manager.connect(websocket, user_id, room)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                message = WebSocketMessage(**message_data)
                
                # Traiter le message selon son type
                if message.type == "chat":
                    # Stocker le message dans Redis et diffuser
                    if redis_pool:
                        await redis_pool.publish("chat", message.json())
                    
                    # Diffuser directement
                    if message.room:
                        await manager.broadcast(message, message.room)
                
                elif message.type == "tracking_update":
                    # Mettre à jour le suivi et diffuser
                    if redis_pool:
                        await redis_pool.publish("tracking", message.json())
                
                elif message.type == "heartbeat":
                    # Répondre au heartbeat
                    await manager.send_personal_message(
                        WebSocketMessage(
                            type="heartbeat_response",
                            payload={"status": "alive", "timestamp": datetime.utcnow()},
                            sender_id="system"
                        ),
                        websocket
                    )
                
                else:
                    # Messages inconnus sont simplement diffusés dans la salle
                    if message.room:
                        await manager.broadcast(message, message.room)
            
            except json.JSONDecodeError:
                logger.warning(f"Message non JSON reçu: {data}")
                await manager.send_personal_message(
                    WebSocketMessage(
                        type="error",
                        payload={"message": "Format JSON invalide"},
                        sender_id="system"
                    ),
                    websocket
                )
            
            except Exception as e:
                logger.error(f"Erreur de traitement du message: {str(e)}")
                await manager.send_personal_message(
                    WebSocketMessage(
                        type="error",
                        payload={"message": "Erreur de traitement du message"},
                        sender_id="system"
                    ),
                    websocket
                )
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id, room)
    
    except Exception as e:
        logger.error(f"Erreur WebSocket: {str(e)}")
        await manager.disconnect(websocket, user_id, room)


@app.get("/health")
async def health_check():
    """Vérification de santé du serveur WebSocket."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/send-notification/{user_id}")
async def send_notification(user_id: str, message: WebSocketMessage):
    """API pour envoyer une notification à un utilisateur spécifique."""
    await manager.send_to_user(message, user_id)
    return {"status": "sent", "recipient": user_id}


@app.post("/broadcast/{room}")
async def broadcast_message(room: str, message: WebSocketMessage):
    """API pour diffuser un message dans une salle spécifique."""
    await manager.broadcast(message, room)
    return {"status": "broadcasted", "room": room}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(
        "websocket_server:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
