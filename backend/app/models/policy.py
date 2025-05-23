from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from typing import Dict, Any, List, Optional

from ..db.base import Base

class PolicyType(str, enum.Enum):
    moderation = "moderation"
    refund = "refund"
    sanction = "sanction"
    sms = "sms"
    general = "general"

class PolicyStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    draft = "draft"
    archived = "archived"

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(PolicyType), nullable=False)
    status = Column(Enum(PolicyStatus), default=PolicyStatus.active)
    config = Column(JSON, nullable=False, default={})
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    updated_by_id = Column(Integer, ForeignKey("users.id"))

    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    history = relationship("PolicyHistory", back_populates="policy", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "status": self.status,
            "config": self.config,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id
        }

class PolicyHistory(Base):
    __tablename__ = "policy_history"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    version = Column(Integer, nullable=False)
    config = Column(JSON, nullable=False)
    status = Column(Enum(PolicyStatus), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    change_reason = Column(Text, nullable=True)

    # Relations
    policy = relationship("Policy", back_populates="history")
    changed_by = relationship("User")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "policy_id": self.policy_id,
            "version": self.version,
            "config": self.config,
            "status": self.status,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
            "changed_by_id": self.changed_by_id,
            "change_reason": self.change_reason
        }

class ModerationRule(Base):
    __tablename__ = "moderation_rules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), nullable=False)  # low, medium, high, critical
    action = Column(String(50), nullable=False)  # warning, temporary_ban, permanent_ban, review
    ban_duration = Column(Integer, default=0)  # Durée en jours, 0 = permanent
    active = Column(Boolean, default=True)
    applies_to_clients = Column(Boolean, default=True)
    applies_to_couriers = Column(Boolean, default=True)
    applies_to_businesses = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    updated_by_id = Column(Integer, ForeignKey("users.id"))

    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "action": self.action,
            "ban_duration": self.ban_duration,
            "active": self.active,
            "applies_to": {
                "clients": self.applies_to_clients,
                "couriers": self.applies_to_couriers,
                "businesses": self.applies_to_businesses
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id
        }

class RefundCriteria(Base):
    __tablename__ = "refund_criteria"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    refund_percentage = Column(Float, nullable=False)
    max_claim_time = Column(Integer, nullable=False)  # Heures
    auto_approve = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    requires_photo = Column(Boolean, default=False)
    requires_receipt = Column(Boolean, default=False)
    requires_description = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    updated_by_id = Column(Integer, ForeignKey("users.id"))

    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "refund_percentage": self.refund_percentage,
            "max_claim_time": self.max_claim_time,
            "auto_approve": self.auto_approve,
            "active": self.active,
            "required_proofs": {
                "photo": self.requires_photo,
                "receipt": self.requires_receipt,
                "description": self.requires_description
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id
        }

class SanctionParameter(Base):
    __tablename__ = "sanction_parameters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    violation_type = Column(String(50), nullable=False)
    warning_threshold = Column(Integer, nullable=False)
    suspension_threshold = Column(Integer, nullable=False)
    suspension_duration = Column(Integer, nullable=False)  # Jours
    expiration_period = Column(Integer, nullable=False)  # Jours
    active = Column(Boolean, default=True)
    applies_to_clients = Column(Boolean, default=False)
    applies_to_couriers = Column(Boolean, default=True)
    applies_to_businesses = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    updated_by_id = Column(Integer, ForeignKey("users.id"))

    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "violation_type": self.violation_type,
            "warning_threshold": self.warning_threshold,
            "suspension_threshold": self.suspension_threshold,
            "suspension_duration": self.suspension_duration,
            "expiration_period": self.expiration_period,
            "active": self.active,
            "applies_to": {
                "clients": self.applies_to_clients,
                "couriers": self.applies_to_couriers,
                "businesses": self.applies_to_businesses
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id
        }

class SmsTemplate(Base):
    __tablename__ = "sms_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    active = Column(Boolean, default=True)
    priority = Column(String(20), default="normal")  # normal, high, critical
    applies_to_clients = Column(Boolean, default=True)
    applies_to_couriers = Column(Boolean, default=False)
    applies_to_businesses = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    updated_by_id = Column(Integer, ForeignKey("users.id"))

    # Relations
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "event_type": self.event_type,
            "content": self.content,
            "active": self.active,
            "priority": self.priority,
            "applies_to": {
                "clients": self.applies_to_clients,
                "couriers": self.applies_to_couriers,
                "businesses": self.applies_to_businesses
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by_id": self.created_by_id,
            "updated_by_id": self.updated_by_id
        }
