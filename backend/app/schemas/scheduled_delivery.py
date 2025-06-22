
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

from .user import UserResponse
from .delivery import DeliveryResponse

# === ENUMS ===

class RecurrenceType(str, enum.Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"

class ScheduledDeliveryStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"

# === BASE SCHEMAS ===

class ScheduledDeliveryBase(BaseModel):
    title: str
    description: Optional[str] = None
    pickup_address: str
    pickup_commune: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    delivery_address: str
    delivery_commune: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    delivery_instructions: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    is_fragile: Optional[bool] = False
    cargo_category: Optional[str] = None
    required_vehicle_type: Optional[str] = None
    proposed_price: Optional[float] = None
    delivery_type: str = "standard"
    special_instructions: Optional[str] = None

# === CREATE / UPDATE ===

class ScheduledDeliveryCreate(ScheduledDeliveryBase):
    scheduled_date: datetime
    recurrence_type: RecurrenceType = RecurrenceType.none
    recurrence_interval: Optional[int] = 1
    recurrence_days: Optional[List[int]] = None  # [1,2,3,4,5] pour lun-ven
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    notification_advance_hours: Optional[int] = 24
    auto_create_delivery: Optional[bool] = True

    @validator('recurrence_days')
    def validate_recurrence_days(cls, v, values):
        if v and values.get('recurrence_type') == RecurrenceType.weekly:
            if not all(1 <= day <= 7 for day in v):
                raise ValueError('Les jours de la semaine doivent être entre 1 et 7')
        return v

    @validator('scheduled_date')
    def validate_scheduled_date(cls, v):
        if v <= datetime.now():
            raise ValueError('La date de planification doit être dans le futur')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if v and values.get('scheduled_date') and v <= values['scheduled_date']:
            raise ValueError('La date de fin doit être après la date de début')
        return v

class ScheduledDeliveryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pickup_address: Optional[str] = None
    pickup_commune: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    pickup_contact_name: Optional[str] = None
    pickup_contact_phone: Optional[str] = None
    pickup_instructions: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_commune: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    delivery_contact_name: Optional[str] = None
    delivery_contact_phone: Optional[str] = None
    delivery_instructions: Optional[str] = None
    package_description: Optional[str] = None
    package_size: Optional[str] = None
    package_weight: Optional[float] = None
    is_fragile: Optional[bool] = None
    cargo_category: Optional[str] = None
    required_vehicle_type: Optional[str] = None
    proposed_price: Optional[float] = None
    delivery_type: Optional[str] = None
    special_instructions: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    recurrence_type: Optional[RecurrenceType] = None
    recurrence_interval: Optional[int] = None
    recurrence_days: Optional[List[int]] = None
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    notification_advance_hours: Optional[int] = None
    auto_create_delivery: Optional[bool] = None
    status: Optional[ScheduledDeliveryStatus] = None

# === RESPONSE ===

class ScheduledDeliveryResponse(ScheduledDeliveryBase):
    id: int
    client_id: int
    scheduled_date: datetime
    recurrence_type: RecurrenceType
    recurrence_interval: int
    recurrence_days: Optional[List[int]] = None
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    notification_advance_hours: int
    auto_create_delivery: bool
    status: ScheduledDeliveryStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_executed_at: Optional[datetime] = None
    next_execution_at: Optional[datetime] = None
    total_executions: int

    # Relations
    client: Optional[Dict[str, Any]] = None
    upcoming_executions: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class ScheduledDeliveryExecutionResponse(BaseModel):
    id: int
    scheduled_delivery_id: int
    delivery_id: Optional[int] = None
    planned_date: datetime
    executed_date: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    notification_sent_at: Optional[datetime] = None
    delivery: Optional[DeliveryResponse] = None

    class Config:
        from_attributes = True

# === AUTRES SCHÉMAS ===

class CalendarEvent(BaseModel):
    id: int
    title: str
    start: datetime
    end: datetime
    type: str = "scheduled_delivery"
    status: str
    client_name: str
    pickup_address: str
    delivery_address: str
    recurrence_type: str
    next_occurrences: Optional[List[datetime]] = None

class ScheduledDeliveryStats(BaseModel):
    total_scheduled: int
    active_schedules: int
    paused_schedules: int
    total_executions_this_month: int
    upcoming_executions_today: int
    upcoming_executions_this_week: int
    success_rate: float
    most_common_recurrence: str

class BulkScheduleCreate(BaseModel):
    schedules: List[ScheduledDeliveryCreate]
    apply_to_all: Optional[Dict[str, Any]] = None  # Paramètres à appliquer à tous
