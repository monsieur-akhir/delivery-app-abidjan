from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime
import random

from ..db.base import Base
from app.models.user import User, BusinessProfile

class ProductCategory(str, enum.Enum):
    food = "food"
    clothing = "clothing"
    electronics = "electronics"
    household = "household"
    beauty = "beauty"
    other = "other"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("business_profiles.id"))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(Enum(ProductCategory), nullable=False)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    business = relationship("BusinessProfile", back_populates="products")
