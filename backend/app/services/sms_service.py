
import logging
import requests
from typing import Dict, Any
from sqlalchemy.orm import Session

from ..core.config import settings

logger = logging.getLogger(__name__)

class SMSService:
    """
    Service unifié pour l'envoi de SMS via Brevo.
    """

    def __init__(self):
        self.brevo_api_key = getattr(settings, 'BREVO_API_KEY_SMS', '') or getattr(settings, 'BREVO_API_KEY', '')
        self.brevo_enabled = getattr(settings, 'SMS_ENABLED', True) and bool(self.brevo_api_key)
        self.brevo_url = "https://api.brevo.com/v3/transactionalSMS/sms"
        self.sender = getattr(settings, 'SMS_SENDER', 'LIVRAISON')
        
        logger.info(f"📱 SMSService initialisé - Brevo SMS: {'✅' if self.brevo_enabled else '❌'}")

    def send_sms(self, phone: str, message: str) -> bool:
        """
        Envoie un SMS via l'API Brevo.
        """
        if not self.brevo_enabled:
            logger.warning("❌ Service SMS Brevo désactivé ou mal configuré")
            # En développement, simuler l'envoi
            if settings.ENVIRONMENT == "development":
                logger.info(f"📱 [DEV SMS] SMS simulé envoyé à {phone}: {message}")
                return True
            return False

        try:
            # Formater le numéro de téléphone
            if not phone.startswith('+'):
                if phone.startswith('0'):
                    phone = '+225' + phone[1:]  # Côte d'Ivoire
                else:
                    phone = '+' + phone

            headers = {
                "accept": "application/json",
                "api-key": self.brevo_api_key,
                "content-type": "application/json"
            }

            payload = {
                "type": "transactional",
                "unicodeEnabled": True,
                "sender": self.sender,
                "recipient": phone,
                "content": message
            }

            if settings.ENVIRONMENT == "development":
                logger.info(f"🚀 [BREVO SMS] Envoi SMS à {phone}")
                logger.info(f"📱 [BREVO SMS] Message: {message}")
                logger.info(f"🔗 [BREVO SMS] URL: {self.brevo_url}")

            response = requests.post(self.brevo_url, headers=headers, json=payload, timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"✅ SMS Brevo envoyé avec succès à {phone}")
                return True
            else:
                logger.error(f"❌ Erreur Brevo SMS {response.status_code}: {response.text}")
                return False

        except Exception as e:
            logger.error(f"❌ Exception Brevo SMS: {str(e)}")
            return False

    def send_otp_sms(self, phone: str, code: str, otp_type: str) -> bool:
        """
        Envoie un code OTP par SMS.
        """
        try:
            type_messages = {
                "registration": f"Livraison Abidjan - Code inscription: {code}. Valide 5 min. Ne le partagez pas.",
                "login": f"Livraison Abidjan - Code connexion: {code}. Valide 5 min. Ne le partagez pas.",
                "password_reset": f"Livraison Abidjan - Code réinitialisation: {code}. Valide 5 min.",
                "two_factor": f"Livraison Abidjan - Code 2FA: {code}. Valide 5 min."
            }

            message = type_messages.get(otp_type, f"Livraison Abidjan - Code: {code}. Valide 5 min.")
            return self.send_sms(phone, message)

        except Exception as e:
            logger.error(f"❌ Erreur envoi SMS OTP: {e}")
            return False
