from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from datetime import datetime

from app.db.base import Base


class CollaborativeRole(str, PyEnum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    SUPPORT = "support"


class CollaborativeStatus(str, PyEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CollaborativeDelivery(Base):
    __tablename__ = "collaborative_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # primary, secondary, support
    share_percentage = Column(Float, nullable=False)  # Pourcentage de partage des gains
    status = Column(String(20), default=CollaborativeStatus.PENDING.value, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    earnings = Column(Float, nullable=True)  # Gains calculés
    notes = Column(Text, nullable=True)
    
    # Relations
    delivery = relationship("Delivery")
    courier = relationship("User", foreign_keys=[courier_id])


class CollaborativeMessage(Base):
    __tablename__ = "collaborative_messages"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text", nullable=False)  # text, location, image
    message_metadata = Column(Text, nullable=True)  # JSON pour données supplémentaires
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    delivery = relationship("Delivery")
    courier = relationship("User")


class CollaborativeEarning(Base):
    __tablename__ = "collaborative_earnings"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)
    base_amount = Column(Float, nullable=False)  # Montant de base
    bonus_amount = Column(Float, default=0.0, nullable=False)  # Bonus éventuel
    penalty_amount = Column(Float, default=0.0, nullable=False)  # Pénalité éventuelle
    final_amount = Column(Float, nullable=False)  # Montant final
    share_percentage = Column(Float, nullable=False)
    payment_status = Column(String(20), default="pending", nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    delivery = relationship("Delivery")
    courier = relationship("User")
