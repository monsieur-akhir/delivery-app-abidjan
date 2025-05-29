import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.otp import OTP, OTPType, OTPStatus
from ..models.user import User, UserStatus
from ..schemas.otp import OTPRequest, OTPVerification, OTPResponse, OTPVerificationResponse
from ..core.config import settings
from ..core.exceptions import BadRequestError, NotFoundError, ConflictError
from .email_service import EmailService
from .sms_service import SMSService

class OTPService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()
        self.sms_service = SMSService()
    
    def generate_otp_code(self, length: int = 4) -> str:
        """Generate a random OTP code."""
        return ''.join(random.choices(string.digits, k=length))
    
    def create_otp(self, phone: str, email: Optional[str], otp_type: OTPType, user_id: Optional[int] = None) -> OTP:
        """Create a new OTP record."""
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
            type_messages = {
                OTPType.REGISTRATION: f"Votre code de vérification pour l'inscription: {code}. Valide 5 minutes.",
                OTPType.LOGIN: f"Votre code de vérification pour la connexion: {code}. Valide 5 minutes.",
                OTPType.PASSWORD_RESET: f"Votre code de réinitialisation: {code}. Valide 5 minutes.",
                OTPType.TWO_FACTOR: f"Votre code d'authentification à deux facteurs: {code}. Valide 5 minutes."
            }
            
            message = type_messages.get(otp_type, f"Votre code de vérification: {code}")
            return self.sms_service.send_sms(phone, message)
        except Exception as e:
            print(f"Error sending SMS OTP: {e}")
            return False
    
    def send_otp_via_email(self, email: str, code: str, otp_type: OTPType) -> bool:
        """Send OTP via email."""
        try:
            type_subjects = {
                OTPType.REGISTRATION: "Code de vérification - Inscription",
                OTPType.LOGIN: "Code de vérification - Connexion",
                OTPType.PASSWORD_RESET: "Code de réinitialisation du mot de passe",
                OTPType.TWO_FACTOR: "Code d'authentification à deux facteurs"
            }
            
            subject = type_subjects.get(otp_type, "Code de vérification")
            message = f"""
            Bonjour,
            
            Votre code de vérification est: {code}
            
            Ce code expire dans 5 minutes.
            
            Si vous n'avez pas demandé ce code, ignorez ce message.
            
            Cordialement,
            L'équipe Delivery App
            """
            
            return self.email_service.send_email(email, subject, message)
        except Exception as e:
            print(f"Error sending email OTP: {e}")
            return False
    
    def send_otp(self, request: OTPRequest) -> OTPResponse:
        """Send OTP to user via SMS and/or email."""
        # Check if user exists for certain OTP types
        user = None
        if request.otp_type in [OTPType.LOGIN, OTPType.PASSWORD_RESET, OTPType.TWO_FACTOR]:
            user = self.db.query(User).filter(User.phone == request.phone).first()
            if not user:
                raise NotFoundError("Utilisateur non trouvé")
        
        # For registration, check if user already exists
        if request.otp_type == OTPType.REGISTRATION:
            existing_user = self.db.query(User).filter(User.phone == request.phone).first()
            if existing_user:
                raise ConflictError("Un utilisateur avec ce numéro de téléphone existe déjà")
        
        # Create OTP
        otp = self.create_otp(
            phone=request.phone,
            email=request.email,
            otp_type=request.otp_type,
            user_id=user.id if user else None
        )
        
        # Send OTP via SMS (primary method)
        sms_sent = self.send_otp_via_sms(request.phone, otp.code, request.otp_type)
        
        # Send OTP via email if provided (secondary method)
        email_sent = True
        if request.email:
            email_sent = self.send_otp_via_email(request.email, otp.code, request.otp_type)
        
        if not sms_sent and not email_sent:
            raise BadRequestError("Erreur lors de l'envoi du code OTP")
        
        return OTPResponse(
            success=True,
            message="Code OTP envoyé avec succès",
            expires_at=otp.expires_at
        )
    
    def verify_otp(self, verification: OTPVerification) -> Tuple[bool, OTP]:
        """Verify OTP code."""
        # Find the OTP
        otp = self.db.query(OTP).filter(
            and_(
                OTP.phone == verification.phone,
                OTP.otp_type == verification.otp_type,
                OTP.status == OTPStatus.PENDING
            )
        ).order_by(OTP.created_at.desc()).first()
        
        if not otp:
            raise NotFoundError("Code OTP non trouvé ou expiré")
        
        # Check if OTP can be attempted
        if not otp.can_attempt():
            if otp.is_expired():
                otp.mark_as_expired()
            self.db.commit()
            raise BadRequestError("Code OTP expiré ou trop de tentatives")
        
        # Verify the code
        if otp.code != verification.code:
            otp.increment_attempts()
            self.db.commit()
            raise BadRequestError("Code OTP incorrect")
        
        # Mark as verified
        otp.mark_as_verified()
        self.db.commit()
        
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
                OTP.expires_at < datetime.utcnow()
            )
        ).all()
        
        count = len(expired_otps)
        for otp in expired_otps:
            otp.mark_as_expired()
        
        self.db.commit()
        return count
