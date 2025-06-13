from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from typing import Optional, List
from datetime import datetime

from app.db.base import Base


class VehicleType(str, PyEnum):
    SCOOTER = "scooter"
    BICYCLE = "bicycle"
    MOTORCYCLE = "motorcycle"
    VAN = "van"
    PICKUP = "pickup"
    KIA_TRUCK = "kia_truck"
    MOVING_TRUCK = "moving_truck"
    CUSTOM = "custom"


class CargoCategory(str, PyEnum):
    DOCUMENTS = "documents"
    SMALL_PACKAGES = "small_packages"
    MEDIUM_PACKAGES = "medium_packages"
    LARGE_PACKAGES = "large_packages"
    FRAGILE = "fragile"
    FOOD = "food"
    ELECTRONICS = "electronics"
    FURNITURE = "furniture"
    APPLIANCES = "appliances"
    CONSTRUCTION = "construction"
    CUSTOM = "custom"


class VehicleStatus(str, PyEnum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"


class DocumentType(str, PyEnum):
    REGISTRATION = "registration"
    INSURANCE = "insurance"
    TECHNICAL_INSPECTION = "technical_inspection"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    custom_type = Column(String(100), nullable=True)
    license_plate = Column(String(20), nullable=False, unique=True)
    brand = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    year = Column(Integer, nullable=True)
    color = Column(String(30), nullable=True)
    max_weight = Column(Float, nullable=True)  # en kg
    max_volume = Column(Float, nullable=True)  # en m³
    max_distance = Column(Float, nullable=True)  # en km
    photo_url = Column(String(255), nullable=True)
    status = Column(String(30), default=VehicleStatus.ACTIVE.value, nullable=False)
    is_electric = Column(Boolean, default=False, nullable=False)
    business_id = Column(Integer, ForeignKey("business_profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    business = relationship("BusinessProfile")
    courier_vehicles = relationship("CourierVehicle", back_populates="vehicle", cascade="all, delete-orphan")
    transport_rules = relationship("TransportRule", back_populates="vehicle", cascade="all, delete-orphan")


class CourierVehicle(Base):
    __tablename__ = "courier_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    registration_document_url = Column(String(255), nullable=True)
    insurance_document_url = Column(String(255), nullable=True)
    technical_inspection_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    courier = relationship("User", back_populates="courier_vehicles")
    vehicle = relationship("Vehicle", back_populates="courier_vehicles")

    # Contrainte d'unicité
    __table_args__ = (UniqueConstraint("courier_id", "vehicle_id", name="uq_courier_vehicle"),)


class TransportRule(Base):
    __tablename__ = "transport_rules"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    cargo_category = Column(String(50), nullable=False)
    custom_category = Column(String(100), nullable=True)
    min_distance = Column(Float, nullable=True)  # en km
    max_distance = Column(Float, nullable=True)  # en km
    min_weight = Column(Float, nullable=True)  # en kg
    max_weight = Column(Float, nullable=True)  # en kg
    min_volume = Column(Float, nullable=True)  # en m³
    max_volume = Column(Float, nullable=True)  # en m³
    priority = Column(Integer, default=0, nullable=False)
    price_multiplier = Column(Float, default=1.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    vehicle = relationship("Vehicle", back_populates="transport_rules")


class VehicleUsage(Base):
    __tablename__ = "vehicle_usages"

    id = Column(Integer, primary_key=True, index=True)
    courier_vehicle_id = Column(Integer, ForeignKey("courier_vehicles.id"), nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    distance_traveled = Column(Float, nullable=True)  # en km
    fuel_consumed = Column(Float, nullable=True)  # en litres
    co2_emissions = Column(Float, nullable=True)  # en kg
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    courier_vehicle = relationship("CourierVehicle")

    # Contrainte d'unicité
    __table_args__ = (UniqueConstraint("courier_vehicle_id", "delivery_id", name="uq_vehicle_usage_delivery"),)
# Adding business profile related models.