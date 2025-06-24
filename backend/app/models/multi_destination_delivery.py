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
    status = Column(String, default=MultiDestinationStatus.pending.value)

    # Champs pickup
    pickup_address = Column(String, nullable=False)
    pickup_commune = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    pickup_contact_name = Column(String, nullable=True)
    pickup_contact_phone = Column(String, nullable=True)
    pickup_instructions = Column(Text, nullable=True)

    # Informations sur la livraison
    total_destinations = Column(Integer, nullable=False)
    optimized_route = Column(JSON, nullable=True)  # Liste des ordres optimisés
    estimated_total_distance = Column(Float, nullable=True)  # en km
    estimated_total_duration = Column(Integer, nullable=True)  # en minutes
    actual_total_duration = Column(Integer, nullable=True)  # en minutes

    # Prix
    total_proposed_price = Column(Float, nullable=False)
    total_final_price = Column(Float, nullable=True)

    # Options et préférences
    special_instructions = Column(Text, nullable=True)
    vehicle_type_required = Column(String, nullable=True)
    is_fragile = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)

    # Destinations (stockées en JSON pour compatibilité)
    destinations = Column(JSON, nullable=False)

    # Timing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

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
    
    # Informations de base
    original_order = Column(Integer, nullable=False)  # Ordre initial
    optimized_order = Column(Integer, nullable=True)  # Ordre optimisé
    
    # Informations de livraison
    delivery_address = Column(String(500), nullable=False)
    delivery_commune = Column(String(100))
    delivery_lat = Column(Float)
    delivery_lng = Column(Float)
    delivery_contact_name = Column(String(200), nullable=True)
    delivery_contact_phone = Column(String(20), nullable=True)
    
    # Informations sur le colis
    package_description = Column(String(500), nullable=True)
    package_size = Column(String(50), nullable=True)
    package_weight = Column(Float, nullable=True)
    
    # Informations sur le destinataire
    recipient_name = Column(String(200))
    recipient_phone = Column(String(20))
    special_instructions = Column(Text, nullable=True)
    
    # Suivi de la livraison
    status = Column(String(50), default="pending")  # pending, arrived, delivered, failed
    estimated_arrival_time = Column(DateTime, nullable=True)
    actual_arrival_time = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    estimated_distance_from_previous = Column(Float, nullable=True)
    estimated_duration_from_previous = Column(Integer, nullable=True)
    proof_of_delivery_url = Column(String(500), nullable=True)
    delivery_notes = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    delivery = relationship("MultiDestinationDelivery", back_populates="stops")

    def __repr__(self):
        return f"<MultiDestinationStop(id={self.id}, delivery_id={self.delivery_id}, order={self.original_order})>"


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