# Ajouter ces imports si nécessaire
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime
from typing import List, Optional

from ..db.base import Base
from .transport import VehicleType
from .delivery import Delivery

class UserRole(str, enum.Enum):
    client = "client"
    courier = "courier"
    business = "business"
    manager = "manager"

class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    pending_verification = "pending_verification"

class KYCStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.pending_verification)
    commune = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.pending)
    kyc_document_url = Column(String, nullable=True)
    kyc_rejection_reason = Column(String, nullable=True)
    language_preference = Column(String, default="fr")
    keycloak_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    client_deliveries = relationship("Delivery", back_populates="client", foreign_keys="Delivery.client_id")
    courier_deliveries = relationship("Delivery", back_populates="courier", foreign_keys="Delivery.courier_id")
    # TODO: Re-add rating relationships after fixing circular imports
    # ratings_received = relationship("Rating", back_populates="rated_user", foreign_keys="Rating.rated_user_id")
    # ratings_given = relationship("Rating", back_populates="rater", foreign_keys="Rating.rater_id")
    # TODO: Re-add gamification and other relationships after fixing circular imports
    # courier_points = relationship("CourierPoints", back_populates="courier", uselist=False)
    # wallet = relationship("Wallet", back_populates="user", uselist=False)
    # notifications = relationship("Notification", back_populates="user")
    
    # Relations spécifiques au rôle business
    business_profile = relationship("BusinessProfile", back_populates="user", uselist=False)
    
    # Relations spécifiques au rôle courier
    courier_profile = relationship("CourierProfile", back_populates="user", uselist=False)
    
    # Relations spécifiques aux véhicules des courriers
    courier_vehicles = relationship("CourierVehicle", back_populates="courier")

class BusinessProfile(Base):
    __tablename__ = "business_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    business_name = Column(String, nullable=False)
    business_type = Column(String, nullable=False)
    siret = Column(String, nullable=True)
    kbis_url = Column(String, nullable=True)
    address = Column(String, nullable=False)
    commune = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    commission_rate = Column(Float, default=0.10)  # 10% par défaut
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="business_profile")
    products = relationship("Product", back_populates="business")
    
    # TODO: Re-add vehicle relationships after fixing circular imports
    # vehicles = relationship("Vehicle", back_populates="business")

class CourierProfile(Base):
    __tablename__ = "courier_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    id_card_number = Column(String, nullable=True)
    id_card_url = Column(String, nullable=True)
    vehicle_type = Column(Enum(VehicleType), default=VehicleType.MOTORCYCLE)  # Mise à jour pour utiliser l'enum VehicleType
    license_plate = Column(String, nullable=True)
    driving_license_url = Column(String, nullable=True)
    insurance_url = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_location_lat = Column(Float, nullable=True)
    last_location_lng = Column(Float, nullable=True)
    last_location_updated = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="courier_profile")
