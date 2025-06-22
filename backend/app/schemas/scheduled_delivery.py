
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# === ENUMS ===
class RecurrenceType(str, Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"

class ScheduledDeliveryStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"

class ExecutionStatus(str, Enum):
    pending = "pending"
    created = "created"
    failed = "failed"
    skipped = "skipped"

# === BASE ===
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
    recurrence_days: Optional[List[int]] = None  # Jours de la semaine [1-7]
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = None
    notification_advance_hours: Optional[int] = 24
    auto_create_delivery: Optional[bool] = True

    @validator('recurrence_days')
    def validate_recurrence_days(cls, v, values):
        if v is not None:
            if not all(1 <= day <= 7 for day in v):
                raise ValueError('Les jours de la semaine doivent être entre 1 et 7')
        return v

    @validator('recurrence_interval')
    def validate_recurrence_interval(cls, v):
        if v is not None and v < 1:
            raise ValueError('L\'intervalle de récurrence doit être supérieur à 0')
        return v

    @validator('max_occurrences')
    def validate_max_occurrences(cls, v):
        if v is not None and v < 1:
            raise ValueError('Le nombre maximum d\'occurrences doit être supérieur à 0')
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
class ClientInfo(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None

class ScheduledDeliveryResponse(ScheduledDeliveryBase):
    id: int
    client_id: int
    scheduled_date: datetime
    recurrence_type: RecurrenceType
    recurrence_interval: Optional[int] = None
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
    client: ClientInfo

    class Config:
        from_attributes = True

# === CALENDAR ===
class CalendarEvent(BaseModel):
    id: int
    title: str
    start: datetime
    end: datetime
    status: str
    client_name: str
    pickup_address: str
    delivery_address: str
    recurrence_type: str

# === BULK OPERATIONS ===
class BulkScheduleCreate(BaseModel):
    schedules: List[ScheduledDeliveryCreate]
    apply_to_all: Optional[dict] = None

# === EXECUTION ===
class ScheduledDeliveryExecutionResponse(BaseModel):
    id: int
    scheduled_delivery_id: int
    planned_date: datetime
    executed_date: Optional[datetime] = None
    delivery_id: Optional[int] = None
    status: ExecutionStatus
    error_message: Optional[str] = None
    notification_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# === STATISTICS ===
class ScheduledDeliveryStats(BaseModel):
    total_scheduled: int
    active_schedules: int
    paused_schedules: int
    total_executions_this_month: int
    upcoming_executions_today: int
    upcoming_executions_this_week: int
    success_rate: float
    most_common_recurrence: str
