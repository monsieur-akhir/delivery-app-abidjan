from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.kyc_document import KycDocumentType, KycDocumentStatus

class KycDocumentBase(BaseModel):
    type: KycDocumentType
    url: str
    status: Optional[KycDocumentStatus] = KycDocumentStatus.pending
    rejection_reason: Optional[str] = None

class KycDocumentCreate(KycDocumentBase):
    pass

class KycDocumentRead(KycDocumentBase):
    id: int
    user_id: int
    submitted_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True 