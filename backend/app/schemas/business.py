
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr
from .user import UserResponse

class BusinessDashboardResponse(BaseModel):
    total_deliveries: int
    active_deliveries: int
    completed_deliveries: int
    cancelled_deliveries: int = 0
    pending_deliveries: int = 0
    total_revenue: float
    period_revenue: float
    total_couriers: int
    revenue_by_day: Dict[str, Any]
    period: str

class BusinessCourierResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    email: Optional[str]
    profile_picture: Optional[str]
    status: str
    is_online: bool = False
    is_favorite: bool = False
    last_activity: Optional[datetime]
    vehicle: Optional[Dict[str, Any]]
    stats: Dict[str, Any]

class BusinessInviteRequest(BaseModel):
    phone: str
    message: Optional[str] = None
    commission: float = 15.0

class BusinessSettingsResponse(BaseModel):
    business_profile: Dict[str, Any]
    user_settings: Dict[str, Any]

class BusinessFinancesResponse(BaseModel):
    period: Dict[str, str]
    revenue: Dict[str, float]
    deliveries: Dict[str, Any]

class BusinessVehicleCreate(BaseModel):
    type: str
    make: str
    model: str
    year: int
    license_plate: str
    color: str
    capacity: Optional[float] = None
    is_active: bool = True

class BusinessVehicleUpdate(BaseModel):
    type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    color: Optional[str] = None
    capacity: Optional[float] = None
    is_active: Optional[bool] = None

class BusinessStatsResponse(BaseModel):
    total_businesses: int
    active_businesses: int
    total_deliveries: int
    total_revenue: float
    top_businesses: List[Dict[str, Any]]
    business_by_type: Dict[str, int]
    revenue_by_business: List[Dict[str, Any]]
