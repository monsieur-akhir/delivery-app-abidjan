from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class ModerationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

# Schémas de base pour les évaluations
class RatingBase(BaseModel):
    delivery_id: int
    rated_user_id: int
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    voice_comment_url: Optional[str] = None

# Schéma pour la création d'une évaluation
class RatingCreate(RatingBase):
    pass

# Schéma pour la modération d'une évaluation
class RatingModeration(BaseModel):
    moderation_status: ModerationStatus
    moderation_note: Optional[str] = None

# Schéma pour la réponse d'évaluation
class RatingResponse(RatingBase):
    id: int
    rater_id: int
    moderation_status: ModerationStatus
    created_at: datetime
    
    # Informations supplémentaires
    rater: Optional[Dict[str, Any]] = None
    rated_user: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True
