from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import requests
import json
import logging

from ..core.config import settings
from ..models.notification import Notification, NotificationType, NotificationStatus, NotificationChannel
from ..models.user import User, UserRole
from ..db.session import get_db

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Service pour la gestion des notifications.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "system",
        data: Optional[Dict[str, Any]] = None,
        channel: str = "in_app"
    ) -> Notification:
        """
        Créer une nouvelle notification.
        """
        # Vérifier que l'utilisateur existe
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"Utilisateur avec ID {user_id} non trouvé")
        
        # Créer la notification
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=json.dumps(data) if data else None,
            channel=channel,
            status=NotificationStatus.sent
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        # Envoyer la notification selon le canal
        if channel == NotificationChannel.push:
            await self.send_push_notification(user, title, message, data)
        elif channel == NotificationChannel.sms:
            await self.send_sms_notification(user.phone, message)
        elif channel == NotificationChannel.whatsapp:
            await self.send_whatsapp_notification(user.phone, message)
        
        return notification
    
    async def get_user_notifications(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False
    ) -> List[Notification]:
        """
        Récupérer les notifications d'un utilisateur.
        """
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.read_at.is_(None))
        
        return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    async def mark_notification_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """
        Marquer une notification comme lue.
        """
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return None
        
        notification.status = NotificationStatus.read
        notification.read_at = datetime.now()
        
        self.db.commit()
        self.db.refresh(notification)
        
        return notification
    
    async def mark_all_notifications_as_read(self, user_id: int) -> int:
        """
        Marquer toutes les notifications d'un utilisateur comme lues.
        """
        now = datetime.now()
        result = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read_at.is_(None)
        ).update({
            "status": NotificationStatus.read,
            "read_at": now
        })
        
        self.db.commit()
        
        return result
    
    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """
        Supprimer une notification.
        """
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            return False
        
        self.db.delete(notification)
        self.db.commit()
        
        return True
    
    async def send_push_notification(
        self,
        user: User,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Envoyer une notification push via OneSignal.
        """
        url = "https://onesignal.com/api/v1/notifications"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {settings.ONESIGNAL_API_KEY}"
        }
        
        # Préparer les données spécifiques à l'application
        app_data = {
            "app_id": settings.ONESIGNAL_APP_ID,
            "include_external_user_ids": [str(user.id)],
            "contents": {"en": message, "fr": message},
            "headings": {"en": title, "fr": title},
            "data": data or {}
        }
        
        # Ajouter des options spécifiques selon le type d'appareil
        if data and "device_type" in data:
            if data["device_type"] == "android":
                app_data["android_channel_id"] = "livraison_abidjan_channel"
                app_data["android_accent_color"] = "FF9800"
                app_data["android_group"] = "livraison_abidjan"
            elif data["device_type"] == "ios":
                app_data["ios_sound"] = "notification.wav"
                app_data["ios_badgeType"] = "Increase"
                app_data["ios_badgeCount"] = 1
        
        # Ajouter des boutons d'action si nécessaire
        if data and "action_buttons" in data:
            app_data["buttons"] = data["action_buttons"]
        
        # Ajouter une image si nécessaire
        if data and "image_url" in data:
            app_data["big_picture"] = data["image_url"]  # Android
            app_data["ios_attachments"] = {"id": data["image_url"]}  # iOS
        
        try:
            response = requests.post(url, json=app_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "id": result.get("id"),
                    "recipients": result.get("recipients")
                }
            else:
                logger.error(f"Erreur OneSignal: {response.text}")
                return {"status": "error", "message": response.text}
        except Exception as e:
            logger.error(f"Exception OneSignal: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def send_sms_notification(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Envoyer une notification SMS via Twilio.
        """
        from twilio.rest import Client
        
        try:
            # Initialiser le client Twilio
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Envoyer le SMS
            sms = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone
            )
            
            return {
                "status": "success",
                "sid": sms.sid,
                "to": phone,
                "message": message
            }
        except Exception as e:
            logger.error(f"Erreur Twilio SMS: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "to": phone
            }
    
    async def send_whatsapp_notification(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Envoyer une notification WhatsApp via Twilio.
        """
        from twilio.rest import Client
        
        try:
            # Initialiser le client Twilio
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Formater le numéro pour WhatsApp
            whatsapp_number = f"whatsapp:{phone}"
            
            # Envoyer le message WhatsApp
            whatsapp = client.messages.create(
                body=message,
                from_=f"whatsapp:{settings.TWILIO_PHONE_NUMBER}",
                to=whatsapp_number
            )
            
            return {
                "status": "success",
                "sid": whatsapp.sid,
                "to": phone,
                "message": message
            }
        except Exception as e:
            logger.error(f"Erreur Twilio WhatsApp: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "to": phone
            }
    
    async def send_delivery_notification(
        self,
        delivery_id: int,
        user_id: Optional[int] = None,
        message: Optional[str] = None
    ) -> List[Notification]:
        """
        Envoyer une notification concernant une livraison.
        Si user_id est fourni, la notification est envoyée à cet utilisateur.
        Sinon, elle est envoyée aux coursiers à proximité.
        """
        notifications = []
        
        if user_id:
            # Envoyer à un utilisateur spécifique
            notification = await self.create_notification(
                user_id=user_id,
                title="Mise à jour de livraison",
                message=message or f"Mise à jour de la livraison #{delivery_id}",
                notification_type="delivery_status",
                data={"delivery_id": delivery_id},
                channel="push"
            )
            notifications.append(notification)
        else:
            # Envoyer aux coursiers à proximité
            # Dans un environnement réel, on filtrerait les coursiers par proximité
            couriers = self.db.query(User).filter(User.role == UserRole.courier).all()
            
            for courier in couriers:
                notification = await self.create_notification(
                    user_id=courier.id,
                    title="Nouvelle livraison disponible",
                    message=message or f"Nouvelle livraison disponible #{delivery_id}",
                    notification_type="delivery_status",
                    data={"delivery_id": delivery_id},
                    channel="push"
                )
                notifications.append(notification)
        
        return notifications
    
    async def send_rating_notification(
        self,
        rating_id: int,
        user_id: int,
        score: int
    ) -> Notification:
        """
        Envoyer une notification concernant une évaluation.
        """
        title = "Nouvelle évaluation reçue"
        message = f"Vous avez reçu une évaluation de {score} étoiles"
        
        return await self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="rating_received",
            data={"rating_id": rating_id, "score": score},
            channel="in_app"
        )
    
    async def send_reward_notification(
        self,
        reward_id: int,
        user_id: int
    ) -> Notification:
        """
        Envoyer une notification concernant une récompense.
        """
        title = "Nouvelle récompense"
        message = "Votre récompense a été traitée avec succès"
        
        return await self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type="reward_earned",
            data={"reward_id": reward_id},
            channel="push"
        )
    
    async def send_wallet_notification(
        self,
        user_id: int,
        transaction_id: Optional[int] = None,
        message: Optional[str] = None
    ) -> Notification:
        """
        Envoyer une notification concernant le portefeuille.
        """
        title = "Mise à jour du portefeuille"
        default_message = "Votre portefeuille a été mis à jour"
        
        return await self.create_notification(
            user_id=user_id,
            title=title,
            message=message or default_message,
            notification_type="system",
            data={"transaction_id": transaction_id} if transaction_id else None,
            channel="in_app"
        )
    
    async def send_traffic_notification(
        self,
        commune: str,
        severity: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        message: Optional[str] = None,
        alert_type: str = "traffic"
    ) -> List[Notification]:
        """
        Envoyer une notification concernant le trafic ou la météo.
        """
        notifications = []
        
        # Récupérer les utilisateurs dans la commune concernée
        users = self.db.query(User).filter(User.commune == commune).all()
        
        title = "Alerte trafic" if alert_type == "traffic" else "Alerte météo"
        default_message = f"Trafic dense dans {commune}" if alert_type == "traffic" else f"Conditions météo défavorables dans {commune}"
        
        for user in users:
            notification = await self.create_notification(
                user_id=user.id,
                title=title,
                message=message or default_message,
                notification_type="weather_alert" if alert_type == "weather" else "system",
                data={
                    "commune": commune,
                    "severity": severity,
                    "lat": lat,
                    "lng": lng,
                    "type": alert_type
                },
                channel="push"
            )
            notifications.append(notification)
        
        return notifications
    
    async def send_policy_update_notification(
        self,
        policy_type: str,
        policy_name: str,
        action: str,
        user_ids: Optional[List[int]] = None
    ) -> List[Notification]:
        """
        Envoyer une notification concernant une mise à jour de politique.
        """
        notifications = []
        
        title = f"Mise à jour de politique: {policy_type}"
        message = f"La politique '{policy_name}' a été {action}"
        
        # Si aucun utilisateur n'est spécifié, envoyer aux administrateurs
        if not user_ids:
            admins = self.db.query(User).filter(User.role == UserRole.manager).all()
            user_ids = [admin.id for admin in admins]
        
        for user_id in user_ids:
            notification = await self.create_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type="system",
                data={
                    "policy_type": policy_type,
                    "policy_name": policy_name,
                    "action": action
                },
                channel="in_app"
            )
            notifications.append(notification)
        
        return notifications

# Fonctions utilitaires pour les appels directs
async def send_sms_notification(phone: str, message: str) -> Dict[str, Any]:
    """
    Fonction utilitaire pour envoyer un SMS directement.
    """
    from twilio.rest import Client
    
    try:
        # Initialiser le client Twilio
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        # Envoyer le SMS
        sms = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone
        )
        
        return {
            "status": "success",
            "sid": sms.sid,
            "to": phone,
            "message": message
        }
    except Exception as e:
        logger.error(f"Erreur Twilio SMS: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "to": phone
        }
