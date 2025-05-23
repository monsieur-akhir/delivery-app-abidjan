# Ajouter ces imports si nécessaire
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

from .user import UserResponse
from .transport import VehicleType, CargoCategory

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    bidding = "bidding"
    accepted = "accepted"
    in_progress = "in_progress"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"

class DeliveryType(str, enum.Enum):
    standard = "standard"
    express = "express"
    collaborative = "collaborative"

# Schémas de base pour les livraisons
class DeliveryBase(BaseModel):
    pickup_address: str
    pickup_commune: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    delivery_address: str
    delivery_commune: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    is_fragile: Optional[bool] = False
    cargo_category: Optional[CargoCategory] = None
    required_vehicle_type: Optional[VehicleType] = None
    proposed_price: float
    delivery_type: DeliveryType = DeliveryType.standard

# Schéma pour la création d'une livraison
class DeliveryCreate(DeliveryBase):
    @validator('proposed_price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le prix proposé doit être positif')
        return v

# Schéma pour la mise à jour d'une livraison
class DeliveryUpdate(BaseModel):
    pickup_address: Optional[str] = None
    pickup_commune: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_commune: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    is_fragile: Optional[bool] = None
    cargo_category: Optional[CargoCategory] = None
    required_vehicle_type: Optional[VehicleType] = None
    proposed_price: Optional[float] = None
    delivery_type: Optional[DeliveryType] = None

# Schéma pour la réponse de livraison
class DeliveryResponse(DeliveryBase):
    id: int
    client_id: int
    courier_id: Optional[int] = None
    final_price: Optional[float] = None
    status: DeliveryStatus
    estimated_distance: Optional[float] = None
    estimated_duration: Optional[int] = None
    actual_duration: Optional[int] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    pickup_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    vehicle_id: Optional[int] = None
    
    # Informations supplémentaires
    client: Optional[Dict[str, Any]] = None
    courier: Optional[Dict[str, Any]] = None
    vehicle: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True
