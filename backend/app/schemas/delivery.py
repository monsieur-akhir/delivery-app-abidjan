from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

from .user import UserResponse
from .transport import VehicleType, CargoCategory

# === ENUMS ===

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


# === BASE SCHEMAS ===

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


# === CREATE / UPDATE ===

class DeliveryCreate(DeliveryBase):
    @validator('proposed_price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le prix proposé doit être positif')
        return v

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


# === RESPONSE ===

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

    # Relations
    client: Optional[Dict[str, Any]] = None
    courier: Optional[Dict[str, Any]] = None
    vehicle: Optional[Dict[str, Any]] = None

class BidResponse(BaseModel):
    id: int
    delivery_id: int
    courier_id: int
    price: float
    estimated_time: Optional[int] = None
    created_at: datetime   

class TrackingPointResponse(BaseModel):
    id: int
    delivery_id: int
    latitude: float
    longitude: float
    timestamp: datetime

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


# === AUTRES SCHÉMAS UTILES ===

class StatusUpdate(BaseModel):
    status: DeliveryStatus
    cancellation_reason: Optional[str] = None

class BidCreate(BaseModel):
    price: float
    estimated_time: Optional[int] = None  # En minutes

class TrackingPointCreate(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None

class CollaborativeDeliveryCreate(BaseModel):
    delivery_id: int
    participant_ids: List[int]

class CollaborativeDeliveryResponse(BaseModel):
    id: int
    delivery_id: int
    participant_ids: List[int]
    created_at: datetime

class ExpressDeliveryCreate(DeliveryCreate):
    is_priority: Optional[bool] = True

class ExpressDeliveryResponse(DeliveryResponse):
    is_priority: bool    
