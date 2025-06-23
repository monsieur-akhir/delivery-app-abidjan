from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

class MultiDestinationStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class MultiDestinationDelivery(Base):
    __tablename__ = "multi_destination_deliveries"

    id = Column(Integer, primary_key=True, index=True)

    # Participants
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Informations générales
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=MultiDestinationStatus.pending.value)

    # Destinations (stockées en JSON)
    destinations = Column(JSON, nullable=False)  # Liste des destinations avec détails

    # Pricing
    total_price = Column(Float, nullable=True)
    price_per_destination = Column(Float, nullable=True)

    # Timing
    estimated_duration = Column(Integer, nullable=True)  # en minutes
    scheduled_start_time = Column(DateTime, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Tracking
    current_destination_index = Column(Integer, default=0)
    completed_destinations = Column(JSON, nullable=True)  # Liste des destinations terminées

    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    client = relationship("User", foreign_keys=[client_id], back_populates="multi_destination_deliveries_as_client")
    courier = relationship("User", foreign_keys=[courier_id], back_populates="multi_destination_deliveries_as_courier")
    stops = relationship("MultiDestinationStop", back_populates="delivery", cascade="all, delete-orphan")
    bids = relationship("MultiDestinationBid", back_populates="delivery", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<MultiDestinationDelivery(id={self.id}, client_id={self.client_id}, status='{self.status}')>"


class MultiDestinationStop(Base):
    __tablename__ = "multi_destination_stops"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("multi_destination_deliveries.id"), nullable=False)
    stop_order = Column(Integer, nullable=False)
    address = Column(String(500), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    commune = Column(String(100))
    instructions = Column(Text)
    recipient_name = Column(String(200))
    recipient_phone = Column(String(20))
    status = Column(String(50), default="pending")  # pending, completed, failed, skipped
    estimated_arrival = Column(DateTime)
    actual_arrival = Column(DateTime)
    completion_time = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    delivery = relationship("MultiDestinationDelivery", back_populates="stops")

    def __repr__(self):
        return f"<MultiDestinationStop(id={self.id}, delivery_id={self.delivery_id}, order={self.stop_order})>"


class MultiDestinationBid(Base):
    __tablename__ = "multi_destination_bids"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("multi_destination_deliveries.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    estimated_duration = Column(Integer)  # en minutes
    message = Column(Text)
    status = Column(String(50), default="pending")  # pending, accepted, rejected, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime)

    # Relations
    delivery = relationship("MultiDestinationDelivery", back_populates="bids")
    courier = relationship("User", foreign_keys=[courier_id])

    def __repr__(self):
        return f"<MultiDestinationBid(id={self.id}, delivery_id={self.delivery_id}, courier_id={self.courier_id}, price={self.total_price})>"