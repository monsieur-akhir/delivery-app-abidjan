from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
from jose import jwt
import logging

from ..db.session import get_db
from ..core.config import settings
from ..core.websocket_auth import get_current_user_ws
from ..models.delivery import Delivery, TrackingPoint
from ..models.user import User, UserRole

# Configuration du logging
logger = logging.getLogger(__name__)

# Gestionnaire de connexions WebSocket amélioré
class ConnectionManager:
    def __init__(self):
        # Connexions actives par livraison
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Dernières positions par livraison
        self.last_positions: Dict[int, Dict[str, Any]] = {}
        # Informations sur les utilisateurs connectés
        self.user_connections: Dict[int, List[Dict[str, Any]]] = {}
        # Tâches de nettoyage
        self.cleanup_tasks: Dict[int, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, delivery_id: int, user: User):
        await websocket.accept()
        
        if delivery_id not in self.active_connections:
            self.active_connections[delivery_id] = []
            self.user_connections[delivery_id] = []
        
        self.active_connections[delivery_id].append(websocket)
        self.user_connections[delivery_id].append({
            "websocket": websocket,
            "user_id": user.id,
            "user_role": user.role,
            "connected_at": datetime.now()
        })
        
        logger.info(f"Utilisateur {user.id} connecté à la livraison {delivery_id}")
        
        # Envoyer la dernière position connue
        if delivery_id in self.last_positions:
            try:
                await websocket.send_json(self.last_positions[delivery_id])
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de la dernière position: {str(e)}")
    
    def disconnect(self, websocket: WebSocket, delivery_id: int):
        if delivery_id in self.active_connections:
            if websocket in self.active_connections[delivery_id]:
                self.active_connections[delivery_id].remove(websocket)
                logger.info(f"WebSocket déconnecté de la livraison {delivery_id}")
            
            # Supprimer l'utilisateur de la liste
            if delivery_id in self.user_connections:
                self.user_connections[delivery_id] = [
                    conn for conn in self.user_connections[delivery_id] 
                    if conn["websocket"] != websocket
                ]
            
            # Supprimer les listes si elles sont vides
            if not self.active_connections[delivery_id]:
                del self.active_connections[delivery_id]
                del self.user_connections[delivery_id]
                logger.info(f"Toutes les connexions fermées pour la livraison {delivery_id}")
    
    async def disconnect_user(self, user_id: int):
        """Déconnecter un utilisateur de toutes ses connexions"""
        deliveries_to_clean = []
        
        for delivery_id, connections in self.user_connections.items():
            user_connections = [
                conn for conn in connections 
                if conn["user_id"] == user_id
            ]
            
            for conn in user_connections:
                try:
                    await conn["websocket"].close(code=1000, reason="User logged out")
                except Exception as e:
                    logger.error(f"Erreur lors de la fermeture du WebSocket: {str(e)}")
                
                self.disconnect(conn["websocket"], delivery_id)
            
            if delivery_id in self.user_connections and not self.user_connections[delivery_id]:
                deliveries_to_clean.append(delivery_id)
        
        # Nettoyer les livraisons sans connexions
        for delivery_id in deliveries_to_clean:
            if delivery_id in self.active_connections:
                del self.active_connections[delivery_id]
            if delivery_id in self.user_connections:
                del self.user_connections[delivery_id]
            if delivery_id in self.last_positions:
                del self.last_positions[delivery_id]
        
        logger.info(f"Utilisateur {user_id} déconnecté de toutes les livraisons")
    
    async def broadcast(self, delivery_id: int, message: Dict[str, Any]):
        """Diffuser un message à tous les clients connectés à une livraison"""
        # Stocker la dernière position
        if message.get("type") == "position":
            self.last_positions[delivery_id] = message
        
        if delivery_id in self.active_connections:
            disconnected_websockets = []
            
            for connection in self.active_connections[delivery_id]:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    # La connexion est déjà fermée, on la marque pour suppression
                    disconnected_websockets.append(connection)
                except Exception as e:
                    logger.error(f"Erreur lors de l'envoi du message: {str(e)}")
                    disconnected_websockets.append(connection)
            
            # Nettoyer les connexions fermées
            for websocket in disconnected_websockets:
                self.disconnect(websocket, delivery_id)
    
    async def cleanup_inactive_connections(self):
        """Nettoyer les connexions inactives périodiquement"""
        while True:
            try:
                await asyncio.sleep(30)  # Vérifier toutes les 30 secondes
                
                current_time = datetime.now()
                deliveries_to_clean = []
                
                for delivery_id, connections in self.user_connections.items():
                    active_connections = []
                    
                    for conn in connections:
                        # Vérifier si la connexion est encore active
                        try:
                            # Envoyer un ping pour vérifier la connexion
                            await conn["websocket"].ping()
                            active_connections.append(conn)
                        except Exception:
                            # Connexion inactive, la supprimer
                            logger.info(f"Connexion inactive supprimée pour la livraison {delivery_id}")
                    
                    self.user_connections[delivery_id] = active_connections
                    
                    # Mettre à jour la liste des WebSockets actifs
                    if delivery_id in self.active_connections:
                        self.active_connections[delivery_id] = [
                            conn["websocket"] for conn in active_connections
                        ]
                    
                    # Si plus de connexions actives, nettoyer
                    if not active_connections:
                        deliveries_to_clean.append(delivery_id)
                
                # Nettoyer les livraisons sans connexions
                for delivery_id in deliveries_to_clean:
                    if delivery_id in self.active_connections:
                        del self.active_connections[delivery_id]
                    if delivery_id in self.user_connections:
                        del self.user_connections[delivery_id]
                    if delivery_id in self.last_positions:
                        del self.last_positions[delivery_id]
                    logger.info(f"Livraison {delivery_id} nettoyée - plus de connexions actives")
                    
            except Exception as e:
                logger.error(f"Erreur lors du nettoyage des connexions: {str(e)}")

