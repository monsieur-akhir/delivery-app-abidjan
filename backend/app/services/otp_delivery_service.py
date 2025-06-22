
import random
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from ..models.delivery import Delivery, OTPValidationType
from ..models.user import User
from ..services.sms_service import SMSService
from ..core.exceptions import BadRequestError, NotFoundError
from ..core.config import settings

logger = logging.getLogger(__name__)

class OTPDeliveryService:
    def __init__(self, db: Session):
        self.db = db
        self.sms_service = SMSService()

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

            if sms_sent:
                delivery.otp_validation_type = OTPValidationType.sms
                self.db.commit()
                
                logger.info(f"OTP envoyé pour la livraison {delivery_id}")
                return {
                    "success": True,
                    "message": "Code OTP envoyé avec succès",
                    "phone_masked": self._mask_phone_number(delivery.delivery_contact_phone),
                    "expires_at": delivery.otp_sent_at + timedelta(minutes=15)
                }
            else:
                raise BadRequestError("Impossible d'envoyer le SMS")

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
