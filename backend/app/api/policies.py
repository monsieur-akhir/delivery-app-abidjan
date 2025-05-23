from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import UserRole
from ..schemas.user import UserResponse
from ..schemas.policy import (
    PolicyCreate, PolicyUpdate, PolicyResponse, PolicyHistoryResponse,
    ModerationRuleCreate, ModerationRuleUpdate, ModerationRuleResponse,
    RefundCriteriaCreate, RefundCriteriaUpdate, RefundCriteriaResponse,
    SanctionParameterCreate, SanctionParameterUpdate, SanctionParameterResponse,
    SmsTemplateCreate, SmsTemplateUpdate, SmsTemplateResponse,
    AllPoliciesResponse, SmsTestRequest
)
from ..services.policy_service import PolicyService
from ..services.notification import send_sms_notification

router = APIRouter()

# Routes pour les politiques générales
@router.get("/", response_model=AllPoliciesResponse)
async def read_all_policies(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer toutes les politiques de l'application.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    policies = policy_service.get_all_policies()
    
    return {
        "moderation_rules": policies["moderation_rules"],
        "refund_criteria": policies["refund_criteria"],
        "sanction_parameters": policies["sanction_parameters"],
        "sms_templates": policies["sms_templates"],
        "sms_settings": policies["sms_settings"]
    }

# Routes pour les règles de modération
@router.get("/moderation-rules", response_model=List[ModerationRuleResponse])
async def read_moderation_rules(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer toutes les règles de modération.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    rules = policy_service.get_all_moderation_rules()
    
    if active is not None:
        rules = [rule for rule in rules if rule.active == active]
    
    return rules

@router.post("/moderation-rules", response_model=ModerationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_moderation_rule(
    rule: ModerationRuleCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle règle de modération.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    return policy_service.create_moderation_rule(rule, current_user.id)

@router.get("/moderation-rules/{rule_id}", response_model=ModerationRuleResponse)
async def read_moderation_rule(
    rule_id: int = Path(..., title="ID de la règle de modération"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer une règle de modération par son ID.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    rule = policy_service.get_moderation_rule(rule_id)
    
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle de modération non trouvée"
        )
    
    return rule

@router.put("/moderation-rules/{rule_id}", response_model=ModerationRuleResponse)
async def update_moderation_rule(
    rule: ModerationRuleUpdate,
    rule_id: int = Path(..., title="ID de la règle de modération"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour une règle de modération.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    updated_rule = policy_service.update_moderation_rule(rule_id, rule, current_user.id)
    
    if not updated_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle de modération non trouvée"
        )
    
    return updated_rule

@router.delete("/moderation-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_moderation_rule(
    rule_id: int = Path(..., title="ID de la règle de modération"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer une règle de modération.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    success = policy_service.delete_moderation_rule(rule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle de modération non trouvée"
        )

# Routes pour les critères de remboursement
@router.get("/refund-criteria", response_model=List[RefundCriteriaResponse])
async def read_refund_criteria(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer tous les critères de remboursement.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    criteria = policy_service.get_all_refund_criteria()
    
    if active is not None:
        criteria = [c for c in criteria if c.active == active]
    
    return criteria

@router.post("/refund-criteria", response_model=RefundCriteriaResponse, status_code=status.HTTP_201_CREATED)
async def create_refund_criteria(
    criteria: RefundCriteriaCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer un nouveau critère de remboursement.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    return policy_service.create_refund_criteria(criteria, current_user.id)

@router.get("/refund-criteria/{criteria_id}", response_model=RefundCriteriaResponse)
async def read_refund_criterion(
    criteria_id: int = Path(..., title="ID du critère de remboursement"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer un critère de remboursement par son ID.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    criteria = policy_service.get_refund_criteria(criteria_id)
    
    if not criteria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Critère de remboursement non trouvé"
        )
    
    return criteria

@router.put("/refund-criteria/{criteria_id}", response_model=RefundCriteriaResponse)
async def update_refund_criteria(
    criteria: RefundCriteriaUpdate,
    criteria_id: int = Path(..., title="ID du critère de remboursement"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour un critère de remboursement.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    updated_criteria = policy_service.update_refund_criteria(criteria_id, criteria, current_user.id)
    
    if not updated_criteria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Critère de remboursement non trouvé"
        )
    
    return updated_criteria

@router.delete("/refund-criteria/{criteria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_refund_criteria(
    criteria_id: int = Path(..., title="ID du critère de remboursement"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer un critère de remboursement.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    success = policy_service.delete_refund_criteria(criteria_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Critère de remboursement non trouvé"
        )

# Routes pour les paramètres de sanction
@router.get("/sanction-parameters", response_model=List[SanctionParameterResponse])
async def read_sanction_parameters(
    active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer tous les paramètres de sanction.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    parameters = policy_service.get_all_sanction_parameters()
    
    if active is not None:
        parameters = [p for p in parameters if p.active == active]
    
    return parameters

@router.post("/sanction-parameters", response_model=SanctionParameterResponse, status_code=status.HTTP_201_CREATED)
async def create_sanction_parameter(
    parameter: SanctionParameterCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer un nouveau paramètre de sanction.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    return policy_service.create_sanction_parameter(parameter, current_user.id)

@router.get("/sanction-parameters/{parameter_id}", response_model=SanctionParameterResponse)
async def read_sanction_parameter(
    parameter_id: int = Path(..., title="ID du paramètre de sanction"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer un paramètre de sanction par son ID.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    parameter = policy_service.get_sanction_parameter(parameter_id)
    
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de sanction non trouvé"
        )
    
    return parameter

@router.put("/sanction-parameters/{parameter_id}", response_model=SanctionParameterResponse)
async def update_sanction_parameter(
    parameter: SanctionParameterUpdate,
    parameter_id: int = Path(..., title="ID du paramètre de sanction"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour un paramètre de sanction.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    updated_parameter = policy_service.update_sanction_parameter(parameter_id, parameter, current_user.id)
    
    if not updated_parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de sanction non trouvé"
        )
    
    return updated_parameter

@router.delete("/sanction-parameters/{parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sanction_parameter(
    parameter_id: int = Path(..., title="ID du paramètre de sanction"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer un paramètre de sanction.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    success = policy_service.delete_sanction_parameter(parameter_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre de sanction non trouvé"
        )

# Routes pour les modèles SMS
@router.get("/sms-templates", response_model=List[SmsTemplateResponse])
async def read_sms_templates(
    active: Optional[bool] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer tous les modèles SMS.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    templates = policy_service.get_all_sms_templates()
    
    if active is not None:
        templates = [t for t in templates if t.active == active]
    
    if event_type is not None:
        templates = [t for t in templates if t.event_type == event_type]
    
    return templates

@router.post("/sms-templates", response_model=SmsTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_sms_template(
    template: SmsTemplateCreate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer un nouveau modèle SMS.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    return policy_service.create_sms_template(template, current_user.id)

@router.get("/sms-templates/{template_id}", response_model=SmsTemplateResponse)
async def read_sms_template(
    template_id: int = Path(..., title="ID du modèle SMS"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer un modèle SMS par son ID.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    template = policy_service.get_sms_template(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle SMS non trouvé"
        )
    
    return template

@router.put("/sms-templates/{template_id}", response_model=SmsTemplateResponse)
async def update_sms_template(
    template: SmsTemplateUpdate,
    template_id: int = Path(..., title="ID du modèle SMS"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour un modèle SMS.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    updated_template = policy_service.update_sms_template(template_id, template, current_user.id)
    
    if not updated_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle SMS non trouvé"
        )
    
    return updated_template

@router.delete("/sms-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sms_template(
    template_id: int = Path(..., title="ID du modèle SMS"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Supprimer un modèle SMS.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    policy_service = PolicyService(db)
    success = policy_service.delete_sms_template(template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle SMS non trouvé"
        )

@router.post("/sms-templates/test", status_code=status.HTTP_200_OK)
async def test_sms_template(
    test_request: SmsTestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Tester l'envoi d'un SMS avec un modèle.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    # Vérifier que le numéro de téléphone est valide
    if not test_request.phone_number or len(test_request.phone_number) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numéro de téléphone invalide"
        )
    
    # Si un ID de modèle est fourni, récupérer le modèle
    message = test_request.message
    if test_request.template_id:
        policy_service = PolicyService(db)
        template = policy_service.get_sms_template(test_request.template_id)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Modèle SMS non trouvé"
            )
        
        # Remplacer les variables dans le modèle
        message = template.content
        for key, value in test_request.variables.items():
            placeholder = f"{{{key}}}"
            message = message.replace(placeholder, str(value))
    
    # Vérifier que le message n'est pas vide
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le message ne peut pas être vide"
        )
    
    # Envoyer le SMS en arrière-plan
    background_tasks.add_task(
        send_sms_notification,
        test_request.phone_number,
        message
    )
    
    return {"status": "success", "message": "SMS en cours d'envoi"}
