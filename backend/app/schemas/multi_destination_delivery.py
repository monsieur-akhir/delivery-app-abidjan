from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class MultiDestinationStopCreate(BaseModel):
    delivery_address: str
    delivery_commune: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    recipient_name: str
    recipient_phone: Optional[str] = None
    special_instructions: Optional[str] = None

class MultiDestinationStopResponse(BaseModel):
    id: int
    delivery_address: str
    delivery_commune: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    recipient_name: str
    recipient_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    original_order: int
    optimized_order: Optional[int] = None
    status: str
    estimated_arrival_time: Optional[datetime] = None
    actual_arrival_time: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    estimated_distance_from_previous: Optional[float] = None
    estimated_duration_from_previous: Optional[int] = None
    proof_of_delivery_url: Optional[str] = None
    delivery_notes: Optional[str] = None

    class Config:
        from_attributes = True

class MultiDestinationDeliveryCreate(BaseModel):
    title: Optional[str] = None
    pickup_address: str
    pickup_commune: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    destinations: List[MultiDestinationStopCreate] = Field(..., min_items=2, max_items=10)
    total_proposed_price: float
    special_instructions: Optional[str] = None
    vehicle_type_required: Optional[str] = None
    is_fragile: bool = False
    is_urgent: bool = False

class MultiDestinationDeliveryResponse(BaseModel):
    title: Optional[str] = None
    id: int
    client_id: int
    courier_id: Optional[int] = None
    pickup_address: str
    pickup_commune: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    total_destinations: int
    optimized_route: Optional[List[int]] = None
    estimated_total_distance: Optional[float] = None
    estimated_total_duration: Optional[int] = None
    actual_total_duration: Optional[int] = None
    total_proposed_price: float
    total_final_price: Optional[float] = None
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    special_instructions: Optional[str] = None
    vehicle_type_required: Optional[str] = None
    is_fragile: bool
    is_urgent: bool
    destinations: List[MultiDestinationStopResponse] = []
    client: Optional[Dict[str, Any]] = None
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class MultiDestinationBidCreate(BaseModel):
    proposed_price: float
    estimated_duration: Optional[int] = None
    message: Optional[str] = None
    alternative_route: Optional[List[int]] = None

class MultiDestinationBidResponse(BaseModel):
    id: int
    delivery_id: int
    courier_id: int
    proposed_price: float
    estimated_duration: Optional[int] = None
    message: Optional[str] = None
    alternative_route: Optional[List[int]] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RouteOptimizationRequest(BaseModel):
    pickup_coordinates: Dict[str, float]
    destinations: List[Dict[str, Any]]

class RouteOptimizationResponse(BaseModel):
    optimized_order: List[int]
    total_distance: float
    total_duration: int
    route_coordinates: List[Dict[str, float]]
    eta_per_stop: List[datetime]

class StopStatusUpdate(BaseModel):
    status: str  # "arrived", "delivered", "failed"
    notes: Optional[str] = None
    proof_of_delivery_url: Optional[str] = None
