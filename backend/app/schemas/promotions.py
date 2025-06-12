
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from ..models.promotions import PromotionType, PromotionStatus

class PromotionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    code: Optional[str] = None
    promotion_type: PromotionType
    discount_value: Optional[float] = None
    max_discount: Optional[float] = None
    cashback_percentage: Optional[float] = None
    min_order_value: Optional[float] = None
    max_uses_total: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    start_date: datetime
    end_date: datetime
    target_user_types: Optional[List[str]] = None
    target_zones: Optional[List[int]] = None
    target_user_segments: Optional[List[str]] = None
    is_stackable: bool = False
    is_auto_apply: bool = False
    requires_referral: bool = False
    budget_allocated: Optional[float] = None

class PromotionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    status: Optional[PromotionStatus] = None
    discount_value: Optional[float] = None
    max_discount: Optional[float] = None
    cashback_percentage: Optional[float] = None
    min_order_value: Optional[float] = None
    max_uses_total: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_user_types: Optional[List[str]] = None
    target_zones: Optional[List[int]] = None
    target_user_segments: Optional[List[str]] = None
    is_stackable: Optional[bool] = None
    is_auto_apply: Optional[bool] = None
    requires_referral: Optional[bool] = None
    budget_allocated: Optional[float] = None

class PromotionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    code: Optional[str]
    promotion_type: PromotionType
    status: PromotionStatus
    discount_value: Optional[float]
    max_discount: Optional[float]
    cashback_percentage: Optional[float]
    min_order_value: Optional[float]
    max_uses_total: Optional[int]
    max_uses_per_user: Optional[int]
    current_uses: int
    start_date: datetime
    end_date: datetime
    target_user_types: Optional[List[str]]
    target_zones: Optional[List[int]]
    target_user_segments: Optional[List[str]]
    is_stackable: bool
    is_auto_apply: bool
    requires_referral: bool
    budget_allocated: Optional[float]
    budget_used: float
    created_at: datetime
    updated_at: Optional[datetime]

class PromotionUsageResponse(BaseModel):
    id: int
    promotion_id: int
    user_id: int
    delivery_id: Optional[int]
    discount_applied: float
    cashback_earned: Optional[float]
    used_at: datetime

class ReferralProgramCreate(BaseModel):
    referral_code: str
    referrer_bonus: Optional[float] = None
    referred_bonus: Optional[float] = None

class ReferralProgramResponse(BaseModel):
    id: int
    referrer_id: int
    referred_id: int
    referral_code: str
    referrer_bonus: Optional[float]
    referred_bonus: Optional[float]
    is_completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
