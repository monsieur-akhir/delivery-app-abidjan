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
    phone: str = Field(..., description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    password: str = Field(..., min_length=6, description="Password")
    full_name: str = Field(..., description="Full name")
    role: str = Field(default="client", description="User role")
    commune: Optional[str] = Field(None, description="Commune")
    language_preference: str = Field(default="fr", description="Language preference")

class RegisterWithOTPResponse(BaseModel):
    success: bool = Field(..., description="Registration success status")
    message: str = Field(..., description="Response message")
    user_id: Optional[int] = Field(None, description="Created user ID")
    otp_sent_to: Optional[str] = Field(None, description="Where OTP was sent")
    expires_at: Optional[datetime] = Field(None, description="OTP expiry time")
