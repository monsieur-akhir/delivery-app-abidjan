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

class BadgeType(str, enum.Enum):
    delivery = "delivery"
    rating = "rating"
    special = "special"
    milestone = "milestone"

class AchievementType(str, enum.Enum):
    delivery = "delivery"
    rating = "rating"
    special = "special"
    milestone = "milestone"

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
    courier = relationship("User")
    point_transactions = relationship("PointTransaction", back_populates="courier_points")
    rewards = relationship("Reward", back_populates="courier_points")
    badges = relationship("UserBadge", back_populates="courier_points")
    achievements = relationship("UserAchievement", back_populates="courier_points")

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

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    type = Column(Enum(BadgeType), nullable=False)
    icon_url = Column(String, nullable=True)
    points_required = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    courier_points_id = Column(Integer, ForeignKey("courier_points.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    courier_points = relationship("CourierPoints", back_populates="badges")
    badge = relationship("Badge", back_populates="user_badges")

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    type = Column(Enum(AchievementType), nullable=False)
    icon_url = Column(String, nullable=True)
    points_reward = Column(Integer, default=0)
    requirement_value = Column(Integer, default=0)  # Nombre de livraisons, notes, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    user_achievements = relationship("UserAchievement", back_populates="achievement")

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    courier_points_id = Column(Integer, ForeignKey("courier_points.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    progress = Column(Integer, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    courier_points = relationship("CourierPoints", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")
