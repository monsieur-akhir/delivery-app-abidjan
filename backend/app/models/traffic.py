from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

class TrafficSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    blocked = "blocked"

class TrafficReport(Base):
    __tablename__ = "traffic_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    commune = Column(String, nullable=False)
    severity = Column(Enum(TrafficSeverity), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    reporter = relationship("User", foreign_keys=[reporter_id])

class WeatherAlert(Base):
    __tablename__ = "weather_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    commune = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)  # rain, storm, etc.
    severity = Column(String, nullable=False)  # low, medium, high
    description = Column(Text, nullable=False)
    source = Column(String, nullable=False)  # openweathermap, manual
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
