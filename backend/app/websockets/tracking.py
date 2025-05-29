from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
from jose import jwt

from ..db.session import get_db
from ..core.config import settings
from ..core.websocket_auth import get_current_user_ws
from ..models.delivery import Delivery, TrackingPoint
from ..models.user import User, UserRole

# Gestionnaire de connexions WebSocket
class ConnectionManager:
    def __init__(self):
        # Connexions actives par livraison
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Dernières positions par livraison
        self.last_positions: Dict[int, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, delivery_id: int):
        await websocket.accept()
        if delivery_id not in self.active_connections:
            self.active_connections[delivery_id] = []
        self.active_connections[delivery_id].append(websocket)
        
        # Envoyer la dernière position connue
        if delivery_id in self.last_positions:
            await websocket.send_json(self.last_positions[delivery_id])
    
    def disconnect(self, websocket: WebSocket, delivery_id: int):
        if delivery_id in self.active_connections:
            if websocket in self.active_connections[delivery_id]:
                self.active_connections[delivery_id].remove(websocket)
            
            # Supprimer la liste si elle est vide
            if not self.active_connections[delivery_id]:
                del self.active_connections[delivery_id]
    
    async def broadcast(self, delivery_id: int, message: Dict[str, Any]):
        # Stocker la dernière position
        self.last_positions[delivery_id] = message
        
        if delivery_id in self.active_connections:
            for connection in self.active_connections[delivery_id]:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    # La connexion est déjà fermée, on la supprime
                    self.disconnect(connection, delivery_id)
                except Exception as e:
                    print(f"Erreur lors de l'envoi du message: {str(e)}")

# Créer une instance du gestionnaire
manager = ConnectionManager()

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
        await manager.connect(websocket, delivery_id)
        
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
        except Exception as e:
            print(f"Erreur WebSocket: {str(e)}")
            manager.disconnect(websocket, delivery_id)
    except HTTPException:
        await websocket.close(code=4001, reason="Non authentifié")
    except Exception as e:
        print(f"Erreur d'authentification: {str(e)}")
        await websocket.close(code=4002, reason="Erreur d'authentification")
