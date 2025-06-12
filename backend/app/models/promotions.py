
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from ..db.base import Base

class PromotionType(str, Enum):
    discount_percentage = "discount_percentage"
    discount_fixed = "discount_fixed"
    free_delivery = "free_delivery"
    cashback = "cashback"
    referral_bonus = "referral_bonus"

class PromotionStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    expired = "expired"
    completed = "completed"

class Promotion(Base):
    __tablename__ = "promotions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    code = Column(String, unique=True, nullable=True)  # Code promo optionnel
    
    promotion_type = Column(SQLEnum(PromotionType), nullable=False)
    status = Column(SQLEnum(PromotionStatus), default=PromotionStatus.draft)
    
    # Valeurs de la promotion
    discount_value = Column(Float, nullable=True)  # Montant ou pourcentage
    max_discount = Column(Float, nullable=True)  # Limite pour pourcentages
    cashback_percentage = Column(Float, nullable=True)
    
    # Conditions d'utilisation
    min_order_value = Column(Float, nullable=True)
    max_uses_total = Column(Integer, nullable=True)
    max_uses_per_user = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    
    # Période de validité
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Ciblage
    target_user_types = Column(JSON, nullable=True)  # ["client", "courier", "business"]
    target_zones = Column(JSON, nullable=True)  # Liste d'IDs de zones
    target_user_segments = Column(JSON, nullable=True)  # Nouveaux utilisateurs, VIP, etc.
    
    # Configuration
    is_stackable = Column(Boolean, default=False)  # Cumulable avec autres promos
    is_auto_apply = Column(Boolean, default=False)  # Appliqué automatiquement
    requires_referral = Column(Boolean, default=False)
    
    # Métadonnées
    budget_allocated = Column(Float, nullable=True)
    budget_used = Column(Float, default=0.0)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    created_by = relationship("User")
    usages = relationship("PromotionUsage", back_populates="promotion")

class PromotionUsage(Base):
    __tablename__ = "promotion_usages"
    
    id = Column(Integer, primary_key=True, index=True)
    promotion_id = Column(Integer, ForeignKey("promotions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    
    discount_applied = Column(Float, nullable=False)
    cashback_earned = Column(Float, nullable=True)
    
    used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    promotion = relationship("Promotion", back_populates="usages")
    user = relationship("User")
    delivery = relationship("Delivery")

class ReferralProgram(Base):
    __tablename__ = "referral_programs"
    
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referred_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    referral_code = Column(String, nullable=False)
    referrer_bonus = Column(Float, nullable=True)
    referred_bonus = Column(Float, nullable=True)
    
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    referrer = relationship("User", foreign_keys=[referrer_id])
    referred = relationship("User", foreign_keys=[referred_id])
