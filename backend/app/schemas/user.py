# Ajouter ces imports si nécessaire
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

from .transport import VehicleType, Vehicle, CourierVehicle

class UserRole(str, enum.Enum):
    client = "client"
    courier = "courier"
    business = "business"
    manager = "manager"

class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    pending_verification = "pending_verification"

class KYCStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

# Schémas pour le profil coursier
class CourierProfileBase(BaseModel):
    vehicle_type: VehicleType = VehicleType.MOTORCYCLE
    license_plate: Optional[str] = None

class CourierProfileCreate(CourierProfileBase):
    id_card_number: Optional[str] = None
    id_card_url: Optional[str] = None
    driving_license_url: Optional[str] = None
    insurance_url: Optional[str] = None

class CourierProfileUpdate(BaseModel):
    vehicle_type: Optional[VehicleType] = None
    license_plate: Optional[str] = None
    id_card_number: Optional[str] = None
    id_card_url: Optional[str] = None
    driving_license_url: Optional[str] = None
    insurance_url: Optional[str] = None
    is_online: Optional[bool] = None

class CourierProfileResponse(CourierProfileBase):
    id: int
    user_id: int
    id_card_number: Optional[str] = None
    id_card_url: Optional[str] = None
    driving_license_url: Optional[str] = None
    insurance_url: Optional[str] = None
    is_online: bool
    last_location_lat: Optional[float] = None
    last_location_lng: Optional[float] = None
    last_location_updated: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# Base user schemas
class UserBase(BaseModel):
    phone: str = Field(..., description="Phone number (primary identifier)")
    email: Optional[EmailStr] = None
    full_name: str = Field(..., description="Full name")
    role: UserRole = UserRole.client
    commune: Optional[str] = None
    language_preference: Optional[str] = "fr"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")

class UserLogin(BaseModel):
    phone: str = Field(..., description="Phone number")
    password: str = Field(..., description="Password")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    commune: Optional[str] = None
    language_preference: Optional[str] = None

class UserResponse(UserBase):
    id: int
    status: UserStatus
    kyc_status: KYCStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: Optional[datetime] = None  # Changed from expires_in to match what's used in the code
    refresh_token: Optional[str] = None  # Added to match what's used in the code
    user: Optional['UserResponse'] = None  # Added to match what's used in the code
    
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    phone: Optional[str] = None
    role: Optional[UserRole] = None

# Business profile schemas
class BusinessProfileBase(BaseModel):
    business_name: str
    business_type: Optional[str] = None
    siret: Optional[str] = None
    address: Optional[str] = None
    commune: Optional[str] = None

class BusinessProfileCreate(BusinessProfileBase):
    pass

class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    siret: Optional[str] = None
    address: Optional[str] = None
    commune: Optional[str] = None

class BusinessProfileResponse(BusinessProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserStatusUpdate(BaseModel):
    status: UserStatus

class KYCUpdate(BaseModel):
    kyc_status: KYCStatus
    kyc_rejection_reason: Optional[str] = None

# Password related schemas
class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")
    confirm_password: str = Field(..., description="Confirm new password")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v

class PasswordResetRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    
    @validator('phone')
    def email_or_phone_required(cls, v, values, **kwargs):
        if not v and not values.get('email'):
            raise ValueError('Email ou numéro de téléphone requis')
        return v

class PasswordResetConfirm(BaseModel):
    phone: str = Field(..., description="Phone number")
    code: str = Field(..., description="OTP code")
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")
    confirm_password: str = Field(..., description="Confirm new password")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v
