#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Worker de traitement asynchrone pour Livraison Abidjan
Gère les tâches de fond comme les notifications, emails, et traitements par lots.
"""

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

import redis
import requests
from celery import Celery, signals
from celery.schedules import crontab
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("worker")

# Configuration Celery
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
app = Celery("livraison_worker", broker=REDIS_URL, backend=REDIS_URL)

# Charger la configuration
app.config_from_object("celeryconfig")

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/livraison_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Configuration Redis
redis_client = redis.Redis.from_url(REDIS_URL)


@signals.worker_ready.connect
def on_worker_ready(**_):
    """Exécuté lorsque le worker est prêt."""
    logger.info("Worker Celery démarré et prêt à traiter les tâches")


@signals.worker_shutdown.connect
def on_worker_shutdown(**_):
    """Exécuté lors de l'arrêt du worker."""
    logger.info("Worker Celery en cours d'arrêt")


# Tâches Celery
@app.task(name="send_sms_notification", bind=True, max_retries=3)
def send_sms_notification(self, phone_number: str, message: str) -> Dict:
    """Envoie une notification SMS à un utilisateur."""
    logger.info(f"Envoi de SMS à {phone_number}: {message}")
    
    sms_provider = os.getenv("SMS_PROVIDER", "console")
    
    try:
        if sms_provider == "console":
            # Mode développement - juste logger
            logger.info(f"SMS à {phone_number}: {message}")
            return {"status": "sent", "provider": "console"}
        
        elif sms_provider == "twilio":
            # Configuration Twilio
            from twilio.rest import Client
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_FROM_NUMBER")
            
            client = Client(account_sid, auth_token)
            response = client.messages.create(
                body=message,
                from_=from_number,
                to=phone_number
            )
            return {"status": "sent", "provider": "twilio", "message_id": response.sid}
        
        elif sms_provider == "africatalking":
            # Configuration Africa's Talking
            import africastalking
            username = os.getenv("AT_USERNAME")
            api_key = os.getenv("AT_API_KEY")
            sender = os.getenv("AT_SENDER_ID")
            
            africastalking.initialize(username, api_key)
            sms = africastalking.SMS
            response = sms.send(message, [phone_number], sender)
            return {"status": "sent", "provider": "africatalking", "response": response}
        
        else:
            raise ValueError(f"Fournisseur SMS inconnu: {sms_provider}")
    
    except Exception as e:
        logger.error(f"Erreur d'envoi SMS: {str(e)}")
        # Réessayer après un délai
        retry_delay = 60 * (2 ** self.request.retries)  # Backoff exponentiel
        raise self.retry(exc=e, countdown=retry_delay)


