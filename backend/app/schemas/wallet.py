from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    payment = "payment"
    refund = "refund"
    bonus = "bonus"
    penalty = "penalty"
    add_funds = "add_funds"

class TransactionStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class PaymentMethod(str, Enum):
    mobile_money = "mobile_money"
    bank_card = "bank_card"
    bank_transfer = "bank_transfer"
    cash = "cash"
    wallet = "wallet"

# Schemas de base
class TransactionBase(BaseModel):
    amount: float
    type: TransactionType
    description: str
    payment_method: Optional[PaymentMethod] = None
    external_transaction_id: Optional[str] = None

class TransactionCreate(TransactionBase):
    user_id: Optional[int] = None
    delivery_id: Optional[int] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant doit être positif')
        return v

class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    description: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    delivery_id: Optional[int] = None
    status: TransactionStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schemas pour le portefeuille
class WalletBase(BaseModel):
    balance: float = 0.0
    pending_balance: float = 0.0

class WalletCreate(WalletBase):
    user_id: int

class WalletUpdate(BaseModel):
    balance: Optional[float] = None
    pending_balance: Optional[float] = None

class WalletResponse(WalletBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class WalletBalanceResponse(BaseModel):
    main_balance: float
    pending_balance: float
    total_spent: float
    total_refunds: float
    
    class Config:
        from_attributes = True

# Schemas pour les demandes d'ajout de fonds
class AddFundsRequest(BaseModel):
    amount: float
    payment_method: PaymentMethod
    payment_details: Optional[dict] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant doit être supérieur à 0')
        if v > 1000000:  # Limite max: 1 million FCFA
            raise ValueError('Le montant ne peut pas dépasser 1,000,000 FCFA')
        return v

class AddFundsResponse(BaseModel):
    transaction_id: int
    amount: float
    status: TransactionStatus
    payment_url: Optional[str] = None  # Pour redirection vers le fournisseur de paiement
    
    class Config:
        from_attributes = True

# Schemas pour les statistiques
class WalletStatsResponse(BaseModel):
    period: str
    current_balance: float
    pending_balance: float
    total_spent: float
    total_received: float
    transaction_count: int
    net_change: float
    
    class Config:
        from_attributes = True

class TransactionHistoryFilter(BaseModel):
    transaction_type: Optional[TransactionType] = None
    status: Optional[TransactionStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 50
    offset: int = 0
    
    @validator('limit')
    def limit_must_be_reasonable(cls, v):
        if v > 100:
            raise ValueError('La limite ne peut pas dépasser 100')
        return v

# Schemas pour les transferts (futures fonctionnalités)
class TransferRequest(BaseModel):
    recipient_id: int
    amount: float
    description: Optional[str] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant doit être positif')
        return v

class TransferResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    amount: float
    status: TransactionStatus
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoanStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    active = "active"
    completed = "completed"
    defaulted = "defaulted"

class LoanCreate(BaseModel):
    amount: float
    purpose: str
    duration_months: int
    monthly_payment: float
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Le montant doit être positif')
        if v > 500000:  # Limite max: 500,000 FCFA
            raise ValueError('Le montant ne peut pas dépasser 500,000 FCFA')
        return v
    
    @validator('duration_months')
    def duration_must_be_valid(cls, v):
        if v < 1 or v > 12:
            raise ValueError('La durée doit être entre 1 et 12 mois')
        return v
    
    @validator('monthly_payment')
    def payment_must_be_valid(cls, v, values):
        if 'amount' in values and 'duration_months' in values:
            min_payment = values['amount'] / values['duration_months']
            if v < min_payment:
                raise ValueError('Le paiement mensuel doit être au moins égal au montant total divisé par la durée')
        return v

class LoanResponse(LoanCreate):
    id: int
    user_id: int
    status: LoanStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoanUpdate(BaseModel):
    status: Optional[LoanStatus] = None
    monthly_payment: Optional[float] = None
    purpose: Optional[str] = None
    
    @validator('monthly_payment')
    def payment_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Le paiement mensuel doit être positif')
        return v
