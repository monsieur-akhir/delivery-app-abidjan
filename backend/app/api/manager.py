from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.user import UserResponse, UserStatusUpdate, KYCUpdate
from ..models.user import User, UserRole
from ..services.manager import (
    get_clients, get_couriers, get_businesses,
    update_user_status, update_kyc_status,
    get_courier_performance, get_business_finances,
    get_global_stats, get_chart_data,
    get_revenues, get_expenses,
    generate_financial_report,
    update_app_config, get_app_config
)

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    kyc_status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer la liste des utilisateurs avec filtres"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_filtered_users(db, role, status, kyc_status, search, skip, limit)

@router.post("/users", response_model=UserResponse)
async def create_user_endpoint(
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Créer un nouvel utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return create_new_user(db, user_data)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return update_user_data(db, user_id, user_data)

@router.get("/users/{user_id}/stats")
async def get_user_stats_endpoint(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques d'un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_user_statistics(db, user_id)

@router.get("/users/{user_id}/activity")
async def get_user_activity_endpoint(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'activité récente d'un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_user_activity_history(db, user_id)

@router.get("/users/{user_id}/kyc/documents")
async def get_user_kyc_documents_endpoint(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer les documents KYC d'un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_user_kyc_documents(db, user_id)

@router.get("/users/{user_id}/kyc/history")
async def get_kyc_history_endpoint(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'historique KYC d'un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_kyc_review_history(db, user_id)

@router.put("/users/{user_id}/kyc")
async def update_kyc_status_endpoint(
    user_id: int,
    kyc_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut KYC d'un utilisateur"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return update_kyc_status(db, user_id, kyc_data.get('status'), kyc_data.get('rejection_reason'))

@router.put("/kyc/documents/{document_id}")
async def update_kyc_document_endpoint(
    document_id: int,
    document_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un document KYC"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return update_kyc_document_status(db, document_id, document_data)

@router.get("/users/export")
async def export_users_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Exporter la liste des utilisateurs en CSV"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return export_users_to_csv(db)

@router.get("/stats/advanced")
async def get_advanced_stats_endpoint(
    period: str = "month",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques avancées"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_advanced_statistics(db, period)

@router.get("/stats/kyc")
async def get_kyc_stats_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques KYC"""
    if current_user.role != UserRole.manager:
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return get_kyc_statistics(db)

# Routes pour la gestion des clients
@router.get("/clients", response_model=List[UserResponse])
async def read_clients(
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des clients.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_clients(
        db,
        status=status,
        commune=commune,
        search=search,
        skip=skip,
        limit=limit
    )

# Routes pour la gestion des coursiers
@router.get("/couriers", response_model=List[UserResponse])
async def read_couriers(
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des coursiers.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_couriers(
        db,
        status=status,
        commune=commune,
        search=search,
        skip=skip,
        limit=limit
    )

@router.get("/couriers/{courier_id}/performance")
async def read_courier_performance(
    courier_id: int,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les performances d'un coursier.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_courier_performance(db, courier_id)

# Routes pour la gestion des entreprises
@router.get("/companies", response_model=List[UserResponse])
async def read_businesses(
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des entreprises.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_businesses(
        db,
        status=status,
        commune=commune,
        search=search,
        skip=skip,
        limit=limit
    )

@router.get("/companies/{company_id}/finances")
async def read_business_finances(
    company_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les finances d'une entreprise.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_business_finances(db, company_id, start_date, end_date)

# Routes pour la mise à jour des utilisateurs
@router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status_endpoint(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour le statut d'un utilisateur.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return update_user_status(db, user_id, status_update.status)

@router.put("/users/{user_id}/kyc", response_model=UserResponse)
async def update_kyc_status_endpoint(
    user_id: int,
    kyc_update: KYCUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour le statut KYC d'un utilisateur.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return update_kyc_status(db, user_id, kyc_update.kyc_status, kyc_update.kyc_rejection_reason)

# Routes pour les tableaux de bord
@router.get("/stats")
async def read_global_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    commune: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques globales.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_global_stats(db, start_date, end_date, commune)

@router.get("/stats/chart")
async def read_chart_data(
    chart_type: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    commune: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les données pour les graphiques.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_chart_data(db, chart_type, start_date, end_date, commune)

# Routes pour les finances
@router.get("/finances/revenues")
async def read_revenue_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques de revenus.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_revenues(db, start_date, end_date)

@router.get("/finances/expenses")
async def read_expense_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques de dépenses.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_expenses(db, start_date, end_date)

@router.post("/finances/reports")
async def generate_report(
    report_type: str,
    start_date: datetime,
    end_date: datetime,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Générer un rapport financier.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return generate_financial_report(db, report_type, start_date, end_date, format)

# Routes pour la configuration
@router.post("/config")
async def update_config(
    config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Mettre à jour la configuration de l'application.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return update_app_config(db, config)

@router.get("/config")
async def read_config(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la configuration de l'application.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_app_config(db)
