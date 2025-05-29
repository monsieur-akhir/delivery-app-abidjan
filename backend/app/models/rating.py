from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

class ModerationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    rater_id = Column(Integer, ForeignKey("users.id"))
    rated_user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, nullable=False)  # 1-5 étoiles
    comment = Column(Text, nullable=True)
    voice_comment_url = Column(String, nullable=True)
    moderation_status = Column(Enum(ModerationStatus), default=ModerationStatus.pending)
    moderation_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    delivery = relationship("Delivery")
    rater = relationship("User", foreign_keys=[rater_id])
    rated_user = relationship("User", foreign_keys=[rated_user_id])
