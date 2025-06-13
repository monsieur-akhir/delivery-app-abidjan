from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class RewardStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    failed = "failed"

# Schémas pour les points des coursiers
class CourierPointsBase(BaseModel):
    total_points: int = 0
    level: int = 1
    deliveries_completed: int = 0
    five_star_ratings: int = 0
    on_time_deliveries: int = 0
    express_deliveries: int = 0
    collaborative_deliveries: int = 0

class CourierPointsResponse(CourierPointsBase):
    id: int
    courier_id: int
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schémas pour les transactions de points
class PointTransactionBase(BaseModel):
    points: int
    reason: str
    delivery_id: Optional[int] = None

class PointTransactionCreate(PointTransactionBase):
    pass

class PointTransactionResponse(PointTransactionBase):
    id: int
    courier_points_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schémas pour les récompenses
class RewardBase(BaseModel):
    reward_type: str
    amount: float
    points_used: int
    phone_number: Optional[str] = None

class RewardCreate(RewardBase):
    @validator('points_used')
    def points_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Les points utilisés doivent être positifs')
        return v

class RewardResponse(RewardBase):
    id: int
    courier_points_id: int
    status: RewardStatus
    transaction_reference: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schéma pour le classement
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
