from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

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

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")
    loans = relationship("Loan", back_populates="wallet")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending)
    reference = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    wallet = relationship("Wallet", back_populates="transactions")
    delivery = relationship("Delivery")

class Loan(Base):
    __tablename__ = "loans"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected, repaid
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    repayment_deadline = Column(DateTime(timezone=True), nullable=True)
    repaid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    wallet = relationship("Wallet", back_populates="loans")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
