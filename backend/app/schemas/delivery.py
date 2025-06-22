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
    # Champs additionnels du mobile
    package_type: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    distance: Optional[float] = None
    estimated_duration: Optional[int] = None
    weather_conditions: Optional[str] = None
    vehicle_type: Optional[str] = None
    delivery_speed: Optional[str] = None
    extras: Optional[List[str]] = None
    
    # Champs du frontend CreateDeliveryScreen
    description: Optional[str] = None
    weight: Optional[str] = None
    estimated_value: Optional[str] = None
    is_urgent: Optional[bool] = False
    urgency_level: Optional[str] = "normal"
    custom_price: Optional[str] = None
    
    # Informations du créateur (auto-remplies par le backend)
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    
    @validator('proposed_price')
    def price_must_be_positive(cls, v):
        if v and v > 0:
            return v
        elif v is None:
            return None
        else:
            raise ValueError('Le prix proposé doit être positif')
    
    @validator('pickup_address', 'delivery_address')
    def addresses_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Les adresses ne peuvent pas être vides')
        return v.strip()
    
    @validator('weight', 'estimated_value', 'custom_price', pre=True)
    def convert_string_to_number(cls, v):
        if v == '' or v is None:
            return None
        try:
            return float(v) if v else None
        except (ValueError, TypeError):
            return None

    @validator('required_vehicle_type', pre=True)
    def handle_express_vehicle_type(cls, v):
        if not v:
            return None
            
        # Mapping des types de véhicules du frontend vers le backend
        vehicle_type_mapping = {
            'express': None,  # Pour les livraisons express, laisser le système choisir
            'car': 'van',     # 'car' du frontend -> 'van' du backend
            'truck': 'kia_truck',  # 'truck' du frontend -> 'kia_truck' du backend
            'pickup': 'pickup',
            'motorcycle': 'motorcycle',
            'bicycle': 'bicycle',
            'scooter': 'scooter',
            'van': 'van',
            'kia_truck': 'kia_truck',
            'moving_truck': 'moving_truck',
            'custom': 'custom'
        }
        
        mapped_type = vehicle_type_mapping.get(v)
        if mapped_type is None and v != 'express':
            # Si le type n'est pas dans le mapping et n'est pas 'express', 
            # on peut soit lever une erreur soit utiliser un type par défaut
            return 'motorcycle'  # Type par défaut pour les types inconnus
            
        return mapped_type

    @validator('delivery_type')
    def validate_delivery_type(cls, v, values):
        # Si c'est une livraison express et qu'aucun véhicule n'est spécifié,
        # on peut laisser le système choisir automatiquement
        if v == DeliveryType.express and not values.get('required_vehicle_type'):
            # Pas besoin de faire quoi que ce soit, le système choisira
            pass
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

    @validator('required_vehicle_type', pre=True)
    def handle_express_vehicle_type(cls, v):
        if not v:
            return None
            
        # Mapping des types de véhicules du frontend vers le backend
        vehicle_type_mapping = {
            'express': None,  # Pour les livraisons express, laisser le système choisir
            'car': 'van',     # 'car' du frontend -> 'van' du backend
            'truck': 'kia_truck',  # 'truck' du frontend -> 'kia_truck' du backend
            'pickup': 'pickup',
            'motorcycle': 'motorcycle',
            'bicycle': 'bicycle',
            'scooter': 'scooter',
            'van': 'van',
            'kia_truck': 'kia_truck',
            'moving_truck': 'moving_truck',
            'custom': 'custom'
        }
        
        mapped_type = vehicle_type_mapping.get(v)
        if mapped_type is None and v != 'express':
            # Si le type n'est pas dans le mapping et n'est pas 'express', 
            # on peut soit lever une erreur soit utiliser un type par défaut
            return 'motorcycle'  # Type par défaut pour les types inconnus
            
        return mapped_type


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
    route_polyline: Optional[str] = None

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
        from_attributes = True  # Keeping for backwards compatibility


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

class SmartMatchingRequest(BaseModel):
    """
    Schéma pour la demande de correspondance intelligente des livraisons
    """
    courier_id: Optional[int] = None
    commune: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    cargo_category: Optional[CargoCategory] = None
    max_distance: Optional[float] = None  # en km
    min_rating: Optional[float] = None
    preferred_time_slot: Optional[Dict[str, str]] = None  # {"start": "HH:MM", "end": "HH:MM"}
    max_deliveries: Optional[int] = None
    include_express: Optional[bool] = True
    include_collaborative: Optional[bool] = True

    class Config:
        from_attributes = True    

# === SCHÉMAS D'AUTOCOMPLÉTION ===

class AddressAutocompleteResult(BaseModel):
    place_id: str
    description: str
    structured_formatting: Optional[Dict[str, str]] = None
    types: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    commune: Optional[str] = None

class AddressAutocompleteResponse(BaseModel):
    predictions: List[AddressAutocompleteResult]
    status: str = "OK"
    query: Optional[str] = None

    class Config:
        from_attributes = True    
