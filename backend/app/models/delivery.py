# Ajouter ces imports si nécessaire
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base
from .transport import VehicleType

class DeliveryStatus(str, enum.Enum):
    pending = "pending"  # En attente d'enchères
    bidding = "bidding"  # Enchères en cours
    accepted = "accepted"  # Enchère acceptée, en attente de ramassage
    picked_up = "picked_up"  # Colis récupéré
    in_progress = "in_progress"  # En cours de livraison
    in_transit = "in_transit"  # En transit
    delivered = "delivered"  # Livré, en attente de confirmation
    completed = "completed"  # Terminé et confirmé
    cancelled = "cancelled"  # Annulé

class BidStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    expired = "expired"

class DeliveryType(str, enum.Enum):
    standard = "standard"
    express = "express"
    collaborative = "collaborative"

class OTPValidationType(str, enum.Enum):
    sms = "sms"
    whatsapp = "whatsapp"
    signature = "signature"
    photo = "photo"

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Informations de ramassage
    pickup_address = Column(String, nullable=False)
    pickup_commune = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    pickup_contact_name = Column(String, nullable=True)
    pickup_contact_phone = Column(String, nullable=True)

    # Informations de livraison
    delivery_address = Column(String, nullable=False)
    delivery_commune = Column(String, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    delivery_contact_name = Column(String, nullable=True)
    delivery_contact_phone = Column(String, nullable=True)

    # Informations sur le colis
    package_description = Column(Text, nullable=True)
    package_size = Column(String, nullable=True)  # small, medium, large
    package_weight = Column(Float, nullable=True)  # en kg
    is_fragile = Column(Boolean, default=False)

    # Nouveau champ pour la catégorie de marchandises
    cargo_category = Column(String, nullable=True)

    # Nouveau champ pour le mode de transport requis
    required_vehicle_type = Column(Enum(VehicleType), nullable=True)

    # Informations sur le prix
    proposed_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=True)
    total_discount = Column(Float, default=0.0)
    cashback_earned = Column(Float, default=0.0)
    applied_promotions = Column(JSON, nullable=True)  # IDs des promotions appliquées

    # Type et statut
    delivery_type = Column(Enum(DeliveryType), default=DeliveryType.standard)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.pending)

    # Validation OTP
    requires_otp = Column(Boolean, default=False)
    otp_code = Column(String(6), nullable=True)
    otp_sent_at = Column(DateTime(timezone=True), nullable=True)
    otp_verified_at = Column(DateTime(timezone=True), nullable=True)
    otp_attempts = Column(Integer, default=0)
    otp_validation_type = Column(Enum(OTPValidationType), nullable=True)
    fallback_validation_data = Column(JSON, nullable=True)  # Signature ou photo en base64

    # Dates importantes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    pickup_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Métadonnées
    estimated_distance = Column(Float, nullable=True)  # en km
    estimated_duration = Column(Integer, nullable=True)  # en minutes
    actual_duration = Column(Integer, nullable=True)  # en minutes

    # Relations
    client = relationship("User", back_populates="client_deliveries", foreign_keys=[client_id])
    courier = relationship("User", back_populates="courier_deliveries", foreign_keys=[courier_id])
    bids = relationship("Bid", back_populates="delivery")
    tracking_points = relationship("TrackingPoint", back_populates="delivery")
    complaints = relationship("Complaint", back_populates="delivery")

    # Nouveau champ pour le véhicule utilisé
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    vehicle = relationship("Vehicle")

    def generate_otp(self):
        """Génère un code OTP à 6 chiffres"""
        import random
        self.otp_code = str(random.randint(100000, 999999))
        self.otp_sent_at = func.now()
        self.otp_attempts = 0
        return self.otp_code

    def is_otp_valid(self):
        """Vérifie si l'OTP est encore valide (15 minutes)"""
        if not self.otp_sent_at:
            return False
        from datetime import datetime, timedelta
        return datetime.utcnow() - self.otp_sent_at < timedelta(minutes=15)

    def can_attempt_otp(self):
        """Vérifie si on peut encore tenter l'OTP (max 3 tentatives)"""
        return self.otp_attempts < 3 and self.is_otp_valid()

class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    courier_id = Column(Integer, ForeignKey("users.id"))
    price = Column(Float, nullable=False)
    proposed_pickup_time = Column(DateTime(timezone=True), nullable=True)
    proposed_delivery_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(BidStatus), default=BidStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    delivery = relationship("Delivery", back_populates="bids")
    courier = relationship("User")

class TrackingPoint(Base):
    __tablename__ = "tracking_points"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    delivery = relationship("Delivery", back_populates="tracking_points")