# Créer une instance du gestionnaire
manager = ConnectionManager()

# Démarrer le nettoyage automatique
async def start_cleanup_task():
    """Démarrer la tâche de nettoyage automatique"""
    asyncio.create_task(manager.cleanup_inactive_connections())

# Endpoint WebSocket pour le tracking en temps réel
async def tracking_endpoint(
    websocket: WebSocket,
    delivery_id: int,
    db: Session = Depends(get_db)
):
    # Vérifier si la livraison existe
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        await websocket.close(code=4004, reason="Livraison non trouvée")
        return
    
    # Authentifier l'utilisateur
    try:
        user = await get_current_user_ws(websocket, db)
        
        # Vérifier les permissions
        if user.role != UserRole.manager and user.id != delivery.client_id and user.id != delivery.courier_id:
            await websocket.close(code=4003, reason="Accès non autorisé")
            return
        
        # Accepter la connexion
        await manager.connect(websocket, delivery_id, user)
        
        try:
            while True:
                # Attendre les messages du client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Si c'est le coursier qui envoie sa position
                if user.id == delivery.courier_id and "lat" in message and "lng" in message:
                    # Enregistrer la position dans la base de données
                    tracking_point = TrackingPoint(
                        delivery_id=delivery_id,
                        lat=message["lat"],
                        lng=message["lng"]
                    )
                    db.add(tracking_point)
                    db.commit()
                    
                    # Diffuser la position à tous les clients connectés
                    await manager.broadcast(
                        delivery_id,
                        {
                            "type": "position",
                            "delivery_id": delivery_id,
                            "lat": message["lat"],
                            "lng": message["lng"],
                            "timestamp": datetime.now().isoformat()
                        }
                    )
        except WebSocketDisconnect:
            manager.disconnect(websocket, delivery_id)
            logger.info(f"WebSocket déconnecté pour la livraison {delivery_id}")
        except Exception as e:
            logger.error(f"Erreur WebSocket: {str(e)}")
            manager.disconnect(websocket, delivery_id)
    except HTTPException as e:
        logger.error(f"Erreur d'authentification WebSocket: {str(e)}")
        await websocket.close(code=4001, reason="Non authentifié")
    except Exception as e:
        logger.error(f"Erreur d'authentification: {str(e)}")
        await websocket.close(code=4002, reason="Erreur d'authentification")
