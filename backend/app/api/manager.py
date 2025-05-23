from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.user import UserResponse, UserStatusUpdate, KYCUpdate
from ..services.manager import (
    get_clients, get_couriers, get_businesses,
    update_user_status, update_kyc_status,
    get_courier_performance, get_business_finances,
    get_global_stats, get_chart_data,
    get_revenues, get_expenses,
    generate_financial_report,
    update_app_config, get_app_config
)
from ..models.user import UserRole

router = APIRouter()

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
