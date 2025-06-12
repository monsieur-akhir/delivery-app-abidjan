
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
