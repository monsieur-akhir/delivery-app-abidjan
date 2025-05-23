from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import UserRole
from ..schemas.user import UserResponse
from ..schemas.wallet import (
    WalletResponse, TransactionCreate, TransactionResponse,
    LoanCreate, LoanUpdate, LoanResponse
)
from ..services.wallet import (
    get_wallet, create_transaction, get_transactions,
    create_loan, get_loans, update_loan_status, repay_loan,
    get_community_wallet_stats, get_loan_by_id, get_active_loans,
    get_pending_loans, get_loan_history, add_funds_to_community_wallet
)
from ..services.notification import send_wallet_notification

router = APIRouter()

# Routes pour le portefeuille communautaire (réservées aux gestionnaires)
@router.get("/community/stats", response_model=Dict[str, Any])
async def get_community_stats(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques du portefeuille communautaire.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_community_wallet_stats(db)

@router.post("/community/funds", response_model=Dict[str, Any])
async def add_community_funds(
    amount: float,
    source: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Ajouter des fonds au portefeuille communautaire.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le montant doit être positif"
        )
    
    result = add_funds_to_community_wallet(db, amount, source, description, current_user.id)
    return result

@router.get("/community/loans/pending", response_model=List[LoanResponse])
async def get_community_pending_loans(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les demandes de prêt en attente.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_pending_loans(db)

@router.get("/community/loans/active", response_model=List[LoanResponse])
async def get_community_active_loans(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les prêts actifs.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_active_loans(db)

@router.get("/community/loans/history", response_model=List[LoanResponse])
async def get_community_loan_history(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer l'historique des prêts.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    return get_loan_history(db, status, start_date, end_date)

@router.get("/community/loans/{loan_id}", response_model=LoanResponse)
async def get_community_loan(
    loan_id: int = Path(..., title="ID du prêt"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'un prêt.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    loan = get_loan_by_id(db, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    return loan

@router.put("/community/loans/{loan_id}/approve", response_model=LoanResponse)
async def approve_community_loan(
    loan_id: int = Path(..., title="ID du prêt"),
    repayment_deadline: Optional[datetime] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Approuver une demande de prêt.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    # Si aucune date d'échéance n'est fournie, définir une date par défaut (30 jours)
    if not repayment_deadline:
        repayment_deadline = datetime.now() + timedelta(days=30)
    
    loan_update = LoanUpdate(
        status="approved",
        repayment_deadline=repayment_deadline
    )
    
    updated_loan = update_loan_status(db, loan_id, loan_update, current_user.id)
    if not updated_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    # Envoyer une notification à l'emprunteur
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=updated_loan.wallet.user_id,
            message=f"Votre demande de prêt de {updated_loan.amount} FCFA a été approuvée"
        )
    
    return updated_loan

@router.put("/community/loans/{loan_id}/reject", response_model=LoanResponse)
async def reject_community_loan(
    reason: str,
    loan_id: int = Path(..., title="ID du prêt"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Rejeter une demande de prêt.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    loan_update = LoanUpdate(
        status="rejected",
        rejection_reason=reason
    )
    
    updated_loan = update_loan_status(db, loan_id, loan_update, current_user.id)
    if not updated_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    # Envoyer une notification à l'emprunteur
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=updated_loan.wallet.user_id,
            message=f"Votre demande de prêt de {updated_loan.amount} FCFA a été rejetée. Raison: {reason}"
        )
    
    return updated_loan

@router.put("/community/loans/{loan_id}/extend", response_model=LoanResponse)
async def extend_community_loan(
    extension_days: int,
    reason: str,
    loan_id: int = Path(..., title="ID du prêt"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Prolonger un prêt.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    if extension_days <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nombre de jours d'extension doit être positif"
        )
    
    loan = get_loan_by_id(db, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    if loan.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les prêts approuvés peuvent être prolongés"
        )
    
    # Calculer la nouvelle date d'échéance
    new_deadline = loan.repayment_deadline + timedelta(days=extension_days)
    
    loan_update = LoanUpdate(
        status="approved",
        repayment_deadline=new_deadline,
        extension_reason=reason
    )
    
    updated_loan = update_loan_status(db, loan_id, loan_update, current_user.id)
    
    # Envoyer une notification à l'emprunteur
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=updated_loan.wallet.user_id,
            message=f"Votre prêt de {updated_loan.amount} FCFA a été prolongé de {extension_days} jours. Nouvelle date d'échéance: {new_deadline.strftime('%d/%m/%Y')}"
        )
    
    return updated_loan

@router.put("/community/loans/{loan_id}/repay", response_model=LoanResponse)
async def mark_loan_as_repaid(
    loan_id: int = Path(..., title="ID du prêt"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Marquer un prêt comme remboursé.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    updated_loan = repay_loan(db, loan_id, current_user.id)
    if not updated_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    # Envoyer une notification à l'emprunteur
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=updated_loan.wallet.user_id,
            message=f"Votre prêt de {updated_loan.amount} FCFA a été marqué comme remboursé"
        )
    
    return updated_loan

@router.put("/community/loans/{loan_id}/write-off", response_model=LoanResponse)
async def write_off_loan(
    reason: str,
    loan_id: int = Path(..., title="ID du prêt"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Passer un prêt en perte.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    loan_update = LoanUpdate(
        status="written_off",
        write_off_reason=reason
    )
    
    updated_loan = update_loan_status(db, loan_id, loan_update, current_user.id)
    if not updated_loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    # Envoyer une notification à l'emprunteur
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=updated_loan.wallet.user_id,
            message=f"Votre prêt de {updated_loan.amount} FCFA a été passé en perte"
        )
    
    return updated_loan

@router.post("/community/loans/{loan_id}/send-reminder", status_code=status.HTTP_200_OK)
async def send_loan_reminder(
    loan_id: int = Path(..., title="ID du prêt"),
    message: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Envoyer un rappel pour un prêt.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    loan = get_loan_by_id(db, loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prêt non trouvé"
        )
    
    if loan.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les prêts approuvés peuvent recevoir des rappels"
        )
    
    # Préparer le message de rappel
    if not message:
        days_left = (loan.repayment_deadline - datetime.now()).days
        if days_left > 0:
            reminder_message = f"Rappel: Votre prêt de {loan.amount} FCFA doit être remboursé dans {days_left} jours"
        else:
            reminder_message = f"Rappel urgent: Votre prêt de {loan.amount} FCFA est en retard de remboursement"
    else:
        reminder_message = message
    
    # Envoyer la notification
    if background_tasks:
        background_tasks.add_task(
            send_wallet_notification,
            db=db,
            user_id=loan.wallet.user_id,
            message=reminder_message
        )
    
    return {"status": "success", "message": "Rappel envoyé avec succès"}

@router.get("/community/analytics", response_model=Dict[str, Any])
async def get_community_wallet_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les analyses du portefeuille communautaire.
    Seuls les gestionnaires peuvent accéder à cette route.
    """
    if current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent accéder à cette route"
        )
    
    # Si aucune date n'est fournie, utiliser les 30 derniers jours
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    
    if not end_date:
        end_date = datetime.now()
    
    # Récupérer les statistiques
    stats = get_community_wallet_stats(db)
    
    # Récupérer les prêts pour la période
    loans = get_loan_history(db, None, start_date, end_date)
    
    # Calculer les statistiques supplémentaires
    total_loans = len(loans)
    approved_loans = sum(1 for loan in loans if loan.status == "approved" or loan.status == "repaid")
    rejected_loans = sum(1 for loan in loans if loan.status == "rejected")
    repaid_loans = sum(1 for loan in loans if loan.status == "repaid")
    written_off_loans = sum(1 for loan in loans if loan.status == "written_off")
    
    repayment_rate = 0
    if approved_loans > 0:
        repayment_rate = (repaid_loans / approved_loans) * 100
    
    # Calculer les montants moyens, min et max
    loan_amounts = [loan.amount for loan in loans if loan.status != "rejected"]
    avg_loan_amount = 0
    min_loan_amount = 0
    max_loan_amount = 0
    
    if loan_amounts:
        avg_loan_amount = sum(loan_amounts) / len(loan_amounts)
        min_loan_amount = min(loan_amounts)
        max_loan_amount = max(loan_amounts)
    
    # Calculer les durées moyennes, min et max
    loan_durations = []
    for loan in loans:
        if loan.repayment_deadline and loan.approved_at:
            duration = (loan.repayment_deadline - loan.approved_at).days
            loan_durations.append(duration)
    
    avg_loan_duration = 0
    min_loan_duration = 0
    max_loan_duration = 0
    
    if loan_durations:
        avg_loan_duration = sum(loan_durations) / len(loan_durations)
        min_loan_duration = min(loan_durations)
        max_loan_duration = max(loan_durations)
    
    return {
        "total_balance": stats["totalBalance"],
        "total_loaned": stats["totalLoaned"],
        "pending_repayments": stats["pendingRepayments"],
        "active_loans": stats["activeLoans"],
        "total_loans": total_loans,
        "approved_loans": approved_loans,
        "rejected_loans": rejected_loans,
        "repaid_loans": repaid_loans,
        "written_off_loans": written_off_loans,
        "repayment_rate": repayment_rate,
        "avg_loan_amount": avg_loan_amount,
        "min_loan_amount": min_loan_amount,
        "max_loan_amount": max_loan_amount,
        "avg_loan_duration": avg_loan_duration,
        "min_loan_duration": min_loan_duration,
        "max_loan_duration": max_loan_duration,
        "period": {
            "start_date": start_date,
            "end_date": end_date
        }
    }
