
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NegotiationCreate(BaseModel):
    scheduled_delivery_id: int
    proposed_price: float
    message: Optional[str] = None
    proposed_pickup_time: Optional[datetime] = None
    proposed_delivery_time: Optional[datetime] = None
    special_conditions: Optional[str] = None

class CounterOfferCreate(BaseModel):
    parent_negotiation_id: int
    proposed_price: float
    message: Optional[str] = None
    proposed_pickup_time: Optional[datetime] = None
    proposed_delivery_time: Optional[datetime] = None
    special_conditions: Optional[str] = None

class NegotiationResponse(BaseModel):
    accept: bool
    message: Optional[str] = None

class NegotiationDetail(BaseModel):
    id: int
    scheduled_delivery_id: int
    client_id: int
    courier_id: int
    proposed_price: float
    original_price: float
    negotiation_type: str
    status: str
    message: Optional[str]
    client_notes: Optional[str]
    courier_notes: Optional[str]
    proposed_pickup_time: Optional[datetime]
    proposed_delivery_time: Optional[datetime]
    special_conditions: Optional[str]
    created_at: datetime
    responded_at: Optional[datetime]
    expires_at: Optional[datetime]
    parent_negotiation_id: Optional[int]
    
    client: dict
    courier: dict
    
    class Config:
        from_attributes = True

class NegotiationHistory(BaseModel):
    scheduled_delivery_id: int
    negotiations: List[NegotiationDetail]
    current_status: str
    total_rounds: int
    final_price: Optional[float]
