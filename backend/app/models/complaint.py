from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..db.base import Base

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

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ComplaintType), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.pending)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.medium)
    response = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    assigned_manager = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to])
    delivery = relationship("Delivery", back_populates="complaints")