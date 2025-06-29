from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import enum

class OTPType(str, enum.Enum):
    REGISTRATION = "registration"
    LOGIN = "login"
    PASSWORD_RESET = "password_reset"
    TWO_FACTOR = "two_factor"

class OTPStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    EXPIRED = "expired"
    FAILED = "failed"

class OTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    email: Optional[str] = Field(None, description="Email address (optional)")
    otp_type: OTPType = Field(..., description="Type of OTP")

class OTPVerification(BaseModel):
    phone: str = Field(..., description="Phone number")
    code: str = Field(..., min_length=4, max_length=6, description="OTP code")
    otp_type: OTPType = Field(..., description="Type of OTP")

class OTPResend(BaseModel):
    phone: str = Field(..., description="Phone number")
    otp_type: OTPType = Field(..., description="Type of OTP")

class OTPResponse(BaseModel):
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    expires_at: Optional[datetime] = Field(None, description="OTP expiry time")
    otp_id: Optional[int] = Field(None, description="OTP ID")
    channels_used: Optional[list] = Field(default=[], description="Channels used to send OTP")
    dev_otp_code: Optional[str] = Field(None, description="OTP code for development")
    dev_note: Optional[str] = Field(None, description="Development note for debugging")

class OTPVerificationResponse(BaseModel):
    success: bool = Field(..., description="Verification success status")
    message: str = Field(..., description="Response message")
    token: Optional[str] = Field(None, description="Access token (for login OTP)")
    user: Optional[dict] = Field(None, description="User data (for login OTP)")

# For enhanced login with OTP
class LoginWithOTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    password: str = Field(..., description="Password")
    
class LoginWithOTPResponse(BaseModel):
    requires_otp: bool = Field(..., description="Whether OTP is required")
    message: str = Field(..., description="Response message")
    otp_sent_to: Optional[str] = Field(None, description="Where OTP was sent (phone/email)")
    expires_at: Optional[datetime] = Field(None, description="OTP expiry time")

# For registration with OTP
class RegisterWithOTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number", min_length=8, max_length=15)
    email: Optional[str] = Field(None, description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    full_name: str = Field(..., description="Full name", min_length=2, max_length=100)
    role: str = Field(default="client", description="User role")
    commune: Optional[str] = Field(None, description="Commune")
    language_preference: str = Field(default="fr", description="Language preference")
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v:
            raise ValueError('Le numéro de téléphone est requis')
        
        # Nettoyer le numéro
        phone_clean = v.strip().replace(" ", "").replace("-", "").replace(".", "")
        
        # Si le numéro fait exactement 10 chiffres, on ajoute +225 devant
        if len(phone_clean) == 10:
            phone_clean = "+225" + phone_clean
        # Si le numéro commence par 00225, on le remplace par +225
        elif phone_clean.startswith("00225"):
            phone_clean = "+225" + phone_clean[5:]
        # Si le numéro commence par 225 sans +, on ajoute +
        elif phone_clean.startswith("225") and not phone_clean.startswith("+225"):
            phone_clean = "+225" + phone_clean[3:]
        # Si le numéro ne commence pas par +225, on ajoute +225
        elif not phone_clean.startswith("+225"):
            phone_clean = "+225" + phone_clean.lstrip("0")
        
        # Vérifier la longueur après nettoyage
        if len(phone_clean) < 13 or len(phone_clean) > 15:
            raise ValueError('Le numéro de téléphone doit contenir entre 10 et 15 chiffres')
        
        return phone_clean
    
    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            email_clean = v.strip().lower()
            if not email_clean or "@" not in email_clean or "." not in email_clean:
                raise ValueError('Format d\'email invalide')
            return email_clean
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Le nom complet doit contenir au moins 2 caractères')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v

class RegisterWithOTPResponse(BaseModel):
    success: bool = Field(..., description="Registration success status")
    message: str = Field(..., description="Response message")
    user_id: Optional[int] = Field(None, description="Created user ID")
    otp_sent_to: Optional[str] = Field(None, description="Where OTP was sent")
    expires_at: Optional[datetime] = Field(None, description="OTP expiry time")
