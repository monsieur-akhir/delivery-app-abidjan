from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class NotificationType(str, enum.Enum):
    delivery_status = "delivery_status"
    new_bid = "new_bid"
    bid_accepted = "bid_accepted"
    rating_received = "rating_received"
    reward_earned = "reward_earned"
    loan_status = "loan_status"
    system = "system"
    weather_alert = "weather_alert"

class NotificationStatus(str, enum.Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"
    failed = "failed"

class NotificationChannel(str, enum.Enum):
    push = "push"
    sms = "sms"
    whatsapp = "whatsapp"
    email = "email"
    in_app = "in_app"

# Schémas de base pour les notifications
class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    data: Optional[str] = None
    channel: NotificationChannel

# Schéma pour la création d'une notification
class NotificationCreate(NotificationBase):
    user_id: int

# Schéma pour la mise à jour d'une notification
class NotificationUpdate(BaseModel):
    status: NotificationStatus

# Schéma pour la réponse de notification
class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    status: NotificationStatus
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
