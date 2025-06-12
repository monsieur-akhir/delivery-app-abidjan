
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import enum

class ComplaintType(str, enum.Enum):
    delivery = "delivery"
    payment = "payment"
    courier = "courier"
    technical = "technical"
    other = "other"

class ComplaintStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class ComplaintPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class ComplaintBase(BaseModel):
    type: ComplaintType
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    delivery_id: Optional[int] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    priority: Optional[ComplaintPriority] = None
    response: Optional[str] = None
    assigned_to: Optional[int] = None

class ComplaintResponse(ComplaintBase):
    id: int
    user_id: int
    status: ComplaintStatus
    priority: ComplaintPriority
    response: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
