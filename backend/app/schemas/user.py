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
    id: int
    phone: str
    email: Optional[str]
    full_name: str
    role: UserRole
    status: UserStatus
    commune: Optional[str]
    profile_picture: Optional[str]
    kyc_rejection_reason: Optional[str]
    language_preference: Optional[str]
    keycloak_id: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v:
            raise ValueError('Le numéro de téléphone est requis')
        
        # Nettoyer le numéro
        phone_clean = v.strip().replace(" ", "").replace("-", "").replace(".", "")
        
        # Vérifier le format pour la Côte d'Ivoire
        if not phone_clean.startswith(('+225', '225', '0')):
            raise ValueError('Le numéro de téléphone doit être au format ivoirien (+225, 225, ou 0)')
        
        # Vérifier la longueur après nettoyage
        if len(phone_clean) < 10 or len(phone_clean) > 15:
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

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        return v

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
