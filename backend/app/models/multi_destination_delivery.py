
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .delivery import DeliveryStatus
from ..db.session import Base

class MultiDestinationDelivery(Base):
    __tablename__ = "multi_destination_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Point de départ unique
    pickup_address = Column(String, nullable=False)
    pickup_commune = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    pickup_contact_name = Column(String, nullable=True)
    pickup_contact_phone = Column(String, nullable=True)
    pickup_instructions = Column(Text, nullable=True)
    
    # Informations générales
    total_destinations = Column(Integer, nullable=False)
    optimized_route = Column(JSON, nullable=True)  # Ordre optimisé des destinations
    estimated_total_distance = Column(Float, nullable=True)
    estimated_total_duration = Column(Integer, nullable=True)
    actual_total_duration = Column(Integer, nullable=True)
    
    # Prix et statut
    total_proposed_price = Column(Float, nullable=False)
    total_final_price = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, accepted, in_progress, completed, cancelled
    
    # Dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    special_instructions = Column(Text, nullable=True)
    vehicle_type_required = Column(String, nullable=True)
    is_fragile = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    
    # Relations
    client = relationship("User", foreign_keys=[client_id], back_populates="multi_destination_deliveries_as_client")
    courier = relationship("User", foreign_keys=[courier_id], back_populates="multi_destination_deliveries_as_courier")
    destinations = relationship("MultiDestinationStop", back_populates="delivery", cascade="all, delete-orphan")
    bids = relationship("MultiDestinationBid", back_populates="delivery")

class MultiDestinationStop(Base):
    __tablename__ = "multi_destination_stops"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("multi_destination_deliveries.id"), nullable=False)
    
    # Informations d'adresse
    delivery_address = Column(String, nullable=False)
    delivery_commune = Column(String, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    delivery_contact_name = Column(String, nullable=True)
    delivery_contact_phone = Column(String, nullable=True)
    
    # Informations du colis pour cette destination
    package_description = Column(Text, nullable=True)
    package_size = Column(String, nullable=True)
    package_weight = Column(Float, nullable=True)
    recipient_name = Column(String, nullable=False)
    recipient_phone = Column(String, nullable=True)
    special_instructions = Column(Text, nullable=True)
    
    # Ordre et statut
    original_order = Column(Integer, nullable=False)  # Ordre saisi par le client
    optimized_order = Column(Integer, nullable=True)  # Ordre optimisé
    status = Column(String, default="pending")  # pending, delivered, failed
    estimated_arrival_time = Column(DateTime(timezone=True), nullable=True)
    actual_arrival_time = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Métadonnées
    estimated_distance_from_previous = Column(Float, nullable=True)
    estimated_duration_from_previous = Column(Integer, nullable=True)
    proof_of_delivery_url = Column(String, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    
    # Relations
    delivery = relationship("MultiDestinationDelivery", back_populates="destinations")

class MultiDestinationBid(Base):
    __tablename__ = "multi_destination_bids"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("multi_destination_deliveries.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Détails de l'enchère
    proposed_price = Column(Float, nullable=False)
    estimated_duration = Column(Integer, nullable=True)  # en minutes
    message = Column(Text, nullable=True)
    alternative_route = Column(JSON, nullable=True)  # Proposition d'ordre alternatif
    
    # Statut et dates
    status = Column(String, default="pending")  # pending, accepted, rejected, withdrawn
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    delivery = relationship("MultiDestinationDelivery", back_populates="bids")
    courier = relationship("User")
