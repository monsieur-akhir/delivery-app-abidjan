
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from decimal import Decimal

from ..db.base import Base

class InvoiceStatus(str, Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"

class InvoiceType(str, Enum):
    delivery_commission = "delivery_commission"
    subscription = "subscription"
    penalty = "penalty"
    refund = "refund"
    bonus = "bonus"

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    invoice_type = Column(SQLEnum(InvoiceType), nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.draft)
    
    # Montants
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    
    # Période de facturation
    billing_period_start = Column(DateTime, nullable=True)
    billing_period_end = Column(DateTime, nullable=True)
    
    # Dates importantes
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    paid_date = Column(DateTime, nullable=True)
    
    # Métadonnées
    notes = Column(Text, nullable=True)
    payment_terms = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Référence optionnelle à une livraison
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    invoice = relationship("Invoice", back_populates="line_items")
    delivery = relationship("Delivery")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    payment_method = Column(String, nullable=False)  # card, bank_transfer, wallet, etc.
    payment_reference = Column(String, nullable=True)  # Référence externe
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="XOF")
    
    status = Column(String, nullable=False)  # pending, completed, failed, refunded
    
    # Métadonnées du paiement
    metadata = Column(JSON, nullable=True)
    
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    invoice = relationship("Invoice", back_populates="payments")
    user = relationship("User")

class FinancialReport(Base):
    __tablename__ = "financial_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, nullable=False)  # daily, weekly, monthly, quarterly
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Métriques financières
    total_revenue = Column(Float, default=0.0)
    total_commission = Column(Float, default=0.0)
    total_refunds = Column(Float, default=0.0)
    total_penalties = Column(Float, default=0.0)
    
    # Détails par segment
    client_revenue = Column(Float, default=0.0)
    courier_earnings = Column(Float, default=0.0)
    business_revenue = Column(Float, default=0.0)
    
    # Coûts opérationnels
    platform_costs = Column(Float, default=0.0)
    marketing_costs = Column(Float, default=0.0)
    
    # Données détaillées (JSON)
    detailed_breakdown = Column(JSON, nullable=True)
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relations
    generated_by = relationship("User")
