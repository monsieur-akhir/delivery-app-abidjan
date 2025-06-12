
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class ZoneType(str, Enum):
    city = "city"
    district = "district"
    custom = "custom"
    exclusion = "exclusion"

class ZoneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    zone_type: ZoneType
    coordinates: Dict[str, Any]  # GeoJSON polygon
    center_lat: float
    center_lng: float
    radius: Optional[float] = None
    min_delivery_fee: Optional[float] = None
    max_delivery_fee: Optional[float] = None
    base_price: Optional[float] = None
    price_per_km: Optional[float] = None
    max_delivery_time: Optional[int] = None
    min_courier_rating: Optional[float] = None
    requires_special_vehicle: bool = False
    peak_hour_multiplier: float = 1.0

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    zone_type: Optional[ZoneType] = None
    coordinates: Optional[Dict[str, Any]] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius: Optional[float] = None
    is_active: Optional[bool] = None
    min_delivery_fee: Optional[float] = None
    max_delivery_fee: Optional[float] = None
    base_price: Optional[float] = None
    price_per_km: Optional[float] = None
    max_delivery_time: Optional[int] = None
    min_courier_rating: Optional[float] = None
    requires_special_vehicle: Optional[bool] = None
    peak_hour_multiplier: Optional[float] = None

class ZonePricingRuleCreate(BaseModel):
    name: str
    condition_type: str  # distance, time, weight, etc.
    condition_value: float
    operator: str  # >, <, >=, <=, =
    price_adjustment: float
    adjustment_type: str = "fixed"  # fixed, percentage
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class ZoneRestrictionCreate(BaseModel):
    restriction_type: str  # vehicle_type, time, weather, etc.
    restriction_value: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class ZonePricingRuleResponse(BaseModel):
    id: int
    name: str
    condition_type: str
    condition_value: float
    operator: str
    price_adjustment: float
    adjustment_type: str
    is_active: bool
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime

class ZoneRestrictionResponse(BaseModel):
    id: int
    restriction_type: str
    restriction_value: str
    description: Optional[str]
    is_active: bool
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: datetime

class ZoneResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    zone_type: ZoneType
    coordinates: Dict[str, Any]
    center_lat: float
    center_lng: float
    radius: Optional[float]
    is_active: bool
    min_delivery_fee: Optional[float]
    max_delivery_fee: Optional[float]
    base_price: Optional[float]
    price_per_km: Optional[float]
    max_delivery_time: Optional[int]
    min_courier_rating: Optional[float]
    requires_special_vehicle: bool
    peak_hour_multiplier: float
    created_at: datetime
    updated_at: Optional[datetime]
    pricing_rules: List[ZonePricingRuleResponse] = []
    restrictions: List[ZoneRestrictionResponse] = []
