
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

from ..db.base import Base

class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    waiting_customer = "waiting_customer"
    resolved = "resolved"
    closed = "closed"

class TicketPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"
    critical = "critical"

class TicketCategory(str, Enum):
    delivery_issue = "delivery_issue"
    payment_issue = "payment_issue"
    technical_issue = "technical_issue"
    account_issue = "account_issue"
    refund_request = "refund_request"
    general_inquiry = "general_inquiry"
    complaint = "complaint"

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(TicketCategory), nullable=False)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.normal)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.open)
    
    # Métadonnées
    tags = Column(Text, nullable=True)  # JSON array of tags
    estimated_resolution_time = Column(DateTime, nullable=True)
    actual_resolution_time = Column(DateTime, nullable=True)
    customer_satisfaction_score = Column(Integer, nullable=True)  # 1-5
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Relations
    user = relationship("User", foreign_keys=[user_id], back_populates="tickets")
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
    delivery = relationship("Delivery")
    messages = relationship("TicketMessage", back_populates="ticket")
    attachments = relationship("TicketAttachment", back_populates="ticket")

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Message interne entre agents
    is_automated = Column(Boolean, default=False)  # Message automatique
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User")

class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    ticket = relationship("SupportTicket", back_populates="attachments")
    uploaded_by = relationship("User")

class SupportKnowledgeBase(Base):
    __tablename__ = "support_knowledge_base"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    tags = Column(Text, nullable=True)  # JSON array
    
    is_published = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    helpful_count = Column(Integer, default=0)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    created_by = relationship("User")
