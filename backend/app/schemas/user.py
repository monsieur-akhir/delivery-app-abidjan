# Ajouter ces imports si nécessaire
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

from .transport import VehicleType, VehicleResponse, CourierVehicleResponse

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
    vehicle_type: VehicleType = VehicleType.motorcycle
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
    vehicles: Optional[List[CourierVehicleResponse]] = None
    
    class Config:
        orm_mode = True
