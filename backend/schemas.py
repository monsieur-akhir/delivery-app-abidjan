from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import enum

# Énumérations
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

# Schémas pour l'authentification
class UserBase(BaseModel):
    phone: str
    email: Optional[str] = None
    full_name: str
    role: UserRole
    commune: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(UserBase):
    id: int
    status: UserStatus
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    status: UserStatus

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone: Optional[str] = None
    role: Optional[UserRole] = None

# Schémas pour les livraisons
class DeliveryBase(BaseModel):
    pickup_address: str
    pickup_commune: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    delivery_address: str
    delivery_commune: str
    delivery_lat: Optional[float] = None
    delivery_lng: Optional[float] = None
    description: Optional[str] = None
    proposed_price: float

class DeliveryCreate(DeliveryBase):
    pass

class DeliveryResponse(DeliveryBase):
    id: int
    client_id: int
    courier_id: Optional[int] = None
    final_price: Optional[float] = None
    status: DeliveryStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Informations supplémentaires
    client: Optional[Dict[str, Any]] = None
    courier: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: DeliveryStatus

# Schémas pour les enchères
class BidCreate(BaseModel):
    amount: float

class BidResponse(BidCreate):
    id: int
    delivery_id: int
    courier_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schémas pour les évaluations
class RatingBase(BaseModel):
    delivery_id: int
    rated_user_id: int
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    voice_comment_url: Optional[str] = None

class RatingCreate(RatingBase):
    pass

class RatingResponse(RatingBase):
    id: int
    rater_id: int
    created_at: datetime
    
    # Informations supplémentaires
    rater: Optional[Dict[str, Any]] = None
    rated_user: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Schémas pour la gamification
class PointsResponse(BaseModel):
    total_points: int
    level: int
    deliveries_completed: int
    five_star_ratings: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    courier_id: int
    courier_name: str
    profile_picture: Optional[str] = None
    total_points: int
    level: int
    deliveries_completed: int
    commune: Optional[str] = None

    class Config:
        from_attributes = True

# Schémas pour le marché intégré
class MerchantBase(BaseModel):
    business_name: str
    business_description: Optional[str] = None
    category: str
    commune: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    logo_url: Optional[str] = None

class MerchantCreate(MerchantBase):
    user_id: int

class MerchantResponse(MerchantBase):
    id: int
    user_id: int
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category: str
    is_available: bool = True

class ProductCreate(ProductBase):
    merchant_id: int

class ProductResponse(ProductBase):
    id: int
    merchant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Informations supplémentaires
    merchant: Optional[MerchantResponse] = None

    class Config:
        from_attributes = True

# Schémas pour les tableaux de bord
class BusinessDashboard(BaseModel):
    total_deliveries: int
    completed_deliveries: int
    active_deliveries: int
    average_rating: float
    total_revenue: float
    recent_deliveries: List[DeliveryResponse]
    revenue_by_day: Dict[str, float]

class ManagerDashboard(BaseModel):
    total_users: Dict[str, int]
    active_deliveries: int
    completed_deliveries: int
    total_revenue: float
    revenue_by_commune: Dict[str, float]
    top_couriers: List[LeaderboardEntry]
    recent_deliveries: List[DeliveryResponse]
    delivery_stats_by_day: Dict[str, Dict[str, int]]

    class Config:
        from_attributes = True
