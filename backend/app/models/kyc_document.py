from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.base import Base
import enum

class KycDocumentType(str, enum.Enum):
    id_card = "id_card"
    driving_license = "driving_license"
    vehicle_registration = "vehicle_registration"
    insurance = "insurance"
    selfie = "selfie"

class KycDocumentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class KycDocument(Base):
    __tablename__ = "kyc_documents"
    __table_args__ = (
        UniqueConstraint('user_id', 'type', name='uq_user_document_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(KycDocumentType), nullable=False)
    url = Column(String, nullable=False)
    status = Column(Enum(KycDocumentStatus), default=KycDocumentStatus.pending)
    rejection_reason = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="kyc_documents") 