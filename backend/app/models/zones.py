
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from ..db.base import Base

class ZoneType(str, Enum):
    city = "city"
    district = "district"
    custom = "custom"
    exclusion = "exclusion"  # Zone où les livraisons ne sont pas autorisées

class Zone(Base):
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    zone_type = Column(String, nullable=False)  # ZoneType enum
    
    # Géolocalisation - Polygon GeoJSON
    coordinates = Column(JSON, nullable=False)  # GeoJSON polygon
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    radius = Column(Float, nullable=True)  # En kilomètres pour zones circulaires
    
    # Configuration
    is_active = Column(Boolean, default=True)
    min_delivery_fee = Column(Float, nullable=True)
    max_delivery_fee = Column(Float, nullable=True)
    base_price = Column(Float, nullable=True)
    price_per_km = Column(Float, nullable=True)
    
    # Paramètres opérationnels
    max_delivery_time = Column(Integer, nullable=True)  # En minutes
    min_courier_rating = Column(Float, nullable=True)
    requires_special_vehicle = Column(Boolean, default=False)
    peak_hour_multiplier = Column(Float, default=1.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    pricing_rules = relationship("ZonePricingRule", back_populates="zone")
    restrictions = relationship("ZoneRestriction", back_populates="zone")

class ZonePricingRule(Base):
    __tablename__ = "zone_pricing_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    
    name = Column(String, nullable=False)
    condition_type = Column(String, nullable=False)  # distance, time, weight, etc.
    condition_value = Column(Float, nullable=False)
    operator = Column(String, nullable=False)  # >, <, >=, <=, =
    
    price_adjustment = Column(Float, nullable=False)  # Montant ou pourcentage
    adjustment_type = Column(String, default="fixed")  # fixed, percentage
    
    is_active = Column(Boolean, default=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    zone = relationship("Zone", back_populates="pricing_rules")

class ZoneRestriction(Base):
    __tablename__ = "zone_restrictions"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    
    restriction_type = Column(String, nullable=False)  # vehicle_type, time, weather, etc.
    restriction_value = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    zone = relationship("Zone", back_populates="restrictions")
