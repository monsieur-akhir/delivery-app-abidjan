from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import requests
import json
import logging
from datetime import datetime

from ..core.config import settings
from ..models.notification import Notification, NotificationType, NotificationStatus
from ..models.user import User

logger = logging.getLogger(__name__)

class SmsNotificationService:
    """
    Service pour l'envoi de notifications SMS.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.provider = settings.SMS_PROVIDER
        self.api_key = settings.SMS_API_KEY
        self.sender_number = settings.SMS_SENDER_NUMBER
        self.daily_limit = settings.SMS_DAILY_LIMIT
        self.enabled = settings.SMS_ENABLED
    
    async def send_sms(self, phone_number: str, message: str, priority: str = "normal") -> Dict[str, Any]:
        """
        Envoyer un SMS à un numéro de téléphone.
        """
        if not self.enabled:
            logger.warning("Service SMS désactivé. SMS non envoyé à %s", phone_number)
            return {"status": "disabled", "message": "Service SMS désactivé"}
        
        # Vérifier si le quota quotidien est atteint
        if not self._check_daily_limit():
            logger.warning("Limite quotidienne de SMS atteinte. SMS non envoyé à %s", phone_number)
            return {"status": "limit_reached", "message": "Limite quotidienne de SMS atteinte"}
        
        # Vérifier si le numéro est valide
        if not self._validate_phone_number(phone_number):
            logger.warning("Numéro de téléphone invalide: %s", phone_number)
            return {"status": "invalid_number", "message": "Numéro de téléphone invalide"}
        
        # Envoyer le SMS selon le fournisseur configuré
        try:
            if self.provider == "twilio":
                return await self._send_via_twilio(phone_number, message, priority)
            elif self.provider == "africas_talking":
                return await self._send_via_africas_talking(phone_number, message, priority)
            elif self.provider == "orange_sms":
                return await self._send_via_orange(phone_number, message, priority)
            else:
                logger.error("Fournisseur SMS non pris en charge: %s", self.provider)
                return {"status": "error", "message": f"Fournisseur SMS non pris en charge: {self.provider}"}
        except Exception as e:
            logger.exception("Erreur lors de l'envoi du SMS: %s", str(e))
            return {"status": "error", "message": str(e)}
    
    async def send_template(self, phone_number: str, template_name: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Envoyer un SMS en utilisant un modèle prédéfini.
        """
        # Récupérer le modèle
        template = self._get_template(template_name)
        if not template:
            logger.error("Modèle SMS non trouvé: %s", template_name)
            return {"status": "error", "message": f"Modèle SMS non trouvé: {template_name}"}
        
        # Remplacer les variables dans le modèle
        message = self._apply_template_variables(template["content"], variables or {})
        
        # Envoyer le SMS
        return await self.send_sms(phone_number, message, template.get("priority", "normal"))
    
    async def send_critical_alert(self, user_id: int, message: str) -> Dict[str, Any]:
        """
        Envoyer une alerte critique à un utilisateur.
        """
        # Récupérer l'utilisateur
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.phone:
            logger.error("Utilisateur non trouvé ou sans numéro de téléphone: %s", user_id)
            return {"status": "error", "message": "Utilisateur non trouvé ou sans numéro de téléphone"}
        
        # Enregistrer la notification
        notification = Notification(
            user_id=user_id,
            type=NotificationType.system,
            title="Alerte critique",
            message=message,
            status=NotificationStatus.sent,
            channel="sms"
        )
        self.db.add(notification)
        self.db.commit()
        
        # Envoyer le SMS
        result = await self.send_sms(user.phone, message, "critical")
        
        # Mettre à jour le statut de la notification
        if result["status"] == "success":
            notification.status = NotificationStatus.delivered
        else:
            notification.status = NotificationStatus.failed
        
        self.db.commit()
        
        return result
    
    async def send_bulk_sms(self, user_ids: List[int], message: str, priority: str = "normal") -> Dict[str, Any]:
        """
        Envoyer un SMS à plusieurs utilisateurs.
        """
        results = {
            "total": len(user_ids),
            "success": 0,
            "failed": 0,
            "details": []
        }
        
        # Récupérer les utilisateurs
        users = self.db.query(User).filter(User.id.in_(user_ids)).all()
        
        for user in users:
            if not user.phone:
                results["failed"] += 1
                results["details"].append({
                    "user_id": user.id,
                    "status": "error",
                    "message": "Numéro de téléphone non disponible"
                })
                continue
            
            # Envoyer le SMS
            result = await self.send_sms(user.phone, message, priority)
            
            if result["status"] == "success":
                results["success"] += 1
            else:
                results["failed"] += 1
            
            results["details"].append({
                "user_id": user.id,
                "status": result["status"],
                "message": result.get("message", "")
            })
        
        return results
    
    async def _send_via_twilio(self, phone_number: str, message: str, priority: str) -> Dict[str, Any]:
        """
        Envoyer un SMS via Twilio.
        """
        from twilio.rest import Client
        
        try:
            # Initialiser le client Twilio
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            # Envoyer le SMS
            sms = client.messages.create(
                body=message,
                from_=self.sender_number,
                to=phone_number
            )
            
            # Incrémenter le compteur de SMS
            self._increment_sms_counter()
            
            return {
                "status": "success",
                "sid": sms.sid,
                "to": phone_number,
                "message": message
            }
        except Exception as e:
            logger.exception("Erreur Twilio SMS: %s", str(e))
            return {
                "status": "error",
                "message": str(e),
                "to": phone_number
            }
    
    async def _send_via_africas_talking(self, phone_number: str, message: str, priority: str) -> Dict[str, Any]:
        """
        Envoyer un SMS via Africa's Talking.
        """
        url = "https://api.africastalking.com/version1/messaging"
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "ApiKey": self.api_key
        }
        
        data = {
            "username": settings.AFRICAS_TALKING_USERNAME,
            "to": phone_number,
            "message": message,
            "from": self.sender_number
        }
        
        try:
            response = requests.post(url, headers=headers, data=data)
            
            if response.status_code == 201:
                result = response.json()
                
                # Incrémenter le compteur de SMS
                self._increment_sms_counter()
                
                return {
                    "status": "success",
                    "message_id": result.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("messageId"),
                    "to": phone_number,
                    "message": message
                }
            else:
                logger.error("Erreur Africa's Talking: %s", response.text)
                return {
                    "status": "error",
                    "message": response.text,
                    "to": phone_number
                }
        except Exception as e:
            logger.exception("Erreur Africa's Talking: %s", str(e))
            return {
                "status": "error",
                "message": str(e),
                "to": phone_number
            }
    
    async def _send_via_orange(self, phone_number: str, message: str, priority: str) -> Dict[str, Any]:
        """
        Envoyer un SMS via Orange SMS API.
        """
        # Obtenir un token d'accès
        auth_url = "https://api.orange.com/oauth/v3/token"
        
        auth_headers = {
            "Authorization": f"Basic {self.api_key}"
        }
        
        auth_data = {
            "grant_type": "client_credentials"
        }
        
        try:
            auth_response = requests.post(auth_url, headers=auth_headers, data=auth_data)
            
            if auth_response.status_code != 200:
                logger.error("Erreur d'authentification Orange SMS: %s", auth_response.text)
                return {
                    "status": "error",
                    "message": f"Erreur d'authentification: {auth_response.text}",
                    "to": phone_number
                }
            
            access_token = auth_response.json().get("access_token")
            
            # Envoyer le SMS
            sms_url = "https://api.orange.com/smsmessaging/v1/outbound/tel:+{}/requests"
            
            sms_headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            sms_data = {
                "outboundSMSMessageRequest": {
                    "address": f"tel:+{phone_number.lstrip('+')}",
                    "senderAddress": f"tel:+{self.sender_number.lstrip('+')}",
                    "outboundSMSTextMessage": {
                        "message": message
                    }
                }
            }
            
            sms_response = requests.post(
                sms_url.format(self.sender_number.lstrip('+')),
                headers=sms_headers,
                json=sms_data
            )
            
            if sms_response.status_code == 201:
                result = sms_response.json()
                
                # Incrémenter le compteur de SMS
                self._increment_sms_counter()
                
                return {
                    "status": "success",
                    "message_id": result.get("outboundSMSMessageRequest", {}).get("resourceURL"),
                    "to": phone_number,
                    "message": message
                }
            else:
                logger.error("Erreur Orange SMS: %s", sms_response.text)
                return {
                    "status": "error",
                    "message": sms_response.text,
                    "to": phone_number
                }
        except Exception as e:
            logger.exception("Erreur Orange SMS: %s", str(e))
            return {
                "status": "error",
                "message": str(e),
                "to": phone_number
            }
    
    def _validate_phone_number(self, phone_number: str) -> bool:
        """
        Valider un numéro de téléphone.
        """
        # Vérifier que le numéro commence par + et contient au moins 10 chiffres
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number
        
        # Supprimer tous les caractères non numériques sauf le +
        digits = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # Vérifier que le numéro a au moins 10 chiffres après le +
        return len(digits) >= 11 and digits.startswith('+')
    
    def _check_daily_limit(self) -> bool:
        """
        Vérifier si le quota quotidien de SMS est atteint.
        """
        # Récupérer le nombre de SMS envoyés aujourd'hui
        today = datetime.now().date()
        count = self.db.query(Notification).filter(
            Notification.channel == "sms",
            Notification.created_at >= today
        ).count()
        
        return count < self.daily_limit
    
    def _increment_sms_counter(self) -> None:
        """
        Incrémenter le compteur de SMS envoyés.
        """
        # Cette méthode pourrait être utilisée pour suivre l'utilisation des SMS
        # et facturer les utilisateurs en conséquence
        pass
    
    def _get_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        """
        Récupérer un modèle de SMS par son nom.
        """
        # Dans une implémentation réelle, ces modèles seraient stockés en base de données
        templates = {
            "delivery_created": {
                "content": "Bonjour {user_name}, votre livraison #{delivery_id} a été créée. Suivez-la en temps réel sur notre application.",
                "priority": "normal"
            },
            "delivery_accepted": {
                "content": "Bonjour {user_name}, votre livraison #{delivery_id} a été acceptée par {courier_name}. Heure d'arrivée estimée: {eta}.",
                "priority": "normal"
            },
            "delivery_completed": {
                "content": "Bonjour {user_name}, votre livraison #{delivery_id} a été effectuée avec succès. Merci d'utiliser notre service!",
                "priority": "normal"
            },
            "delivery_delayed": {
                "content": "Bonjour {user_name}, nous vous informons que votre livraison #{delivery_id} est retardée. Nouveau délai estimé: {new_eta}. Nous nous excusons pour ce désagrément.",
                "priority": "high"
            },
            "payment_received": {
                "content": "Bonjour {user_name}, nous avons bien reçu votre paiement de {amount} FCFA pour la livraison #{delivery_id}. Merci!",
                "priority": "normal"
            },
            "account_suspended": {
                "content": "Bonjour {user_name}, votre compte a été suspendu pour la raison suivante: {reason}. Veuillez contacter notre support pour plus d'informations.",
                "priority": "high"
            },
            "critical_alert": {
                "content": "URGENT: {alert_message}. Veuillez contacter immédiatement le support au {support_phone}.",
                "priority": "critical"
            }
        }
        
        return templates.get(template_name)
    
    def _apply_template_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Remplacer les variables dans un modèle de SMS.
        """
        for key, value in variables.items():
            template = template.replace(f"{{{key}}}", str(value))
        
        # Remplacer les variables non définies par des placeholders
        import re
        template = re.sub(r'{([^}]+)}', r'[Variable \1]', template)
        
        return template