@app.task(name="send_push_notification", bind=True, max_retries=3)
def send_push_notification(self, user_id: str, title: str, body: str, data: Optional[Dict] = None) -> Dict:
    """Envoie une notification push à un appareil utilisateur."""
    logger.info(f"Envoi de notification push à l'utilisateur {user_id}: {title}")
    
    try:
        # Récupérer les tokens FCM de l'utilisateur
        with SessionLocal() as db:
            # Cette partie dépend du modèle de données
            from app.models.notification import DeviceToken
            tokens = db.query(DeviceToken).filter_by(user_id=user_id, active=True).all()
            device_tokens = [token.token for token in tokens]
        
        if not device_tokens:
            logger.warning(f"Aucun token d'appareil trouvé pour l'utilisateur {user_id}")
            return {"status": "skipped", "reason": "no_tokens"}
        
        # Envoyer à Firebase Cloud Messaging
        fcm_api_key = os.getenv("FCM_API_KEY")
        if not fcm_api_key:
            logger.warning("Clé API FCM non configurée")
            return {"status": "skipped", "reason": "no_fcm_key"}
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"key={fcm_api_key}"
        }
        
        payload = {
            "notification": {
                "title": title,
                "body": body,
                "sound": "default"
            },
            "data": data or {},
            "registration_ids": device_tokens
        }
        
        response = requests.post(
            "https://fcm.googleapis.com/fcm/send",
            headers=headers,
            data=json.dumps(payload),
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Notification push envoyée: {result}")
            
            # Désactiver les tokens invalides
            if "results" in result:
                with SessionLocal() as db:
                    for i, res in enumerate(result["results"]):
                        if "error" in res and res["error"] in ("NotRegistered", "InvalidRegistration"):
                            token_to_disable = device_tokens[i]
                            db.query(DeviceToken).filter_by(token=token_to_disable).update({
                                "active": False,
                                "updated_at": datetime.utcnow()
                            })
                    db.commit()
            
            return {"status": "sent", "result": result}
        else:
            logger.error(f"Échec d'envoi FCM: {response.status_code} {response.text}")
            raise Exception(f"Échec FCM: {response.status_code}")
    
    except Exception as e:
        logger.error(f"Erreur d'envoi de notification push: {str(e)}")
        # Réessayer après un délai
        retry_delay = 60 * (2 ** self.request.retries)  # Backoff exponentiel
        raise self.retry(exc=e, countdown=retry_delay)


@app.task(name="process_delivery_status_updates", bind=True)
def process_delivery_status_updates(self) -> Dict:
    """Traite les mises à jour de statut de livraison en attente."""
    logger.info("Traitement des mises à jour de statut de livraison")
    
    try:
        with SessionLocal() as db:
            # Cette partie dépend du modèle de données
            from app.models.delivery import Delivery, DeliveryStatus, DeliveryStatusUpdate
            from app.models.notification import Notification, NotificationType
            
            # Récupérer les mises à jour en attente
            pending_updates = db.query(DeliveryStatusUpdate).filter_by(processed=False).limit(100).all()
            
            if not pending_updates:
                logger.info("Aucune mise à jour de statut en attente")
                return {"status": "completed", "updates_processed": 0}
            
            updates_processed = 0
            
            for update in pending_updates:
                try:
                    # Mettre à jour le statut de la livraison
                    delivery = db.query(Delivery).filter_by(id=update.delivery_id).first()
                    
                    if delivery:
                        old_status = delivery.status
                        delivery.status = update.new_status
                        delivery.updated_at = datetime.utcnow()
                        
                        # Créer des notifications
                        if update.new_status == DeliveryStatus.PICKED_UP:
                            # Notification au client
                            notification = Notification(
                                user_id=delivery.client_id,
                                type=NotificationType.DELIVERY_UPDATE,
                                title="Livraison en cours",
                                message=f"Votre colis a été récupéré par le coursier.",
                                data={"delivery_id": str(delivery.id), "status": update.new_status.name}
                            )
                            db.add(notification)
                            
                            # Tâche d'envoi de notification push
                            send_push_notification.delay(
                                str(delivery.client_id),
                                "Livraison en cours",
                                f"Votre colis a été récupéré par le coursier.",
                                {"delivery_id": str(delivery.id), "status": update.new_status.name}
                            )
                        
                        elif update.new_status == DeliveryStatus.DELIVERED:
                            # Notification au client
                            notification = Notification(
                                user_id=delivery.client_id,
                                type=NotificationType.DELIVERY_UPDATE,
                                title="Livraison terminée",
                                message=f"Votre colis a été livré avec succès.",
                                data={"delivery_id": str(delivery.id), "status": update.new_status.name}
                            )
                            db.add(notification)
                            
                            # Tâche d'envoi de notification push
                            send_push_notification.delay(
                                str(delivery.client_id),
                                "Livraison terminée",
                                f"Votre colis a été livré avec succès.",
                                {"delivery_id": str(delivery.id), "status": update.new_status.name}
                            )
                            
                            # Notification au coursier pour demander une évaluation
                            notification = Notification(
                                user_id=delivery.courier_id,
                                type=NotificationType.RATE_DELIVERY,
                                title="Évaluez votre livraison",
                                message=f"Vous avez terminé une livraison. Merci de l'évaluer.",
                                data={"delivery_id": str(delivery.id), "action": "rate"}
                            )
                            db.add(notification)
                        
                        # Marquer la mise à jour comme traitée
                        update.processed = True
                        update.processed_at = datetime.utcnow()
                        
                        # Publier la mise à jour sur Redis
                        event_data = {
                            "type": "delivery_status_update",
                            "payload": {
                                "delivery_id": str(delivery.id),
                                "old_status": old_status.name,
                                "new_status": update.new_status.name,
                                "timestamp": datetime.utcnow().isoformat()
                            },
                            "room": f"delivery_{delivery.id}"
                        }
                        redis_client.publish("tracking", json.dumps(event_data))
                        
                        updates_processed += 1
                
                except Exception as e:
                    logger.error(f"Erreur lors du traitement de la mise à jour {update.id}: {str(e)}")
                    continue
            
            db.commit()
            logger.info(f"Traitement terminé: {updates_processed} mises à jour traitées")
            return {"status": "completed", "updates_processed": updates_processed}
    
    except Exception as e:
        logger.error(f"Erreur lors du traitement des mises à jour de statut: {str(e)}")
        return {"status": "error", "error": str(e)}


@app.task(name="clean_expired_sessions", bind=True)
def clean_expired_sessions(self) -> Dict:
    """Nettoie les sessions expirées."""
    logger.info("Nettoyage des sessions expirées")
    
    try:
        # Nettoyer les sessions Redis
        session_keys = redis_client.keys("session:*")
        expired_count = 0
        
        for key in session_keys:
            ttl = redis_client.ttl(key)
            if ttl < 0:  # Session expirée
                redis_client.delete(key)
                expired_count += 1
        
        logger.info(f"Nettoyage terminé: {expired_count} sessions expirées supprimées")
        return {"status": "completed", "sessions_deleted": expired_count}
    
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des sessions: {str(e)}")
        return {"status": "error", "error": str(e)}


@app.task(name="update_traffic_data", bind=True)
def update_traffic_data(self) -> Dict:
    """Met à jour les données de trafic pour l'optimisation des itinéraires."""
    logger.info("Mise à jour des données de trafic")
    
    try:
        # Récupérer les données de trafic depuis une API externe
        traffic_api_key = os.getenv("TRAFFIC_API_KEY")
        
        if not traffic_api_key:
            logger.warning("Clé API de trafic non configurée")
            return {"status": "skipped", "reason": "no_api_key"}
        
        # Coordonnées pour Abidjan
        bounds = "5.243,4.0,5.461,3.8"  # lat1,lon1,lat2,lon2
        
        response = requests.get(
            f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json",
            params={
                "key": traffic_api_key,
                "bbox": bounds,
                "unit": "KMPH"
            },
            timeout=15
        )
        
        if response.status_code == 200:
            traffic_data = response.json()
            
            # Stocker les données dans la base de données
            with SessionLocal() as db:
                from app.models.traffic import TrafficData
                
                # Supprimer les anciennes données
                db.query(TrafficData).filter(
                    TrafficData.created_at < datetime.utcnow() - timedelta(hours=3)
                ).delete()
                
                # Ajouter les nouvelles données
                for segment in traffic_data.get("flowSegmentData", {}).get("freeFlowSegmentData", []):
                    traffic_entry = TrafficData(
                        segment_id=segment.get("id"),
                        latitude=segment.get("coordinates", {}).get("coordinate", [])[0].get("latitude"),
                        longitude=segment.get("coordinates", {}).get("coordinate", [])[0].get("longitude"),
                        current_speed=segment.get("currentSpeed"),
                        free_flow_speed=segment.get("freeFlowSpeed"),
                        current_travel_time=segment.get("currentTravelTime"),
                        free_flow_travel_time=segment.get("freeFlowTravelTime"),
                        confidence=segment.get("confidence"),
                        road_closure=segment.get("roadClosure", False),
                        created_at=datetime.utcnow()
                    )
                    db.add(traffic_entry)
                
                db.commit()
            
            # Publier un événement de mise à jour des données de trafic
            event_data = {
                "type": "traffic_data_updated",
                "payload": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "segments_count": len(traffic_data.get("flowSegmentData", {}).get("freeFlowSegmentData", []))
                }
            }
            redis_client.publish("notifications", json.dumps(event_data))
            
            logger.info("Données de trafic mises à jour avec succès")
            return {"status": "completed", "segments_updated": len(traffic_data.get("flowSegmentData", {}).get("freeFlowSegmentData", []))}
        else:
            logger.error(f"Échec de la récupération des données de trafic: {response.status_code} {response.text}")
            return {"status": "error", "error": f"API error: {response.status_code}"}
    
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour des données de trafic: {str(e)}")
        return {"status": "error", "error": str(e)}


# Tâches périodiques
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Configure les tâches périodiques."""
    # Traiter les mises à jour de statut toutes les minutes
    sender.add_periodic_task(60.0, process_delivery_status_updates.s())
    
    # Nettoyer les sessions expirées tous les jours à minuit
    sender.add_periodic_task(
        crontab(hour=0, minute=0),
        clean_expired_sessions.s()
    )
    
    # Mettre à jour les données de trafic toutes les 15 minutes
    sender.add_periodic_task(900.0, update_traffic_data.s())


if __name__ == "__main__":
    app.start()
