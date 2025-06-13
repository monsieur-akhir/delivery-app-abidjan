from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from .user import UserResponse


class CollaborativeRole(str, Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    SUPPORT = "support"


class CollaborativeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MessageType(str, Enum):
    TEXT = "text"
    LOCATION = "location"
    IMAGE = "image"


# Schémas pour les livraisons collaboratives
class CollaborativeDeliveryBase(BaseModel):
    delivery_id: int
    courier_id: int
    role: CollaborativeRole
    share_percentage: float = Field(..., ge=0, le=100)
    notes: Optional[str] = None

    @validator('share_percentage')
    def validate_share_percentage(cls, v, values):
        role = values.get('role')
        if role == CollaborativeRole.PRIMARY and v < 40:
            raise ValueError('Le coursier principal doit avoir au moins 40% des gains')
        elif role == CollaborativeRole.SECONDARY and v < 20:
            raise ValueError('Le coursier secondaire doit avoir au moins 20% des gains')
        elif role == CollaborativeRole.SUPPORT and v < 10:
            raise ValueError('Le coursier support doit avoir au moins 10% des gains')
        return v


class CollaborativeDeliveryCreate(CollaborativeDeliveryBase):
    pass


class CollaborativeDeliveryUpdate(BaseModel):
    role: Optional[CollaborativeRole] = None
    share_percentage: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[CollaborativeStatus] = None
    notes: Optional[str] = None


class CollaborativeDeliveryResponse(CollaborativeDeliveryBase):
    id: int
    status: CollaborativeStatus
    joined_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    earnings: Optional[float] = None
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# Schémas pour les messages
class CollaborativeMessageBase(BaseModel):
    delivery_id: int
    message: str
    message_type: MessageType = MessageType.TEXT
    metadata: Optional[str] = None


class CollaborativeMessageCreate(CollaborativeMessageBase):
    pass


class CollaborativeMessageResponse(CollaborativeMessageBase):
    id: int
    courier_id: int
    created_at: datetime
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# Schémas pour les gains
class CollaborativeEarningBase(BaseModel):
    delivery_id: int
    courier_id: int
    role: CollaborativeRole
    base_amount: float
    bonus_amount: float = 0.0
    penalty_amount: float = 0.0
    share_percentage: float


class CollaborativeEarningCreate(CollaborativeEarningBase):
    pass


class CollaborativeEarningResponse(CollaborativeEarningBase):
    id: int
    final_amount: float
    payment_status: str
    paid_at: Optional[datetime] = None
    created_at: datetime
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# Schémas pour les statistiques
class CollaborativeStats(BaseModel):
    total_deliveries: int
    active_deliveries: int
    completed_deliveries: int
    total_earnings: float
    average_team_size: float
    success_rate: float


class CollaborativeDeliveryDetails(BaseModel):
    delivery: Dict[str, Any]
    collaborators: List[CollaborativeDeliveryResponse]
    messages: List[CollaborativeMessageResponse]
    earnings: List[CollaborativeEarningResponse]
    stats: Dict[str, Any]


# Schémas pour rejoindre une livraison
class JoinDeliveryRequest(BaseModel):
    role: CollaborativeRole
    share_percentage: Optional[float] = None
    notes: Optional[str] = None

    @validator('share_percentage')
    def set_default_share(cls, v, values):
        if v is None:
            role = values.get('role')
            if role == CollaborativeRole.PRIMARY:
                return 50.0
            elif role == CollaborativeRole.SECONDARY:
                return 30.0
            elif role == CollaborativeRole.SUPPORT:
                return 20.0
        return v
