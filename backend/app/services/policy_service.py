from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import logging

from ..models.policy import (
    Policy, PolicyHistory, PolicyType, PolicyStatus,
    ModerationRule, RefundCriteria, SanctionParameter, SmsTemplate
)
from ..models.user import User, UserRole
from ..schemas.policy import (
    PolicyCreate, PolicyUpdate, ModerationRuleCreate, ModerationRuleUpdate,
    RefundCriteriaCreate, RefundCriteriaUpdate, SanctionParameterCreate,
    SanctionParameterUpdate, SmsTemplateCreate, SmsTemplateUpdate
)
from ..services.notification import NotificationService

logger = logging.getLogger(__name__)

class PolicyService:
    """
    Service pour la gestion des politiques de l'application.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
    
    # Méthodes pour les politiques générales
    
    def get_policy(self, policy_id: int) -> Optional[Policy]:
        """
        Récupérer une politique par son ID.
        """
        return self.db.query(Policy).filter(Policy.id == policy_id).first()
    
    def get_policies_by_type(self, policy_type: PolicyType) -> List[Policy]:
        """
        Récupérer toutes les politiques d'un type spécifique.
        """
        return self.db.query(Policy).filter(Policy.type == policy_type).all()
    
    def create_policy(self, policy_data: PolicyCreate, user_id: int) -> Policy:
        """
        Créer une nouvelle politique.
        """
        policy = Policy(
            name=policy_data.name,
            description=policy_data.description,
            type=policy_data.type,
            status=policy_data.status,
            config=policy_data.config,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        self.db.add(policy)
        self.db.commit()
        self.db.refresh(policy)
        
        # Créer l'historique initial
        self._create_policy_history(
            policy.id, 
            policy.version, 
            policy.config, 
            policy.status, 
            user_id, 
            "Création initiale"
        )
        
        return policy
    
    def update_policy(self, policy_id: int, policy_data: PolicyUpdate, user_id: int) -> Optional[Policy]:
        """
        Mettre à jour une politique existante.
        """
        policy = self.get_policy(policy_id)
        if not policy:
            return None
        
        # Mettre à jour les champs modifiables
        if policy_data.name is not None:
            policy.name = policy_data.name
        
        if policy_data.description is not None:
            policy.description = policy_data.description
        
        if policy_data.status is not None:
            policy.status = policy_data.status
        
        if policy_data.config is not None:
            # Incrémenter la version
            policy.version += 1
            policy.config = policy_data.config
        
        policy.updated_by_id = user_id
        
        self.db.commit()
        self.db.refresh(policy)
        
        # Créer une entrée dans l'historique
        self._create_policy_history(
            policy.id, 
            policy.version, 
            policy.config, 
            policy.status, 
            user_id, 
            policy_data.change_reason
        )
        
        return policy
    
    def delete_policy(self, policy_id: int) -> bool:
        """
        Supprimer une politique.
        """
        policy = self.get_policy(policy_id)
        if not policy:
            return False
        
        self.db.delete(policy)
        self.db.commit()
        
        return True
    
    def get_policy_history(self, policy_id: int) -> List[PolicyHistory]:
        """
        Récupérer l'historique d'une politique.
        """
        return self.db.query(PolicyHistory).filter(PolicyHistory.policy_id == policy_id).order_by(PolicyHistory.version.desc()).all()
    
    def _create_policy_history(
        self, 
        policy_id: int, 
        version: int, 
        config: Dict[str, Any], 
        status: PolicyStatus, 
        user_id: int, 
        change_reason: Optional[str] = None
    ) -> PolicyHistory:
        """
        Créer une entrée dans l'historique des politiques.
        """
        history = PolicyHistory(
            policy_id=policy_id,
            version=version,
            config=config,
            status=status,
            changed_by_id=user_id,
            change_reason=change_reason
        )
        
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        
        return history
    
    # Méthodes pour les règles de modération
    
    def get_moderation_rule(self, rule_id: int) -> Optional[ModerationRule]:
        """
        Récupérer une règle de modération par son ID.
        """
        return self.db.query(ModerationRule).filter(ModerationRule.id == rule_id).first()
    
    def get_all_moderation_rules(self) -> List[ModerationRule]:
        """
        Récupérer toutes les règles de modération.
        """
        return self.db.query(ModerationRule).all()
    
    def create_moderation_rule(self, rule_data: ModerationRuleCreate, user_id: int) -> ModerationRule:
        """
        Créer une nouvelle règle de modération.
        """
        rule = ModerationRule(
            title=rule_data.title,
            description=rule_data.description,
            severity=rule_data.severity,
            action=rule_data.action,
            ban_duration=rule_data.ban_duration,
            active=rule_data.active,
            applies_to_clients=rule_data.applies_to.clients,
            applies_to_couriers=rule_data.applies_to.couriers,
            applies_to_businesses=rule_data.applies_to.businesses,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Nouvelle règle de modération",
            f"Une nouvelle règle de modération a été créée: {rule.title}"
        )
        
        return rule
    
    def update_moderation_rule(self, rule_id: int, rule_data: ModerationRuleUpdate, user_id: int) -> Optional[ModerationRule]:
        """
        Mettre à jour une règle de modération existante.
        """
        rule = self.get_moderation_rule(rule_id)
        if not rule:
            return None
        
        # Mettre à jour les champs modifiables
        if rule_data.title is not None:
            rule.title = rule_data.title
        
        if rule_data.description is not None:
            rule.description = rule_data.description
        
        if rule_data.severity is not None:
            rule.severity = rule_data.severity
        
        if rule_data.action is not None:
            rule.action = rule_data.action
        
        if rule_data.ban_duration is not None:
            rule.ban_duration = rule_data.ban_duration
        
        if rule_data.active is not None:
            rule.active = rule_data.active
        
        if rule_data.applies_to is not None:
            rule.applies_to_clients = rule_data.applies_to.clients
            rule.applies_to_couriers = rule_data.applies_to.couriers
            rule.applies_to_businesses = rule_data.applies_to.businesses
        
        rule.updated_by_id = user_id
        
        self.db.commit()
        self.db.refresh(rule)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Règle de modération mise à jour",
            f"La règle de modération '{rule.title}' a été mise à jour"
        )
        
        return rule
    
    def delete_moderation_rule(self, rule_id: int) -> bool:
        """
        Supprimer une règle de modération.
        """
        rule = self.get_moderation_rule(rule_id)
        if not rule:
            return False
        
        rule_title = rule.title
        
        self.db.delete(rule)
        self.db.commit()
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Règle de modération supprimée",
            f"La règle de modération '{rule_title}' a été supprimée"
        )
        
        return True
    
    # Méthodes pour les critères de remboursement
    
    def get_refund_criteria(self, criteria_id: int) -> Optional[RefundCriteria]:
        """
        Récupérer un critère de remboursement par son ID.
        """
        return self.db.query(RefundCriteria).filter(RefundCriteria.id == criteria_id).first()
    
    def get_all_refund_criteria(self) -> List[RefundCriteria]:
        """
        Récupérer tous les critères de remboursement.
        """
        return self.db.query(RefundCriteria).all()
    
    def create_refund_criteria(self, criteria_data: RefundCriteriaCreate, user_id: int) -> RefundCriteria:
        """
        Créer un nouveau critère de remboursement.
        """
        criteria = RefundCriteria(
            title=criteria_data.title,
            description=criteria_data.description,
            refund_percentage=criteria_data.refund_percentage,
            max_claim_time=criteria_data.max_claim_time,
            auto_approve=criteria_data.auto_approve,
            active=criteria_data.active,
            requires_photo=criteria_data.required_proofs.photo,
            requires_receipt=criteria_data.required_proofs.receipt,
            requires_description=criteria_data.required_proofs.description,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        self.db.add(criteria)
        self.db.commit()
        self.db.refresh(criteria)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Nouveau critère de remboursement",
            f"Un nouveau critère de remboursement a été créé: {criteria.title}"
        )
        
        return criteria
    
    def update_refund_criteria(self, criteria_id: int, criteria_data: RefundCriteriaUpdate, user_id: int) -> Optional[RefundCriteria]:
        """
        Mettre à jour un critère de remboursement existant.
        """
        criteria = self.get_refund_criteria(criteria_id)
        if not criteria:
            return None
        
        # Mettre à jour les champs modifiables
        if criteria_data.title is not None:
            criteria.title = criteria_data.title
        
        if criteria_data.description is not None:
            criteria.description = criteria_data.description
        
        if criteria_data.refund_percentage is not None:
            criteria.refund_percentage = criteria_data.refund_percentage
        
        if criteria_data.max_claim_time is not None:
            criteria.max_claim_time = criteria_data.max_claim_time
        
        if criteria_data.auto_approve is not None:
            criteria.auto_approve = criteria_data.auto_approve
        
        if criteria_data.active is not None:
            criteria.active = criteria_data.active
        
        if criteria_data.required_proofs is not None:
            criteria.requires_photo = criteria_data.required_proofs.photo
            criteria.requires_receipt = criteria_data.required_proofs.receipt
            criteria.requires_description = criteria_data.required_proofs.description
        
        criteria.updated_by_id = user_id
        
        self.db.commit()
        self.db.refresh(criteria)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Critère de remboursement mis à jour",
            f"Le critère de remboursement '{criteria.title}' a été mis à jour"
        )
        
        return criteria
    
    def delete_refund_criteria(self, criteria_id: int) -> bool:
        """
        Supprimer un critère de remboursement.
        """
        criteria = self.get_refund_criteria(criteria_id)
        if not criteria:
            return False
        
        criteria_title = criteria.title
        
        self.db.delete(criteria)
        self.db.commit()
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Critère de remboursement supprimé",
            f"Le critère de remboursement '{criteria_title}' a été supprimé"
        )
        
        return True
    
    # Méthodes pour les paramètres de sanction
    
    def get_sanction_parameter(self, parameter_id: int) -> Optional[SanctionParameter]:
        """
        Récupérer un paramètre de sanction par son ID.
        """
        return self.db.query(SanctionParameter).filter(SanctionParameter.id == parameter_id).first()
    
    def get_all_sanction_parameters(self) -> List[SanctionParameter]:
        """
        Récupérer tous les paramètres de sanction.
        """
        return self.db.query(SanctionParameter).all()
    
    def create_sanction_parameter(self, parameter_data: SanctionParameterCreate, user_id: int) -> SanctionParameter:
        """
        Créer un nouveau paramètre de sanction.
        """
        parameter = SanctionParameter(
            title=parameter_data.title,
            description=parameter_data.description,
            violation_type=parameter_data.violation_type,
            warning_threshold=parameter_data.warning_threshold,
            suspension_threshold=parameter_data.suspension_threshold,
            suspension_duration=parameter_data.suspension_duration,
            expiration_period=parameter_data.expiration_period,
            active=parameter_data.active,
            applies_to_clients=parameter_data.applies_to.clients,
            applies_to_couriers=parameter_data.applies_to.couriers,
            applies_to_businesses=parameter_data.applies_to.businesses,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        self.db.add(parameter)
        self.db.commit()
        self.db.refresh(parameter)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Nouveau paramètre de sanction",
            f"Un nouveau paramètre de sanction a été créé: {parameter.title}"
        )
        
        return parameter
    
    def update_sanction_parameter(self, parameter_id: int, parameter_data: SanctionParameterUpdate, user_id: int) -> Optional[SanctionParameter]:
        """
        Mettre à jour un paramètre de sanction existant.
        """
        parameter = self.get_sanction_parameter(parameter_id)
        if not parameter:
            return None
        
        # Mettre à jour les champs modifiables
        if parameter_data.title is not None:
            parameter.title = parameter_data.title
        
        if parameter_data.description is not None:
            parameter.description = parameter_data.description
        
        if parameter_data.violation_type is not None:
            parameter.violation_type = parameter_data.violation_type
        
        if parameter_data.warning_threshold is not None:
            parameter.warning_threshold = parameter_data.warning_threshold
        
        if parameter_data.suspension_threshold is not None:
            parameter.suspension_threshold = parameter_data.suspension_threshold
        
        if parameter_data.suspension_duration is not None:
            parameter.suspension_duration = parameter_data.suspension_duration
        
        if parameter_data.expiration_period is not None:
            parameter.expiration_period = parameter_data.expiration_period
        
        if parameter_data.active is not None:
            parameter.active = parameter_data.active
        
        if parameter_data.applies_to is not None:
            parameter.applies_to_clients = parameter_data.applies_to.clients
            parameter.applies_to_couriers = parameter_data.applies_to.couriers
            parameter.applies_to_businesses = parameter_data.applies_to.businesses
        
        parameter.updated_by_id = user_id
        
        self.db.commit()
        self.db.refresh(parameter)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Paramètre de sanction mis à jour",
            f"Le paramètre de sanction '{parameter.title}' a été mis à jour"
        )
        
        return parameter
    
    def delete_sanction_parameter(self, parameter_id: int) -> bool:
        """
        Supprimer un paramètre de sanction.
        """
        parameter = self.get_sanction_parameter(parameter_id)
        if not parameter:
            return False
        
        parameter_title = parameter.title
        
        self.db.delete(parameter)
        self.db.commit()
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Paramètre de sanction supprimé",
            f"Le paramètre de sanction '{parameter_title}' a été supprimé"
        )
        
        return True
    
    # Méthodes pour les modèles SMS
    
    def get_sms_template(self, template_id: int) -> Optional[SmsTemplate]:
        """
        Récupérer un modèle SMS par son ID.
        """
        return self.db.query(SmsTemplate).filter(SmsTemplate.id == template_id).first()
    
    def get_all_sms_templates(self) -> List[SmsTemplate]:
        """
        Récupérer tous les modèles SMS.
        """
        return self.db.query(SmsTemplate).all()
    
    def create_sms_template(self, template_data: SmsTemplateCreate, user_id: int) -> SmsTemplate:
        """
        Créer un nouveau modèle SMS.
        """
        template = SmsTemplate(
            name=template_data.name,
            event_type=template_data.event_type,
            content=template_data.content,
            active=template_data.active,
            priority=template_data.priority,
            applies_to_clients=template_data.applies_to.clients,
            applies_to_couriers=template_data.applies_to.couriers,
            applies_to_businesses=template_data.applies_to.businesses,
            created_by_id=user_id,
            updated_by_id=user_id
        )
        
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Nouveau modèle SMS",
            f"Un nouveau modèle SMS a été créé: {template.name}"
        )
        
        return template
    
    def update_sms_template(self, template_id: int, template_data: SmsTemplateUpdate, user_id: int) -> Optional[SmsTemplate]:
        """
        Mettre à jour un modèle SMS existant.
        """
        template = self.get_sms_template(template_id)
        if not template:
            return None
        
        # Mettre à jour les champs modifiables
        if template_data.name is not None:
            template.name = template_data.name
        
        if template_data.event_type is not None:
            template.event_type = template_data.event_type
        
        if template_data.content is not None:
            template.content = template_data.content
        
        if template_data.active is not None:
            template.active = template_data.active
        
        if template_data.priority is not None:
            template.priority = template_data.priority
        
        if template_data.applies_to is not None:
            template.applies_to_clients = template_data.applies_to.clients
            template.applies_to_couriers = template_data.applies_to.couriers
            template.applies_to_businesses = template_data.applies_to.businesses
        
        template.updated_by_id = user_id
        
        self.db.commit()
        self.db.refresh(template)
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Modèle SMS mis à jour",
            f"Le modèle SMS '{template.name}' a été mis à jour"
        )
        
        return template
    
    def delete_sms_template(self, template_id: int) -> bool:
        """
        Supprimer un modèle SMS.
        """
        template = self.get_sms_template(template_id)
        if not template:
            return False
        
        template_name = template.name
        
        self.db.delete(template)
        self.db.commit()
        
        # Notifier les administrateurs
        self._notify_admins_policy_change(
            "Modèle SMS supprimé",
            f"Le modèle SMS '{template_name}' a été supprimé"
        )
        
        return True
    
    # Méthodes utilitaires
    
    def get_all_policies(self) -> Dict[str, Any]:
        """
        Récupérer toutes les politiques de l'application.
        """
        return {
            "moderation_rules": self.get_all_moderation_rules(),
            "refund_criteria": self.get_all_refund_criteria(),
            "sanction_parameters": self.get_all_sanction_parameters(),
            "sms_templates": self.get_all_sms_templates(),
            "sms_settings": self._get_sms_settings()
        }
    
    def _get_sms_settings(self) -> Dict[str, Any]:
        """
        Récupérer les paramètres SMS.
        """
        # Dans une implémentation réelle, ces paramètres seraient stockés en base de données
        # ou dans un fichier de configuration
        from ..core.config import settings
        
        return {
            "provider": settings.SMS_PROVIDER,
            "apiKey": settings.SMS_API_KEY,
            "senderNumber": settings.SMS_SENDER_NUMBER,
            "dailyLimit": settings.SMS_DAILY_LIMIT,
            "enabled": settings.SMS_ENABLED
        }
    
    def _notify_admins_policy_change(self, title: str, message: str) -> None:
        """
        Notifier les administrateurs d'un changement de politique.
        """
        # Récupérer tous les administrateurs
        admins = self.db.query(User).filter(User.role == UserRole.manager).all()
        
        # Envoyer une notification à chaque administrateur
        for admin in admins:
            self.notification_service.create_notification(
                user_id=admin.id,
                title=title,
                message=message,
                notification_type="system"
            )
        
        logger.info(f"Notification envoyée aux administrateurs: {title} - {message}")
