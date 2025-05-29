from pydantic import BaseModel, Field, validator
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum


class VehicleType(str, Enum):
    SCOOTER = "scooter"
    BICYCLE = "bicycle"
    MOTORCYCLE = "motorcycle"
    VAN = "van"
    PICKUP = "pickup"
    KIA_TRUCK = "kia_truck"
    MOVING_TRUCK = "moving_truck"
    CUSTOM = "custom"


class CargoCategory(str, Enum):
    DOCUMENTS = "documents"
    SMALL_PACKAGES = "small_packages"
    MEDIUM_PACKAGES = "medium_packages"
    LARGE_PACKAGES = "large_packages"
    FRAGILE = "fragile"
    FOOD = "food"
    ELECTRONICS = "electronics"
    FURNITURE = "furniture"
    APPLIANCES = "appliances"
    CONSTRUCTION = "construction"
    CUSTOM = "custom"


class VehicleStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"


class DocumentType(str, Enum):
    REGISTRATION = "registration"
    INSURANCE = "insurance"
    TECHNICAL_INSPECTION = "technical_inspection"


# Vehicle schemas
class VehicleBase(BaseModel):
    name: str
    type: VehicleType
    custom_type: Optional[str] = None
    license_plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    max_weight: Optional[float] = None
    max_volume: Optional[float] = None
    max_distance: Optional[float] = None
    photo_url: Optional[str] = None
    status: VehicleStatus = VehicleStatus.ACTIVE
    is_electric: bool = False
    business_id: Optional[int] = None

    @validator("custom_type")
    def validate_custom_type(cls, v, values):
        if values.get("type") == VehicleType.CUSTOM and not v:
            raise ValueError("Custom type is required when type is custom")
        return v


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[VehicleType] = None
    custom_type: Optional[str] = None
    license_plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    max_weight: Optional[float] = None
    max_volume: Optional[float] = None
    max_distance: Optional[float] = None
    photo_url: Optional[str] = None
    status: Optional[VehicleStatus] = None
    is_electric: Optional[bool] = None
    business_id: Optional[int] = None


class Vehicle(VehicleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


# CourierVehicle schemas
class CourierVehicleBase(BaseModel):
    vehicle_type: VehicleType
    license_plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    is_electric: bool = False


class CourierVehicleCreate(CourierVehicleBase):
    pass


class CourierVehicleUpdate(BaseModel):
    license_plate: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    is_electric: Optional[bool] = None


class CourierVehicle(BaseModel):
    id: int
    courier_id: int
    vehicle_type: VehicleType
    license_plate: str
    brand: Optional[str] = None
    model: Optional[str] = None
    is_electric: bool
    is_primary: bool
    registration_document_url: Optional[str] = None
    insurance_document_url: Optional[str] = None
    technical_inspection_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


# TransportRule schemas
class TransportRuleBase(BaseModel):
    vehicle_id: int
    cargo_category: CargoCategory
    custom_category: Optional[str] = None
    min_distance: Optional[float] = None
    max_distance: Optional[float] = None
    min_weight: Optional[float] = None
    max_weight: Optional[float] = None
    min_volume: Optional[float] = None
    max_volume: Optional[float] = None
    priority: int = 0
    price_multiplier: float = 1.0
    is_active: bool = True

    @validator("custom_category")
    def validate_custom_category(cls, v, values):
        if values.get("cargo_category") == CargoCategory.CUSTOM and not v:
            raise ValueError("Custom category is required when cargo category is custom")
        return v


class TransportRuleCreate(TransportRuleBase):
    pass


class TransportRuleUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    cargo_category: Optional[CargoCategory] = None
    custom_category: Optional[str] = None
    min_distance: Optional[float] = None
    max_distance: Optional[float] = None
    min_weight: Optional[float] = None
    max_weight: Optional[float] = None
    min_volume: Optional[float] = None
    max_volume: Optional[float] = None
    priority: Optional[int] = None
    price_multiplier: Optional[float] = None
    is_active: Optional[bool] = None


class VehicleInfo(BaseModel):
    id: int
    name: str
    type: VehicleType

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


class TransportRule(TransportRuleBase):
    id: int
    vehicle: VehicleInfo
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


# VehicleRecommendation schemas
class VehicleRecommendationRequest(BaseModel):
    cargo_category: CargoCategory
    distance: float
    weight: Optional[float] = None
    volume: Optional[float] = None
    is_fragile: Optional[bool] = False
    is_urgent: Optional[bool] = False
    weather_condition: Optional[int] = None  # Code météo


class RecommendedVehicle(BaseModel):
    id: int
    type: VehicleType
    name: str


class VehicleAlternative(BaseModel):
    id: int
    type: VehicleType
    name: str
    price_multiplier: float


class VehicleRecommendation(BaseModel):
    recommended_vehicle: RecommendedVehicle
    reason: str
    price_multiplier: float
    alternatives: List[VehicleAlternative]


# VehicleUsage schemas
class VehicleUsageBase(BaseModel):
    courier_vehicle_id: int
    delivery_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    distance_traveled: Optional[float] = None
    fuel_consumed: Optional[float] = None
    co2_emissions: Optional[float] = None


class VehicleUsageCreate(VehicleUsageBase):
    pass


class VehicleUsageUpdate(BaseModel):
    end_time: Optional[datetime] = None
    distance_traveled: Optional[float] = None
    fuel_consumed: Optional[float] = None
    co2_emissions: Optional[float] = None


class VehicleUsage(VehicleUsageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True  # Keeping for backwards compatibility


# Document upload schema
class DocumentUpload(BaseModel):
    document_type: DocumentType
