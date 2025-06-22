
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime

from ..db.base import Base

class RecurrenceType(str, enum.Enum):
    none = "none"  # Livraison ponctuelle
    daily = "daily"  # Quotidienne
    weekly = "weekly"  # Hebdomadaire
    monthly = "monthly"  # Mensuelle
    custom = "custom"  # Personnalisée

class ScheduledDeliveryStatus(str, enum.Enum):
    active = "active"  # Planification active
    paused = "paused"  # Mise en pause
    completed = "completed"  # Terminée
    cancelled = "cancelled"  # Annulée

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum, JSON, func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..db.base import Base

class RecurrenceType(PyEnum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"

class ScheduledDeliveryStatus(PyEnum):
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"

class ExecutionStatus(PyEnum):
    pending = "pending"
    created = "created"
    failed = "failed"
    skipped = "skipped"

class ScheduledDelivery(Base):
    __tablename__ = "scheduled_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"))
    
    # Informations de base de la livraison
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Informations de ramassage
    pickup_address = Column(String, nullable=False)
    pickup_commune = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    pickup_contact_name = Column(String, nullable=True)
    pickup_contact_phone = Column(String, nullable=True)
    pickup_instructions = Column(Text, nullable=True)

    # Informations de livraison
    delivery_address = Column(String, nullable=False)
    delivery_commune = Column(String, nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    delivery_contact_name = Column(String, nullable=True)
    delivery_contact_phone = Column(String, nullable=True)
    delivery_instructions = Column(Text, nullable=True)

    # Informations sur le colis type
    package_description = Column(Text, nullable=True)
    package_size = Column(String, nullable=True)
    package_weight = Column(Float, nullable=True)
    is_fragile = Column(Boolean, default=False)
    cargo_category = Column(String, nullable=True)
    required_vehicle_type = Column(String, nullable=True)

    # Planification
    scheduled_date = Column(DateTime(timezone=True), nullable=False)  # Date/heure de la première exécution
    recurrence_type = Column(Enum(RecurrenceType), default=RecurrenceType.none)
    recurrence_interval = Column(Integer, default=1)  # Intervalle (ex: tous les 2 jours)
    recurrence_days = Column(JSON, nullable=True)  # Jours de la semaine pour hebdomadaire [1,2,3,4,5]
    end_date = Column(DateTime(timezone=True), nullable=True)  # Date de fin de récurrence
    max_occurrences = Column(Integer, nullable=True)  # Nombre max d'occurrences

    # Configuration des notifications
    notification_advance_hours = Column(Integer, default=24)  # Heures avant notification
    auto_create_delivery = Column(Boolean, default=True)  # Créer automatiquement la livraison
    
    # Prix et conditions
    proposed_price = Column(Float, nullable=True)
    delivery_type = Column(String, default="standard")
    special_instructions = Column(Text, nullable=True)

    # Statut et suivi
    status = Column(Enum(ScheduledDeliveryStatus), default=ScheduledDeliveryStatus.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    next_execution_at = Column(DateTime(timezone=True), nullable=True)
    total_executions = Column(Integer, default=0)

    # Relations
    client = relationship("User", back_populates="scheduled_deliveries")
    executions = relationship("ScheduledDeliveryExecution", back_populates="scheduled_delivery")

class ScheduledDeliveryExecution(Base):
    __tablename__ = "scheduled_delivery_executions"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_delivery_id = Column(Integer, ForeignKey("scheduled_deliveries.id"))
    planned_date = Column(DateTime(timezone=True), nullable=False)
    executed_date = Column(DateTime(timezone=True), nullable=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.pending)
    error_message = Column(Text, nullable=True)
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    scheduled_delivery = relationship("ScheduledDelivery", back_populates="executions")
    delivery = relationship("Delivery")

class ScheduledDeliveryExecution(Base):
    __tablename__ = "scheduled_delivery_executions"

    id = Column(Integer, primary_key=True, index=True)
    scheduled_delivery_id = Column(Integer, ForeignKey("scheduled_deliveries.id"))
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=True)
    
    # Planification de cette exécution
    planned_date = Column(DateTime(timezone=True), nullable=False)
    executed_date = Column(DateTime(timezone=True), nullable=True)
    
    # Statut de l'exécution
    status = Column(String, default="pending")  # pending, created, completed, failed, skipped
    error_message = Column(Text, nullable=True)
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relations
    scheduled_delivery = relationship("ScheduledDelivery", back_populates="executions")
    delivery = relationship("Delivery")
