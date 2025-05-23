from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

class RewardStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"

class CourierPoints(Base):
    __tablename__ = "courier_points"

    id = Column(Integer, primary_key=True, index=True)
    courier_id = Column(Integer, ForeignKey("users.id"), unique=True)
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    deliveries_completed = Column(Integer, default=0)
    five_star_ratings = Column(Integer, default=0)
    on_time_deliveries = Column(Integer, default=0)
    express_deliveries = Column(Integer, default=0)
    collaborative_deliveries = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    courier = relationship("User", back_populates="courier_points")
    point_transactions = relationship("PointTransaction", back_populates="courier_points")
    rewards = relationship("Reward", back_populates="courier_points")

class PointTransaction(Base):
    __tablename__ = "point_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    courier_points_id = Column(Integer, ForeignKey("courier_points.id"))
    points = Column(Integer, nullable=False)  # Peut être positif ou négatif
    reason = Column(String, nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    courier_points = relationship("CourierPoints", back_populates="point_transactions")
    delivery = relationship("Delivery")

class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    courier_points_id = Column(Integer, ForeignKey("courier_points.id"))
    reward_type = Column(String, nullable=False)  # airtime, food_voucher, etc.
    amount = Column(Float, nullable=False)
    points_used = Column(Integer, nullable=False)
    status = Column(Enum(RewardStatus), default=RewardStatus.pending)
    transaction_reference = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    courier_points = relationship("CourierPoints", back_populates="rewards")
