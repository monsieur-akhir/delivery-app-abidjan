import random
import string
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.otp import OTP, OTPType, OTPStatus
from ..models.user import User, UserStatus
from ..schemas.otp import OTPRequest, OTPVerification, OTPResponse, OTPVerificationResponse
from app.core.config import settings
from ..core.exceptions import BadRequestError, NotFoundError, ConflictError
from .email_service import EmailService
from .sms_service import SMSService

# Configuration du logger
logger = logging.getLogger(__name__)

class OTPService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
        self.sms_service = SMSService()

    def generate_otp_code(self, length: int = 6) -> str:
        """Generate a random OTP code."""
        return ''.join(random.choices(string.digits, k=length))

    def create_otp(self, phone: str, email: Optional[str], otp_type: OTPType, user_id: Optional[int] = None) -> OTP:
        """Create a new OTP record."""
        # Normalisation du numéro
        phone_clean = phone.strip().replace(" ", "").replace("-", "").replace(".", "")
        if len(phone_clean) == 10:
            phone_clean = "+225" + phone_clean
        if phone_clean.startswith("00225"):
            phone_clean = "+225" + phone_clean[5:]
        if phone_clean.startswith("225") and not phone_clean.startswith("+225"):
            phone_clean = "+225" + phone_clean[3:]
        phone = phone_clean
        # Invalidate any existing pending OTPs for the same phone and type
        existing_otps = self.db.query(OTP).filter(
            and_(
                OTP.phone == phone,
                OTP.otp_type == otp_type,
                OTP.status == OTPStatus.PENDING
            )
        ).all()

        for existing_otp in existing_otps:
            existing_otp.status = OTPStatus.EXPIRED

        # Generate new OTP
        code = self.generate_otp_code()
        expires_at = OTP.generate_expiry_time(minutes=5)  # 5 minutes expiry

        # Log du code OTP généré immédiatement
        logger.info(f"[OTP] Code généré dans create_otp: {code} pour {phone}")

        otp = OTP(
            user_id=user_id,
            phone=phone,
            email=email,
            code=code,
            otp_type=otp_type,
            status=OTPStatus.PENDING,
            expires_at=expires_at
        )

        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)

        return otp

    def send_otp_via_sms(self, phone: str, code: str, otp_type: OTPType) -> bool:
        """Send OTP via SMS."""
        try:
            # Convertir l'enum en string pour le service SMS
            otp_type_str = otp_type.value.lower()
            return self.sms_service.send_otp_sms(phone, code, otp_type_str)
        except Exception as e:
            logger.error(f"❌ Erreur envoi SMS OTP: {e}")
            return False

    def send_otp_via_email(self, email: str, code: str, otp_type: OTPType) -> bool:
        """Send OTP via email using the enhanced email service."""
        try:
            # Convert OTPType enum to string for email service
            otp_type_str = otp_type.value.lower()
            return self.email_service.send_otp_email(email, code, otp_type_str)
        except Exception as e:
            logger.error(f"Error sending email OTP: {e}")
            return False

    def send_otp_via_push(self, user_id: int, code: str, otp_type: OTPType) -> bool:
        """Send OTP via push notification to a specific user."""
        try:
            # Convert OTPType enum to string for email service
            otp_type_str = otp_type.value.lower()
            return self.email_service.send_otp_by_user_tag(str(user_id), code, otp_type_str)
        except Exception as e:
            logger.error(f"Error sending push OTP: {e}")
            return False

    def send_otp(self, request: OTPRequest) -> OTPResponse:
        """Send OTP to user via SMS and/or email."""

        # Log de débogage en développement
        if settings.ENVIRONMENT == "development":
            logger.info(f"🚀 DÉBUT - Envoi OTP pour le numéro: {request.phone}")
            logger.info(f"📱 Type OTP: {request.otp_type}")
            logger.info(f"📧 Email fourni: {request.email if request.email else 'Aucun'}")

        # Check if user exists for certain OTP types
        user = None
        if request.otp_type in [OTPType.LOGIN, OTPType.PASSWORD_RESET, OTPType.TWO_FACTOR]:
            user = self.db.query(User).filter(User.phone == request.phone).first()
            if not user:
                if settings.ENVIRONMENT == "development":
                    logger.warning(f"❌ ERREUR - Utilisateur non trouvé pour: {request.phone}")
                raise NotFoundError("Utilisateur non trouvé")
            else:
                if settings.ENVIRONMENT == "development":
                    logger.info(f"✅ Utilisateur trouvé - ID: {user.id}, Role: {user.role}")

        # Désactivation temporaire de la vérification d'existence pour REGISTRATION
        # if request.otp_type == OTPType.REGISTRATION:
        #     existing_user = self.db.query(User).filter(User.phone == request.phone).first()
        #     if existing_user:
        #         if settings.ENVIRONMENT == "development":
        #             logger.warning(f"❌ ERREUR - Utilisateur existe déjà pour: {request.phone}")
        #         raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")

        # Create OTP
        otp = self.create_otp(
            phone=request.phone,
            email=request.email,
            otp_type=request.otp_type,
            user_id=user.id if user else None
        )

        # Log du code OTP généré (toujours, pour debug)
        logger.info(f"[OTP] Code généré pour {request.phone}: {otp.code}")
        # Log du code OTP généré en développement
        if settings.ENVIRONMENT == "development":
            logger.info(f"🔑 CODE OTP GÉNÉRÉ: {otp.code}")
            logger.info(f"⏰ Expire à: {otp.expires_at}")
            logger.info(f"🆔 OTP ID: {otp.id}")

        # Send OTP via SMS (primary method)
        sms_sent = self.send_otp_via_sms(request.phone, otp.code, request.otp_type)

        if settings.ENVIRONMENT == "development":
            logger.info(f"📱 SMS envoyé: {'✅ Succès' if sms_sent else '❌ Échec'}")

        # Send OTP via email if provided (secondary method)
        email_sent = True
        if request.email:
            try:
                email_sent = self.send_otp_via_email(request.email, otp.code, request.otp_type)
                if settings.ENVIRONMENT == "development":
                    logger.info(f"📧 Email envoyé: {'✅ Succès' if email_sent else '❌ Échec'}")
            except Exception as e:
                email_sent = False
                if settings.ENVIRONMENT == "development":
                    logger.error(f"📧 Erreur envoi email: {str(e)}")

        # Au moins un canal doit fonctionner
        if not sms_sent and not email_sent:
            if settings.ENVIRONMENT == "development":
                logger.error("❌ ERREUR - Aucun canal de communication disponible")
                # En mode dev, on retourne quand même le code OTP pour debug
                response_data = {
                    "success": True,
                    "message": "Code OTP généré (mode debug - envoi échoué)",
                    "otp_id": otp.id,
                    "expires_at": otp.expires_at,
                    "channels_used": [],
                    "dev_otp_code": otp.code,
                    "dev_note": "SMS/Email non configurés - code affiché pour debug"
                }
                logger.info(f"🔑 CODE OTP POUR DEBUG: {otp.code}")
                return OTPResponse(**response_data)
            else:
                raise BadRequestError("Impossible d'envoyer l'OTP. Veuillez vérifier votre numéro de téléphone et email.")

        self.db.commit()

        # Préparer la réponse
        response_data = {
            "success": True,
            "message": "Code OTP envoyé avec succès",
            "otp_id": otp.id,
            "expires_at": otp.expires_at,
            "channels_used": []
        }

        if sms_sent:
            response_data["channels_used"].append("sms")
        if email_sent and request.email:
            response_data["channels_used"].append("email")

        if settings.ENVIRONMENT == "development":
            response_data["dev_otp_code"] = otp.code
            logger.info(f"🎯 SUCCÈS - OTP envoyé via: {', '.join(response_data['channels_used'])}")

        return OTPResponse(**response_data)

    def verify_otp(self, verification: OTPVerification) -> Tuple[bool, OTP]:
        """Verify OTP code."""

        # Log de débogage en développement
        if settings.ENVIRONMENT == "development":
            logger.info(f"🔍 DÉBUT - Vérification OTP pour: {verification.phone}")
            logger.info(f"🔑 Code fourni: {verification.code}")
            logger.info(f"📱 Type OTP: {verification.otp_type}")
        # Log debug supplémentaire
        logger.info(f"[DEBUG OTP] Recherche OTP pour phone={verification.phone}, type={verification.otp_type}, status=PENDING")
        # Find the OTP
        otp = self.db.query(OTP).filter(
            and_(
                OTP.phone == verification.phone,
                OTP.otp_type == verification.otp_type,
                OTP.status == OTPStatus.PENDING
            )
        ).order_by(OTP.created_at.desc()).first()

        if not otp:
            if settings.ENVIRONMENT == "development":
                logger.warning(f"❌ ERREUR - Code OTP non trouvé pour: {verification.phone}")
            raise NotFoundError("Code OTP non trouvé ou expiré")

        if settings.ENVIRONMENT == "development":
            logger.info(f"✅ OTP trouvé - ID: {otp.id}, Créé: {otp.created_at}")
            logger.info(f"🔑 Code attendu: {otp.code}")
            logger.info(f"⏰ Expire à: {otp.expires_at}")
            logger.info(f"🔄 Tentatives: {otp.attempts}")

        # Check if OTP can be attempted
        if not otp.can_attempt():
            if otp.is_expired():
                otp.mark_as_expired()
                if settings.ENVIRONMENT == "development":
                    logger.warning(f"⏰ ERREUR - OTP expiré pour: {verification.phone}")
            else:
                if settings.ENVIRONMENT == "development":
                    logger.warning(f"🚫 ERREUR - Trop de tentatives pour: {verification.phone}")
            self.db.commit()
            raise BadRequestError("Code OTP expiré ou trop de tentatives")

        # Verify the code
        if otp.code != verification.code:
            otp.increment_attempts()
            self.db.commit()
            if settings.ENVIRONMENT == "development":
                logger.warning(f"❌ ERREUR - Code incorrect pour: {verification.phone}")
                logger.warning(f"🔑 Attendu: {otp.code}, Reçu: {verification.code}")
            raise BadRequestError("Code OTP incorrect")

        # Mark as verified
        otp.mark_as_verified()
        self.db.commit()

        # Si c'est une inscription, activer l'utilisateur
        if otp.otp_type == OTPType.REGISTRATION and otp.user:
            otp.user.status = UserStatus.active
            self.db.commit()

        if settings.ENVIRONMENT == "development":
            logger.info(f"🎉 SUCCÈS - OTP vérifié pour: {verification.phone}")
            if otp.user:
                logger.info(f"👤 Utilisateur - ID: {otp.user.id}, Role: {otp.user.role}")

        return True, otp

    def resend_otp(self, phone: str, otp_type: OTPType) -> OTPResponse:
        """Resend OTP to user."""
        # Get user's email if exists
        user = self.db.query(User).filter(User.phone == phone).first()
        email = user.email if user else None

                # Create new OTP request
        request = OTPRequest(phone=phone, email=email, otp_type=otp_type)
        return self.send_otp(request)

    def cleanup_expired_otps(self) -> int:
        """Clean up expired OTPs."""
        expired_otps = self.db.query(OTP).filter(
            and_(
                OTP.status == OTPStatus.PENDING,
                OTP.expires_at < datetime.now(timezone.utc)
            )
        ).all()

        count = len(expired_otps)
        for otp in expired_otps:
            otp.mark_as_expired()

        self.db.commit()
        return count

    def send_otp_no_check(self, request: OTPRequest, user_id: Optional[int] = None) -> OTPResponse:
        """
        Envoie un OTP sans aucune vérification d'existence d'utilisateur ou de conflit, pour tous les types d'OTP.
        Logue explicitement le code OTP envoyé pour debug.
        """
        logger.info(f"[OTP] Envoi SANS VÉRIFICATION pour {request.phone}, type={request.otp_type}")
        otp = self.create_otp(
            phone=request.phone,
            email=request.email,
            otp_type=request.otp_type,
            user_id=user_id
        )
        logger.info(f"[OTP-NO-CHECK] Code OTP généré: {otp.code}")
        # Envoi SMS
        sms_sent = self.send_otp_via_sms(request.phone, otp.code, request.otp_type)
        logger.info(f"[OTP-NO-CHECK] SMS envoyé: {'OUI' if sms_sent else 'NON'} pour {request.phone}")
        email_sent = True
        if request.email:
            try:
                email_sent = self.send_otp_via_email(request.email, otp.code, request.otp_type)
                logger.info(f"[OTP-NO-CHECK] Email envoyé: {'OUI' if email_sent else 'NON'} à {request.email}")
                logger.info(f"[OTP-NO-CHECK] Détail email: code={otp.code}, destinataire={request.email}")
            except Exception as e:
                email_sent = False
                logger.error(f"[OTP-NO-CHECK] Erreur envoi email: {str(e)}")
        else:
            logger.info(f"[OTP-NO-CHECK] Aucun email fourni, pas d'envoi email.")
        self.db.commit()
        response_data = {
            "success": True,
            "message": "Code OTP envoyé (sans vérification)",
            "otp_id": otp.id,
            "expires_at": otp.expires_at,
            "channels_used": [],
            "dev_otp_code": otp.code  # Ajouté pour debug
        }
        if sms_sent:
            response_data["channels_used"].append("sms")
        if email_sent and request.email:
            response_data["channels_used"].append("email")
        return OTPResponse(**response_data)