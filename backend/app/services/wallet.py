from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from ..models.wallet import Wallet, Transaction, Loan, TransactionType, TransactionStatus
from ..models.user import User
from ..schemas.wallet import TransactionCreate, LoanCreate, LoanUpdate
from ..core.exceptions import NotFoundError, BadRequestError


# Fonctions pour les portefeuilles
def get_wallet(db: Session, user_id: int) -> Optional[Wallet]:
    """Récupérer le portefeuille d'un utilisateur"""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    
    # Créer un portefeuille s'il n'existe pas
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return wallet


def get_or_create_wallet(db: Session, user_id: int) -> Wallet:
    """Récupérer ou créer un portefeuille pour un utilisateur"""
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
    
    if not wallet:
        wallet = Wallet(user_id=user_id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return wallet


# Fonctions pour les transactions
def create_transaction(
    db: Session, 
    wallet_id: int, 
    transaction_data: TransactionCreate
) -> Transaction:
    """Créer une nouvelle transaction"""
    
    # Générer une référence unique
    reference = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    transaction = Transaction(
        wallet_id=wallet_id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        status=TransactionStatus.pending,
        reference=reference,
        description=transaction_data.description,
        delivery_id=transaction_data.delivery_id
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return transaction


def get_transactions(
    db: Session, 
    wallet_id: int,
    transaction_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Transaction]:
    """Récupérer les transactions d'un portefeuille"""
    
    query = db.query(Transaction).filter(Transaction.wallet_id == wallet_id)
    
    if transaction_type:
        query = query.filter(Transaction.type == transaction_type)
    
    if status:
        query = query.filter(Transaction.status == status)
    
    return query.order_by(desc(Transaction.created_at)).offset(skip).limit(limit).all()


# Fonctions pour les prêts
def create_loan(db: Session, user_id: int, loan_data: LoanCreate) -> Loan:
    """Créer une demande de prêt"""
    
    # Récupérer ou créer le portefeuille de l'utilisateur
    wallet = get_or_create_wallet(db, user_id)
    
    # Vérifier s'il n'y a pas déjà un prêt actif
    active_loan = db.query(Loan).filter(
        and_(
            Loan.wallet_id == wallet.id,
            Loan.status.in_(["pending", "approved"])
        )
    ).first()
    
    if active_loan:
        raise BadRequestError("Vous avez déjà une demande de prêt en cours")
    
    loan = Loan(
        wallet_id=wallet.id,
        amount=loan_data.amount,
        reason=loan_data.reason,
        status="pending"
    )
    
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    return loan


def get_loans(
    db: Session,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Loan]:
    """Récupérer la liste des prêts"""
    
    query = db.query(Loan)
    
    if status:
        query = query.filter(Loan.status == status)
    
    return query.order_by(desc(Loan.created_at)).offset(skip).limit(limit).all()


def get_loan_by_id(db: Session, loan_id: int) -> Optional[Loan]:
    """Récupérer un prêt par son ID"""
    return db.query(Loan).filter(Loan.id == loan_id).first()


def update_loan_status(
    db: Session, 
    loan_id: int, 
    loan_update: LoanUpdate, 
    approved_by_id: int
) -> Optional[Loan]:
    """Mettre à jour le statut d'un prêt"""
    
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return None
    
    loan.status = loan_update.status
    
    if loan_update.status == "approved":
        loan.approved_by_id = approved_by_id
        loan.repayment_deadline = loan_update.repayment_deadline
    elif loan_update.status == "repaid":
        loan.repaid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(loan)
    
    return loan


def repay_loan(db: Session, loan_id: int, repaid_by_id: int) -> Optional[Loan]:
    """Marquer un prêt comme remboursé"""
    
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return None
    
    if loan.status != "approved":
        raise BadRequestError("Seuls les prêts approuvés peuvent être remboursés")
    
    # Mettre à jour le statut du prêt
    loan.status = "repaid"
    loan.repaid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(loan)
    
    return loan


def get_pending_loans(db: Session) -> List[Loan]:
    """Récupérer les demandes de prêt en attente"""
    return db.query(Loan).filter(Loan.status == "pending").order_by(desc(Loan.created_at)).all()


def get_active_loans(db: Session) -> List[Loan]:
    """Récupérer les prêts actifs (approuvés mais non remboursés)"""
    return db.query(Loan).filter(Loan.status == "approved").order_by(desc(Loan.created_at)).all()


def get_loan_history(
    db: Session,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Loan]:
    """Récupérer l'historique des prêts avec filtres"""
    
    query = db.query(Loan)
    
    if status:
        query = query.filter(Loan.status == status)
    
    if start_date:
        query = query.filter(Loan.created_at >= start_date)
    
    if end_date:
        query = query.filter(Loan.created_at <= end_date)
    
    return query.order_by(desc(Loan.created_at)).all()


# Fonctions pour le portefeuille communautaire
def get_community_wallet_stats(db: Session) -> Dict[str, Any]:
    """Récupérer les statistiques du portefeuille communautaire"""
    
    # Calculer le solde total de tous les portefeuilles
    total_balance = db.query(func.sum(Wallet.balance)).scalar() or 0.0
    
    # Statistiques des prêts
    total_loans = db.query(Loan).count()
    pending_loans = db.query(Loan).filter(Loan.status == "pending").count()
    active_loans = db.query(Loan).filter(Loan.status == "approved").count()
    repaid_loans = db.query(Loan).filter(Loan.status == "repaid").count()
    
    # Montant total prêté
    total_loaned = db.query(func.sum(Loan.amount)).filter(
        Loan.status.in_(["approved", "repaid"])
    ).scalar() or 0.0
    
    # Montant en attente de remboursement
    pending_repayments = db.query(func.sum(Loan.amount)).filter(
        Loan.status == "approved"
    ).scalar() or 0.0
    
    return {
        "totalBalance": total_balance,
        "totalLoaned": total_loaned,
        "pendingRepayments": pending_repayments,
        "activeLoans": active_loans,
        "pendingLoans": pending_loans,
        "repaidLoans": repaid_loans,
        "totalLoans": total_loans,
        "repaymentRate": (repaid_loans / max(total_loans, 1)) * 100
    }


def add_funds_to_community_wallet(
    db: Session,
    amount: float,
    source: str,
    description: Optional[str],
    added_by_id: int
) -> Dict[str, Any]:
    """Ajouter des fonds au portefeuille communautaire"""
    
    # Pour le portefeuille communautaire, on peut créer un portefeuille système
    community_wallet = get_or_create_wallet(db, user_id=1)  # Portefeuille système
    
    # Créer une transaction de dépôt
    transaction_data = TransactionCreate(
        amount=amount,
        type=TransactionType.deposit,
        description=f"Ajout de fonds - Source: {source}. {description or ''}"
    )
    
    transaction = create_transaction(db, community_wallet.id, transaction_data)
    
    return {
        "status": "success",
        "message": f"Fonds de {amount} FCFA ajoutés avec succès",
        "transaction_id": transaction.id,
        "new_balance": community_wallet.balance
    }
    
    loan = Loan(
        wallet_id=wallet.id,
        amount=loan_data.amount,
        reason=loan_data.reason,
        status="pending"
    )
    
    db.add(loan)
    db.commit()
    db.refresh(loan)
    
    return loan


def get_loans(
    db: Session,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Loan]:
    """Récupérer la liste des prêts"""
    
    query = db.query(Loan)
    
    if status:
        query = query.filter(Loan.status == status)
    
    return query.order_by(desc(Loan.created_at)).offset(skip).limit(limit).all()


def get_user_loans(
    db: Session,
    user_id: int,
    status: Optional[str] = None
) -> List[Loan]:
    """Récupérer les prêts d'un utilisateur"""
    
    wallet = get_wallet(db, user_id)
    if not wallet:
        return []
    
    query = db.query(Loan).filter(Loan.wallet_id == wallet.id)
    
    if status:
        query = query.filter(Loan.status == status)
    
    return query.order_by(desc(Loan.created_at)).all()


def get_loan_by_id(db: Session, loan_id: int) -> Optional[Loan]:
    """Récupérer un prêt par son ID"""
    return db.query(Loan).filter(Loan.id == loan_id).first()


def update_loan_status(
    db: Session, 
    loan_id: int, 
    loan_update: LoanUpdate, 
    approved_by_id: int
) -> Optional[Loan]:
    """Mettre à jour le statut d'un prêt"""
    
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return None
    
    loan.status = loan_update.status
    
    if loan_update.status == "approved":
        loan.approved_by_id = approved_by_id
        loan.repayment_deadline = loan_update.repayment_deadline
        
        # Créditer le montant au portefeuille de l'utilisateur
        wallet = db.query(Wallet).filter(Wallet.id == loan.wallet_id).first()
        if wallet:
            wallet.balance += loan.amount
            wallet.updated_at = datetime.utcnow()
            
            # Créer une transaction de prêt
            transaction = Transaction(
                wallet_id=wallet.id,
                amount=loan.amount,
                type=TransactionType.loan,
                status=TransactionStatus.completed,
                reference=f"LOAN-{loan.id}",
                description=f"Prêt approuvé: {loan.reason}",
                completed_at=datetime.utcnow()            )
            db.add(transaction)
    
    elif loan_update.status == "repaid":
        loan.repaid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(loan)
    
    return loan


def repay_loan(db: Session, loan_id: int, repaid_by_id: int) -> Optional[Loan]:
    """Marquer un prêt comme remboursé"""
    
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return None
    if loan.status != "approved":
        raise BadRequestError("Seuls les prêts approuvés peuvent être remboursés")
    
    # Vérifier que l'utilisateur a suffisamment de fonds
    wallet = db.query(Wallet).filter(Wallet.id == loan.wallet_id).first()
    if not wallet or wallet.balance < loan.amount:
        raise BadRequestError("Solde insuffisant pour rembourser le prêt")
    
    # Débiter le montant du portefeuille
    wallet.balance -= loan.amount
    wallet.updated_at = datetime.utcnow()
    
    # Créer une transaction de remboursement
    transaction = Transaction(
        wallet_id=wallet.id,
        amount=loan.amount,
        type=TransactionType.repayment,
        status=TransactionStatus.completed,
        reference=f"REPAY-{loan.id}",
        description=f"Remboursement du prêt: {loan.reason}",
        completed_at=datetime.utcnow()
    )
    db.add(transaction)
    
    # Mettre à jour le statut du prêt
    loan.status = "repaid"
    loan.repaid_at = datetime.utcnow()
    
    db.commit()
    db.refresh(loan)
    
    return loan


def get_pending_loans(db: Session) -> List[Loan]:
    """Récupérer les demandes de prêt en attente"""
    return db.query(Loan).filter(Loan.status == "pending").order_by(desc(Loan.created_at)).all()


def get_active_loans(db: Session) -> List[Loan]:
    """Récupérer les prêts actifs (approuvés mais non remboursés)"""
    return db.query(Loan).filter(Loan.status == "approved").order_by(desc(Loan.created_at)).all()


def get_loan_history(
    db: Session,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Loan]:
    """Récupérer l'historique des prêts avec filtres"""
    
    query = db.query(Loan)
    
    if status:
        query = query.filter(Loan.status == status)
    
    if start_date:
        query = query.filter(Loan.created_at >= start_date)
    
    if end_date:
        query = query.filter(Loan.created_at <= end_date)
    
    return query.order_by(desc(Loan.created_at)).all()


# Fonctions pour le portefeuille communautaire
def get_community_wallet_stats(db: Session) -> Dict[str, Any]:
    """Récupérer les statistiques du portefeuille communautaire"""
    
    # Calculer le solde total de tous les portefeuilles
    total_balance = db.query(func.sum(Wallet.balance)).scalar() or 0.0
    
    # Statistiques des prêts
    total_loans = db.query(Loan).count()
    pending_loans = db.query(Loan).filter(Loan.status == "pending").count()
    active_loans = db.query(Loan).filter(Loan.status == "approved").count()
    repaid_loans = db.query(Loan).filter(Loan.status == "repaid").count()
    
    # Montant total prêté
    total_loaned = db.query(func.sum(Loan.amount)).filter(
        Loan.status.in_(["approved", "repaid"])
    ).scalar() or 0.0
    
    # Montant en attente de remboursement
    pending_repayments = db.query(func.sum(Loan.amount)).filter(
        Loan.status == "approved"
    ).scalar() or 0.0
    
    # Statistiques des transactions
    total_transactions = db.query(Transaction).count()
    completed_transactions = db.query(Transaction).filter(
        Transaction.status == "completed"
    ).count()
    
    # Volume total des transactions
    total_transaction_volume = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "completed"
    ).scalar() or 0.0
    
    return {
        "totalBalance": total_balance,
        "totalLoaned": total_loaned,
        "pendingRepayments": pending_repayments,
        "activeLoans": active_loans,
        "pendingLoans": pending_loans,
        "repaidLoans": repaid_loans,
        "totalLoans": total_loans,
        "totalTransactions": total_transactions,
        "completedTransactions": completed_transactions,
        "totalTransactionVolume": total_transaction_volume,
        "repaymentRate": (repaid_loans / max(total_loans, 1)) * 100
    }


def add_funds_to_community_wallet(
    db: Session,
    amount: float,
    source: str,
    description: Optional[str],
    added_by_id: int
) -> Dict[str, Any]:
    """Ajouter des fonds au portefeuille communautaire"""
    
    # Pour le portefeuille communautaire, on peut créer un portefeuille système
    # ou utiliser un portefeuille dédié (par exemple user_id = 1 pour le système)
    community_wallet = get_or_create_wallet(db, user_id=1)  # Portefeuille système
    
    # Créer une transaction de dépôt
    transaction_data = TransactionCreate(
        amount=amount,
        type=TransactionType.deposit,
        description=f"Ajout de fonds - Source: {source}. {description or ''}"
    )
    
    transaction = create_transaction(db, community_wallet.id, transaction_data)
    
    return {
        "status": "success",
        "message": f"Fonds de {amount} FCFA ajoutés avec succès",
        "transaction_id": transaction.id,
        "new_balance": community_wallet.balance
    }


# Fonctions utilitaires
def get_wallet_balance(db: Session, user_id: int) -> Dict[str, Any]:
    """Récupérer le solde et les informations du portefeuille d'un utilisateur"""
    
    wallet = get_wallet(db, user_id)
    
    # Statistiques personnelles
    total_borrowed = db.query(func.sum(Loan.amount)).filter(
        and_(
            Loan.wallet_id == wallet.id,
            Loan.status.in_(["approved", "repaid"])
        )
    ).scalar() or 0.0
    
    active_loan_amount = db.query(func.sum(Loan.amount)).filter(
        and_(
            Loan.wallet_id == wallet.id,
            Loan.status == "approved"
        )
    ).scalar() or 0.0
    
    # Total des contributions (transactions de type deposit)
    total_contributed = db.query(func.sum(Transaction.amount)).filter(
        and_(
            Transaction.wallet_id == wallet.id,
            Transaction.type == TransactionType.deposit,
            Transaction.status == TransactionStatus.completed
        )
    ).scalar() or 0.0
    
    # Limite de crédit disponible (basée sur l'historique et le profil)
    available_credit = calculate_available_credit(db, user_id)
    
    return {
        "balance": wallet.balance,
        "currency": "XOF",
        "total_contributed": total_contributed,
        "total_borrowed": total_borrowed,
        "active_loan_amount": active_loan_amount,
        "available_credit": available_credit
    }


def calculate_available_credit(db: Session, user_id: int) -> float:
    """Calculer le crédit disponible pour un utilisateur"""
    
    # Logique simplifiée pour calculer le crédit disponible
    # Basée sur l'historique de remboursement, le profil utilisateur, etc.
    
    wallet = get_wallet(db, user_id)
    
    # Vérifier s'il y a un prêt actif
    active_loan = db.query(Loan).filter(
        and_(
            Loan.wallet_id == wallet.id,
            Loan.status == "approved"
        )
    ).first()
    
    if active_loan:
        return 0.0  # Pas de crédit si un prêt est déjà actif
    
    # Compter les prêts remboursés avec succès
    repaid_loans_count = db.query(Loan).filter(
        and_(
            Loan.wallet_id == wallet.id,
            Loan.status == "repaid"
        )
    ).count()
    
    # Crédit de base + bonus pour bon historique
    base_credit = 10000.0  # 10,000 FCFA de base
    history_bonus = repaid_loans_count * 5000.0  # 5,000 FCFA par prêt remboursé
    
    # Limite maximale
    max_credit = 100000.0  # 100,000 FCFA maximum
    
    return min(base_credit + history_bonus, max_credit)


def get_overdue_loans(db: Session) -> List[Loan]:
    """Récupérer les prêts en retard"""
    
    current_date = datetime.utcnow()
    
    return db.query(Loan).filter(
        and_(
            Loan.status == "approved",
            Loan.repayment_deadline < current_date
        )
    ).order_by(desc(Loan.repayment_deadline)).all()


def get_loan_analytics(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """Récupérer les analyses détaillées des prêts"""
    
    # Si aucune date n'est fournie, utiliser les 30 derniers jours
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Récupérer les prêts pour la période
    loans = get_loan_history(db, None, start_date, end_date)
    
    # Calculer les statistiques
    total_loans = len(loans)
    approved_loans = sum(1 for loan in loans if loan.status in ["approved", "repaid"])
    rejected_loans = sum(1 for loan in loans if loan.status == "rejected")
    repaid_loans = sum(1 for loan in loans if loan.status == "repaid")
    written_off_loans = sum(1 for loan in loans if loan.status == "written_off")
    
    # Taux de remboursement
    repayment_rate = (repaid_loans / max(approved_loans, 1)) * 100
    
    # Montants
    loan_amounts = [loan.amount for loan in loans if loan.status != "rejected"]
    avg_loan_amount = sum(loan_amounts) / max(len(loan_amounts), 1) if loan_amounts else 0
    min_loan_amount = min(loan_amounts) if loan_amounts else 0
    max_loan_amount = max(loan_amounts) if loan_amounts else 0
    
    # Durées
    loan_durations = []
    for loan in loans:
        if loan.repayment_deadline and loan.created_at:
            duration = (loan.repayment_deadline - loan.created_at).days
            loan_durations.append(duration)
    
    avg_loan_duration = sum(loan_durations) / max(len(loan_durations), 1) if loan_durations else 0
    min_loan_duration = min(loan_durations) if loan_durations else 0
    max_loan_duration = max(loan_durations) if loan_durations else 0
    
    return {
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
