from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from enum import Enum
from datetime import datetime

class PolicyType(str, Enum):
    moderation = "moderation"
    refund = "refund"
    sanction = "sanction"
    sms = "sms"
    general = "general"

class PolicyStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    draft = "draft"
    archived = "archived"

class SeverityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ActionType(str, Enum):
    warning = "warning"
    temporary_ban = "temporary_ban"
    permanent_ban = "permanent_ban"
    review = "review"

class ViolationType(str, Enum):
    late_delivery = "late_delivery"
    cancellation = "cancellation"
    bad_behavior = "bad_behavior"
    fraud = "fraud"
    safety = "safety"

class EventType(str, Enum):
    delivery_created = "delivery_created"
    delivery_accepted = "delivery_accepted"
    delivery_picked_up = "delivery_picked_up"
    delivery_completed = "delivery_completed"
    delivery_delayed = "delivery_delayed"
    payment_received = "payment_received"
    account_suspended = "account_suspended"
    critical_alert = "critical_alert"

class PriorityLevel(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    critical = "critical"

class AppliesTo(BaseModel):
    clients: bool = Field(True, description="S'applique aux clients")
    couriers: bool = Field(True, description="S'applique aux coursiers")
    businesses: bool = Field(True, description="S'applique aux entreprises")

class RequiredProofs(BaseModel):
    photo: bool = Field(False, description="Photo requise")
    receipt: bool = Field(False, description="Reçu requis")
    description: bool = Field(True, description="Description détaillée requise")

# Moderation Rule Schemas
class ModerationRuleBase(BaseModel):
    title: str = Field(..., description="Titre de la règle")
    description: Optional[str] = Field(None, description="Description de la règle")
    severity: SeverityLevel = Field(..., description="Niveau de sévérité")
    action: ActionType = Field(..., description="Action automatique")
    ban_duration: Optional[int] = Field(0, description="Durée de suspension en jours (0 = permanent)")
    active: bool = Field(True, description="Règle active")
    applies_to: AppliesTo = Field(default_factory=AppliesTo, description="S'applique à")

class ModerationRuleCreate(ModerationRuleBase):
    pass

class ModerationRuleUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Titre de la règle")
    description: Optional[str] = Field(None, description="Description de la règle")
    severity: Optional[SeverityLevel] = Field(None, description="Niveau de sévérité")
    action: Optional[ActionType] = Field(None, description="Action automatique")
    ban_duration: Optional[int] = Field(None, description="Durée de suspension en jours (0 = permanent)")
    active: Optional[bool] = Field(None, description="Règle active")
    applies_to: Optional[AppliesTo] = Field(None, description="S'applique à")

class ModerationRuleResponse(ModerationRuleBase):
    id: int = Field(..., description="ID de la règle")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    created_by_id: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by_id: Optional[int] = Field(None, description="ID de l'utilisateur modificateur")

    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# Refund Criteria Schemas
class RefundCriteriaBase(BaseModel):
    title: str = Field(..., description="Titre du critère")
    description: Optional[str] = Field(None, description="Description du critère")
    refund_percentage: float = Field(..., description="Pourcentage de remboursement")
    max_claim_time: int = Field(..., description="Délai maximum de réclamation (heures)")
    auto_approve: bool = Field(False, description="Approbation automatique")
    active: bool = Field(True, description="Critère actif")
    required_proofs: RequiredProofs = Field(default_factory=RequiredProofs, description="Preuves requises")

class RefundCriteriaCreate(RefundCriteriaBase):
    pass

class RefundCriteriaUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Titre du critère")
    description: Optional[str] = Field(None, description="Description du critère")
    refund_percentage: Optional[float] = Field(None, description="Pourcentage de remboursement")
    max_claim_time: Optional[int] = Field(None, description="Délai maximum de réclamation (heures)")
    auto_approve: Optional[bool] = Field(None, description="Approbation automatique")
    active: Optional[bool] = Field(None, description="Critère actif")
    required_proofs: Optional[RequiredProofs] = Field(None, description="Preuves requises")

class RefundCriteriaResponse(RefundCriteriaBase):
    id: int = Field(..., description="ID du critère")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    created_by_id: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by_id: Optional[int] = Field(None, description="ID de l'utilisateur modificateur")

    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# Sanction Parameter Schemas
class SanctionParameterBase(BaseModel):
    title: str = Field(..., description="Titre du paramètre")
    description: Optional[str] = Field(None, description="Description du paramètre")
    violation_type: ViolationType = Field(..., description="Type d'infraction")
    warning_threshold: int = Field(..., description="Seuil d'avertissement")
    suspension_threshold: int = Field(..., description="Seuil de suspension")
    suspension_duration: int = Field(..., description="Durée de suspension (jours)")
    expiration_period: int = Field(..., description="Période d'expiration (jours)")
    active: bool = Field(True, description="Paramètre actif")
    applies_to: AppliesTo = Field(default_factory=AppliesTo, description="S'applique à")

class SanctionParameterCreate(SanctionParameterBase):
    pass

class SanctionParameterUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Titre du paramètre")
    description: Optional[str] = Field(None, description="Description du paramètre")
    violation_type: Optional[ViolationType] = Field(None, description="Type d'infraction")
    warning_threshold: Optional[int] = Field(None, description="Seuil d'avertissement")
    suspension_threshold: Optional[int] = Field(None, description="Seuil de suspension")
    suspension_duration: Optional[int] = Field(None, description="Durée de suspension (jours)")
    expiration_period: Optional[int] = Field(None, description="Période d'expiration (jours)")
    active: Optional[bool] = Field(None, description="Paramètre actif")
    applies_to: Optional[AppliesTo] = Field(None, description="S'applique à")

class SanctionParameterResponse(SanctionParameterBase):
    id: int = Field(..., description="ID du paramètre")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    created_by_id: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by_id: Optional[int] = Field(None, description="ID de l'utilisateur modificateur")

    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# SMS Template Schemas
class SmsTemplateBase(BaseModel):
    name: str = Field(..., description="Nom du modèle")
    event_type: EventType = Field(..., description="Type d'événement")
    content: str = Field(..., description="Contenu du message")
    active: bool = Field(True, description="Modèle actif")
    priority: PriorityLevel = Field(PriorityLevel.normal, description="Priorité du message")
    applies_to: AppliesTo = Field(default_factory=AppliesTo, description="S'applique à")

class SmsTemplateCreate(SmsTemplateBase):
    pass

class SmsTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Nom du modèle")
    event_type: Optional[EventType] = Field(None, description="Type d'événement")
    content: Optional[str] = Field(None, description="Contenu du message")
    active: Optional[bool] = Field(None, description="Modèle actif")
    priority: Optional[PriorityLevel] = Field(None, description="Priorité du message")
    applies_to: Optional[AppliesTo] = Field(None, description="S'applique à")

class SmsTemplateResponse(SmsTemplateBase):
    id: int = Field(..., description="ID du modèle")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    created_by_id: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by_id: Optional[int] = Field(None, description="ID de l'utilisateur modificateur")

    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# Policy Schemas
class PolicyBase(BaseModel):
    name: str = Field(..., description="Nom de la politique")
    description: Optional[str] = Field(None, description="Description de la politique")
    type: PolicyType = Field(..., description="Type de politique")
    status: PolicyStatus = Field(PolicyStatus.active, description="Statut de la politique")
    config: Dict[str, Any] = Field({}, description="Configuration de la politique")

class PolicyCreate(PolicyBase):
    pass

class PolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Nom de la politique")
    description: Optional[str] = Field(None, description="Description de la politique")
    status: Optional[PolicyStatus] = Field(None, description="Statut de la politique")
    config: Optional[Dict[str, Any]] = Field(None, description="Configuration de la politique")
    change_reason: Optional[str] = Field(None, description="Raison du changement")

class PolicyResponse(PolicyBase):
    id: int = Field(..., description="ID de la politique")
    version: int = Field(..., description="Version de la politique")
    created_at: datetime = Field(..., description="Date de création")
    updated_at: Optional[datetime] = Field(None, description="Date de mise à jour")
    created_by_id: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by_id: Optional[int] = Field(None, description="ID de l'utilisateur modificateur")

    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

class PolicyHistoryResponse(BaseModel):
    id: int = Field(..., description="ID de l'historique")
    policy_id: int = Field(..., description="ID de la politique")
    version: int = Field(..., description="Version de la politique")
    config: Dict[str, Any] = Field(..., description="Configuration de la politique")
    status: PolicyStatus = Field(..., description="Statut de la politique")
    changed_at: datetime = Field(..., description="Date du changement")
    changed_by_id: Optional[int] = Field(None, description="ID de l'utilisateur ayant effectué le changement")
    change_reason: Optional[str] = Field(None, description="Raison du changement")

    class Config:
        from_attributes = True

# Combined Schemas for API responses
class AllPoliciesResponse(BaseModel):
    moderation_rules: List[ModerationRuleResponse] = Field([], description="Règles de modération")
    refund_criteria: List[RefundCriteriaResponse] = Field([], description="Critères de remboursement")
    sanction_parameters: List[SanctionParameterResponse] = Field([], description="Paramètres de sanction")
    sms_templates: List[SmsTemplateResponse] = Field([], description="Modèles SMS")
    sms_settings: Dict[str, Any] = Field({}, description="Paramètres SMS")

class SmsTestRequest(BaseModel):
    template_id: Optional[int] = Field(None, description="ID du modèle à utiliser")
    phone_number: str = Field(..., description="Numéro de téléphone du destinataire")
    variables: Dict[str, Any] = Field({}, description="Variables à remplacer dans le modèle")
    message: Optional[str] = Field(None, description="Message personnalisé (si pas de modèle)")
