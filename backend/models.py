from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# Énumérations pour les statuts et rôles
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

class DeliveryStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    in_progress = "in_progress"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"

# Table d'association pour les enchères
bids = Table(
    "bids",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("delivery_id", Integer, ForeignKey("deliveries.id")),
    Column("courier_id", Integer, ForeignKey("users.id")),
    Column("amount", Float, nullable=False),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# Modèle utilisateur
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.active)
    commune = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    deliveries_as_client = relationship("Delivery", back_populates="client", foreign_keys="[Delivery.client_id]")
    deliveries_as_courier = relationship("Delivery", back_populates="courier", foreign_keys="[Delivery.courier_id]")
    ratings_received = relationship("Rating", back_populates="rated_user", foreign_keys="[Rating.rated_user_id]")
    ratings_given = relationship("Rating", back_populates="rater", foreign_keys="[Rating.rater_id]")
    points = relationship("CourierPoints", back_populates="courier", uselist=False)
    products = relationship("Product", back_populates="merchant")

# Modèle de livraison
class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    courier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pickup_address = Column(String, nullable=False)
    pickup_commune = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    delivery_address = Column(String, nullable=False)
    delivery_commune = Column(String, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    proposed_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=True)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    client = relationship("User", back_populates="deliveries_as_client", foreign_keys=[client_id])
    courier = relationship("User", back_populates="deliveries_as_courier", foreign_keys=[courier_id])
    ratings = relationship("Rating", back_populates="delivery")

# Modèle d'évaluation
class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    rater_id = Column(Integer, ForeignKey("users.id"))
    rated_user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, nullable=False)  # 1-5 étoiles
    comment = Column(Text, nullable=True)
    voice_comment_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    delivery = relationship("Delivery", back_populates="ratings")
    rater = relationship("User", back_populates="ratings_given", foreign_keys=[rater_id])
    rated_user = relationship("User", back_populates="ratings_received", foreign_keys=[rated_user_id])

# Modèle de points pour la gamification
class CourierPoints(Base):
    __tablename__ = "courier_points"

    id = Column(Integer, primary_key=True, index=True)
    courier_id = Column(Integer, ForeignKey("users.id"), unique=True)
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    deliveries_completed = Column(Integer, default=0)
    five_star_ratings = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    courier = relationship("User", back_populates="points")

# Modèle de commerçant pour le marché intégré
class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    business_name = Column(String, nullable=False)
    business_description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    commune = Column(String, nullable=False)
    address = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    logo_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    user = relationship("User")
    products = relationship("Product", back_populates="merchant")

# Modèle de produit pour le marché intégré
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    category = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    merchant = relationship("Merchant", back_populates="products")
