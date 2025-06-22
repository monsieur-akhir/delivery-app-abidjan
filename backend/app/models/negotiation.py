
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from ..db.base import Base

class NegotiationStatus(PyEnum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    counter_offered = "counter_offered"
    expired = "expired"

class NegotiationType(PyEnum):
    initial_offer = "initial_offer"
    client_counter = "client_counter"
    courier_counter = "courier_counter"

class ScheduledDeliveryNegotiation(Base):
    __tablename__ = "scheduled_delivery_negotiations"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_delivery_id = Column(Integer, ForeignKey("scheduled_deliveries.id"), nullable=False)
    
    # Participants
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Négociation
    proposed_price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    negotiation_type = Column(String, default=NegotiationType.initial_offer.value)
    status = Column(String, default=NegotiationStatus.pending.value)
    
    # Messages et notes
    message = Column(Text, nullable=True)  # Message accompagnant l'offre
    client_notes = Column(Text, nullable=True)
    courier_notes = Column(Text, nullable=True)
    
    # Conditions proposées
    proposed_pickup_time = Column(DateTime, nullable=True)
    proposed_delivery_time = Column(DateTime, nullable=True)
    special_conditions = Column(Text, nullable=True)
    
    # Suivi
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    scheduled_delivery = relationship("ScheduledDelivery")
    client = relationship("User", foreign_keys=[client_id])
    courier = relationship("User", foreign_keys=[courier_id])
    
    # Référence à la négociation parent (pour les contre-offres)
    parent_negotiation_id = Column(Integer, ForeignKey("scheduled_delivery_negotiations.id"), nullable=True)
    parent_negotiation = relationship("ScheduledDeliveryNegotiation", remote_side=[id])
    
    # Historique des négociations liées
    related_negotiations = relationship("ScheduledDeliveryNegotiation", 
                                      foreign_keys=[parent_negotiation_id],
                                      back_populates="parent_negotiation")
