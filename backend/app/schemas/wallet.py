from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class TransactionType(str, enum.Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"
    loan = "loan"
    repayment = "repayment"
    commission = "commission"
    delivery_payment = "delivery_payment"
    reward = "reward"

class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

# Schémas pour les portefeuilles
class WalletBase(BaseModel):
    balance: float = 0.0

class WalletResponse(WalletBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Schémas pour les transactions
class TransactionBase(BaseModel):
    amount: float
    type: TransactionType
    description: Optional[str] = None
    delivery_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant doit être positif')
        return v

class TransactionResponse(TransactionBase):
    id: int
    wallet_id: int
    status: TransactionStatus
    reference: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Schémas pour les prêts
class LoanBase(BaseModel):
    amount: float
    reason: str

class LoanCreate(LoanBase):
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant du prêt doit être positif')
        return v

class LoanUpdate(BaseModel):
    status: str
    repayment_deadline: Optional[datetime] = None

class LoanResponse(LoanBase):
    id: int
    wallet_id: int
    status: str
    approved_by_id: Optional[int] = None
    repayment_deadline: Optional[datetime] = None
    repaid_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        orm_mode = True
