from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

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

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    data = Column(Text, nullable=True)  # JSON data
    status = Column(Enum(NotificationStatus), default=NotificationStatus.sent)
    channel = Column(Enum(NotificationChannel), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    user = relationship("User")
