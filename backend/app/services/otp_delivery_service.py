
import random
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from ..models.delivery import Delivery, OTPValidationType
from ..models.user import User
from ..services.sms_service import SMSService
from ..services.email_service import EmailService
from ..core.exceptions import BadRequestError, NotFoundError
from ..core.config import settings

logger = logging.getLogger(__name__)

class OTPDeliveryService:
    def __init__(self, db: Session):
        self.db = db
        self.sms_service = SMSService()
        self.email_service = EmailService()

    def generate_and_send_otp(self, delivery_id: int) -> Dict[str, Any]:
        """
        Génère et envoie un code OTP pour une livraison
        """
        try:
            delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not delivery:
                raise NotFoundError("Livraison non trouvée")

            # Vérifier que la livraison nécessite un OTP
            if not delivery.requires_otp:
                raise BadRequestError("Cette livraison ne nécessite pas de code OTP")

            # Vérifier qu'il y a un numéro de téléphone de destinataire
            if not delivery.delivery_contact_phone:
                raise BadRequestError("Aucun numéro de téléphone de destinataire")

            # Générer le code OTP
            otp_code = self._generate_otp_code()
            delivery.otp_code = otp_code
            delivery.otp_sent_at = datetime.utcnow()
            delivery.otp_attempts = 0

            # Envoyer le SMS
            message = f"Code de réception pour votre livraison #{delivery.id}: {otp_code}. Valide 15 minutes. Livraison Abidjan"
            
            sms_sent = self.sms_service.send_sms(
                phone_number=delivery.delivery_contact_phone,
                message=message
            )

            # Envoyer par email si disponible
            email_sent = False
            client_email = None
            if delivery.client and delivery.client.email:
                client_email = delivery.client.email
                try:
                    email_content = f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2E86AB;">Code de réception de livraison</h2>
                        <p>Votre livraison #{delivery.id} est prête à être récupérée.</p>
                        <p>Code de réception :</p>
                        <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #2E86AB; font-size: 32px; margin: 0; letter-spacing: 8px;">{otp_code}</h1>
                        </div>
                        <p>Ce code expire dans 15 minutes.</p>
                        <p><strong>Adresse de livraison:</strong> {delivery.delivery_address}</p>
                        <p style="color: #666;">Communiquez ce code au livreur pour confirmer la réception.</p>
                    </div>
                    """
                    
                    email_sent = self.email_service.send_email(
                        to_email=client_email,
                        subject=f"Code de réception - Livraison #{delivery.id}",
                        html_content=email_content
                    )
                except Exception as e:
                    logger.error(f"Erreur envoi email OTP livraison: {str(e)}")
                    email_sent = False

            # Au moins un canal doit fonctionner
            if sms_sent or email_sent:
                delivery.otp_validation_type = OTPValidationType.sms if sms_sent else OTPValidationType.whatsapp
                self.db.commit()
                
                channels_used = []
                if sms_sent:
                    channels_used.append("SMS")
                if email_sent:
                    channels_used.append("Email")
                
                logger.info(f"OTP envoyé pour la livraison {delivery_id} via: {', '.join(channels_used)}")
                return {
                    "success": True,
                    "message": f"Code OTP envoyé via {' et '.join(channels_used)}",
                    "phone_masked": self._mask_phone_number(delivery.delivery_contact_phone),
                    "email_masked": self._mask_email(client_email) if client_email else None,
                    "channels_used": channels_used,
                    "expires_at": delivery.otp_sent_at + timedelta(minutes=15)
                }
            else:
                raise BadRequestError("Impossible d'envoyer l'OTP par SMS ou email")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de l'envoi de l'OTP: {str(e)}")
            raise

    def verify_otp(self, delivery_id: int, otp_code: str, courier_id: int) -> Dict[str, Any]:
        """
        Vérifie le code OTP pour une livraison
        """
        try:
            delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not delivery:
                raise NotFoundError("Livraison non trouvée")

            # Vérifier que c'est le bon coursier
            if delivery.courier_id != courier_id:
                raise BadRequestError("Vous n'êtes pas autorisé à valider cette livraison")

            # Vérifier que l'OTP est requis
            if not delivery.requires_otp:
                raise BadRequestError("Cette livraison ne nécessite pas de code OTP")

            # Vérifier le nombre de tentatives
            if not delivery.can_attempt_otp():
                if delivery.otp_attempts >= 3:
                    return {
                        "success": False,
                        "error": "Trop de tentatives. Utilisation du mode alternatif requis.",
                        "fallback_required": True
                    }
                else:
                    raise BadRequestError("Code OTP expiré")

            # Vérifier le code
            if delivery.otp_code != otp_code:
                delivery.otp_attempts += 1
                self.db.commit()
                
                remaining_attempts = 3 - delivery.otp_attempts
                if remaining_attempts == 0:
                    return {
                        "success": False,
                        "error": "Code incorrect. Mode alternatif requis.",
                        "fallback_required": True
                    }
                
                return {
                    "success": False,
                    "error": f"Code incorrect. {remaining_attempts} tentatives restantes",
                    "remaining_attempts": remaining_attempts
                }

            # Code correct
            delivery.otp_verified_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"OTP vérifié avec succès pour la livraison {delivery_id}")
            return {
                "success": True,
                "message": "Code OTP vérifié avec succès",
                "verified_at": delivery.otp_verified_at
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de la vérification de l'OTP: {str(e)}")
            raise

    def resend_otp(self, delivery_id: int) -> Dict[str, Any]:
        """
        Renvoie un code OTP
        """
        try:
            delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not delivery:
                raise NotFoundError("Livraison non trouvée")

            # Vérifier qu'on peut renvoyer (pas plus d'une fois toutes les 2 minutes)
            if delivery.otp_sent_at:
                time_since_last = datetime.utcnow() - delivery.otp_sent_at
                if time_since_last < timedelta(minutes=2):
                    remaining_time = 120 - int(time_since_last.total_seconds())
                    raise BadRequestError(f"Veuillez attendre {remaining_time} secondes avant de renvoyer")

            return self.generate_and_send_otp(delivery_id)

        except Exception as e:
            logger.error(f"Erreur lors du renvoi de l'OTP: {str(e)}")
            raise

    def save_fallback_validation(
        self, 
        delivery_id: int, 
        validation_type: str, 
        validation_data: str, 
        courier_id: int
    ) -> Dict[str, Any]:
        """
        Sauvegarde une validation alternative (signature ou photo)
        """
        try:
            delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()
            if not delivery:
                raise NotFoundError("Livraison non trouvée")

            # Vérifier que c'est le bon coursier
            if delivery.courier_id != courier_id:
                raise BadRequestError("Vous n'êtes pas autorisé à valider cette livraison")

            # Valider le type de validation
            if validation_type not in ['signature', 'photo']:
                raise BadRequestError("Type de validation non valide")

            # Sauvegarder les données de validation
            delivery.otp_validation_type = OTPValidationType.signature if validation_type == 'signature' else OTPValidationType.photo
            delivery.fallback_validation_data = {
                "type": validation_type,
                "data": validation_data,
                "timestamp": datetime.utcnow().isoformat(),
                "courier_id": courier_id
            }
            delivery.otp_verified_at = datetime.utcnow()

            self.db.commit()

            logger.info(f"Validation alternative sauvegardée pour la livraison {delivery_id}")
            return {
                "success": True,
                "message": f"Validation par {validation_type} enregistrée avec succès",
                "validation_type": validation_type,
                "verified_at": delivery.otp_verified_at
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de la sauvegarde de la validation alternative: {str(e)}")
            raise

    def _generate_otp_code(self) -> str:
        """Génère un code OTP à 6 chiffres"""
        return str(random.randint(100000, 999999))

    def _mask_phone_number(self, phone: str) -> str:
        """Masque un numéro de téléphone pour l'affichage"""
        if len(phone) < 4:
            return phone
        return phone[:2] + "*" * (len(phone) - 4) + phone[-2:]

    def _mask_email(self, email: str) -> str:
        """Masque un email pour l'affichage"""
        if not email or "@" not in email:
            return email
        username, domain = email.split("@", 1)
        if len(username) <= 2:
            return email
        masked_username = username[:2] + "*" * (len(username) - 2)
        return f"{masked_username}@{domain}"
