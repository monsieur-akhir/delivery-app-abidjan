from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_

from ..models.user import User, UserRole, UserStatus, BusinessProfile, CourierProfile
from ..models.delivery import Delivery, DeliveryStatus
from ..models.gamification import CourierPoints
from ..schemas.user import UserStatusUpdate, KYCUpdate
from ..core.exceptions import NotFoundError, ForbiddenError
from ..services.user import get_user, update_user_status as _update_user_status


def get_clients(
    db: Session,
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """
    Récupère la liste des clients avec filtrage optionnel.
    """
    query = db.query(User).filter(User.role == UserRole.client)

    if status:
        query = query.filter(User.status == status)

    if commune:
        query = query.filter(User.commune == commune)

    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    return query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()


def get_couriers(
    db: Session,
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """
    Récupère la liste des coursiers avec filtrage optionnel.
    """
    query = db.query(User).filter(User.role == UserRole.courier)

    if status:
        query = query.filter(User.status == status)

    if commune:
        query = query.filter(User.commune == commune)

    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    return query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()


def get_businesses(
    db: Session,
    status: Optional[str] = None,
    commune: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """
    Récupère la liste des entreprises avec filtrage optionnel.
    """
    query = db.query(User).filter(User.role == UserRole.business)

    if status:
        query = query.filter(User.status == status)

    if commune:
        query = query.filter(User.commune == commune)

    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

        # Recherche également dans les profils d'entreprise
        business_search = query.join(BusinessProfile).filter(
            BusinessProfile.business_name.ilike(f"%{search}%")
        )
        query = query.union(business_search)

    return query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()


def update_user_status(db: Session, user_id: int, status: UserStatus) -> User:
    """
    Met à jour le statut d'un utilisateur.
    """
    return _update_user_status(db, user_id, UserStatusUpdate(status=status))


def update_kyc_status(
    db: Session, 
    user_id: int, 
    kyc_status: str, 
    rejection_reason: Optional[str] = None
) -> User:
    """
    Met à jour le statut KYC d'un utilisateur.
    """
    user = get_user(db, user_id)
    user.kyc_status = kyc_status

    if rejection_reason:
        user.kyc_rejection_reason = rejection_reason

    db.commit()
    db.refresh(user)
    return user

def get_filtered_users(
    db: Session, 
    role: Optional[str] = None,
    status: Optional[str] = None,
    kyc_status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """
    Récupère les utilisateurs avec filtres
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if kyc_status:
        query = query.filter(User.kyc_status == kyc_status)
    if search:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )

    return query.offset(skip).limit(limit).all()

def create_new_user(db: Session, user_data: dict) -> User:
    """
    Crée un nouvel utilisateur
    """
    from ..core.security import get_password_hash

    # Hasher le mot de passe
    if 'password' in user_data:
        user_data['hashed_password'] = get_password_hash(user_data.pop('password'))

    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_data(db: Session, user_id: int, user_data: dict) -> User:
    """
    Met à jour les données d'un utilisateur
    """
    user = get_user(db, user_id)

    for key, value in user_data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user

def get_user_statistics(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Récupère les statistiques d'un utilisateur
    """
    from ..models.delivery import Delivery
    from ..models.rating import Rating
    from sqlalchemy import func

    user = get_user(db, user_id)
    stats = {}

    if user.role == 'client':
        # Statistiques client
        deliveries = db.query(Delivery).filter(Delivery.client_id == user_id)
        stats.update({
            'total_deliveries': deliveries.count(),
            'completed_deliveries': deliveries.filter(Delivery.status == 'completed').count(),
            'total_spent': deliveries.filter(Delivery.status == 'completed').with_entities(func.sum(Delivery.final_price)).scalar() or 0
        })

    elif user.role == 'courier':
        # Statistiques coursier
        deliveries = db.query(Delivery).filter(Delivery.courier_id == user_id)
        completed_deliveries = deliveries.filter(Delivery.status == 'completed')

        stats.update({
            'total_deliveries': deliveries.count(),
            'completed_deliveries': completed_deliveries.count(),
            'total_earnings': completed_deliveries.with_entities(func.sum(Delivery.final_price)).scalar() or 0,
            'distance_covered': 0  # À calculer selon la logique métier
        })

    # Ratings moyens
    avg_rating = db.query(func.avg(Rating.score)).filter(Rating.rated_user_id == user_id).scalar()
    stats['average_rating'] = round(avg_rating, 2) if avg_rating else 0

    return stats

def get_user_activity_history(db: Session, user_id: int, limit: int = 20) -> List[Dict]:
    """
    Récupère l'historique d'activité d'un utilisateur
    """
    # Cette fonction nécessiterait un modèle ActivityLog
    # Pour l'instant, on retourne les dernières livraisons
    from ..models.delivery import Delivery

    activities = []

    # Livraisons en tant que client
    client_deliveries = db.query(Delivery).filter(
        Delivery.client_id == user_id
    ).order_by(Delivery.created_at.desc()).limit(10).all()

    for delivery in client_deliveries:
        activities.append({
            'id': f"delivery_client_{delivery.id}",
            'type': 'delivery_created',
            'description': f"Commande créée vers {delivery.delivery_commune}",
            'created_at': delivery.created_at
        })

    # Livraisons en tant que coursier
    courier_deliveries = db.query(Delivery).filter(
        Delivery.courier_id == user_id
    ).order_by(Delivery.created_at.desc()).limit(10).all()

    for delivery in courier_deliveries:
        activities.append({
            'id': f"delivery_courier_{delivery.id}",
            'type': 'delivery_completed' if delivery.status == 'completed' else 'delivery_accepted',
            'description': f"Livraison {'terminée' if delivery.status == 'completed' else 'acceptée'} - {delivery.pickup_commune} vers {delivery.delivery_commune}",
            'created_at': delivery.updated_at or delivery.created_at
        })

    # Trier par date et limiter
    activities.sort(key=lambda x: x['created_at'], reverse=True)
    return activities[:limit]

def get_user_kyc_documents(db: Session, user_id: int) -> List[Dict]:
    """
    Récupère les documents KYC d'un utilisateur
    """
    # Cette fonction nécessiterait un modèle KYCDocument
    # Pour l'instant, on retourne des données factices
    return [
        {
            'id': 1,
            'type': 'id_card',
            'url': '/documents/id_card_1.jpg',
            'status': 'pending',
            'submitted_at': '2024-01-15T10:00:00Z',
            'notes': None
        }
    ]

def get_kyc_review_history(db: Session, user_id: int) -> List[Dict]:
    """
    Récupère l'historique de révision KYC
    """
    # Cette fonction nécessiterait un modèle KYCReview
    return []

def update_kyc_document_status(db: Session, document_id: int, document_data: dict) -> Dict:
    """
    Met à jour le statut d'un document KYC
    """
    # À implémenter avec le modèle KYCDocument
    return {'status': 'updated'}

def export_users_to_csv(db: Session) -> bytes:
    """
    Exporte les utilisateurs en CSV
    """
    import csv
    import io

    users = db.query(User).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # En-têtes
    writer.writerow(['ID', 'Nom complet', 'Téléphone', 'Email', 'Rôle', 'Statut', 'KYC', 'Date création'])

    # Données
    for user in users:
        writer.writerow([
            user.id,
            user.full_name,
            user.phone,
            user.email or '',
            user.role,
            user.status,
            user.kyc_status,
            user.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])

    output.seek(0)
    return output.getvalue().encode('utf-8')

def get_advanced_statistics(db: Session, period: str = "month") -> Dict[str, Any]:
    """
    Récupère les statistiques avancées
    """
    from datetime import datetime, timedelta
    from ..models.delivery import Delivery
    from sqlalchemy import func, extract

    # Calculer la période
    now = datetime.utcnow()
    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=365)

    # Statistiques utilisateurs
    total_users = db.query(User).count()
    new_users = db.query(User).filter(User.created_at >= start_date).count()

    # Statistiques livraisons
    total_deliveries = db.query(Delivery).count()
    period_deliveries = db.query(Delivery).filter(Delivery.created_at >= start_date).count()

    # Revenus
    total_revenue = db.query(func.sum(Delivery.final_price)).filter(
        Delivery.status == 'completed'
    ).scalar() or 0

    period_revenue = db.query(func.sum(Delivery.final_price)).filter(
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date
    ).scalar() or 0

    return {
        'users': {
            'total': total_users,
            'new_in_period': new_users,
            'growth_rate': (new_users / total_users * 100) if total_users > 0 else 0
        },
        'deliveries': {
            'total': total_deliveries,
            'period': period_deliveries
        },
        'revenue': {
            'total': total_revenue,
            'period': period_revenue
        }
    }

def get_kyc_statistics(db: Session) -> Dict[str, Any]:
    """
    Récupère les statistiques KYC
    """
    from sqlalchemy import func

    kyc_stats = db.query(
        User.kyc_status,
        func.count(User.id).label('count')
    ).group_by(User.kyc_status).all()

    stats = {status: 0 for status in ['pending', 'verified', 'rejected']}

    for stat in kyc_stats:
        if stat.kyc_status in stats:
            stats[stat.kyc_status] = stat.count

    stats['total'] = sum(stats.values())

    return stats


def get_courier_performance(
    db: Session,
    courier_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les statistiques de performance d'un coursier.
    """
    courier = get_user(db, courier_id)
    if courier.role != UserRole.courier:
        raise ForbiddenError("L'utilisateur n'est pas un coursier")

    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Requête de base pour les livraisons du coursier
    base_query = db.query(Delivery).filter(
        Delivery.courier_id == courier_id,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    )

    # Statistiques générales
    total_deliveries = base_query.count()
    completed_deliveries = base_query.filter(Delivery.status == DeliveryStatus.completed).count()
    cancelled_deliveries = base_query.filter(Delivery.status == DeliveryStatus.cancelled).count()

    # Calcul du taux de réussite
    success_rate = (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0

    # Revenus totaux
    total_earnings = db.query(func.sum(Delivery.courier_fee)).filter(
        Delivery.courier_id == courier_id,
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    # Points de gamification
    courier_points = db.query(CourierPoints).filter(CourierPoints.courier_id == courier_id).first()

    # Temps de livraison moyen
    avg_delivery_time = db.query(func.avg(Delivery.actual_duration)).filter(
        Delivery.courier_id == courier_id,
        Delivery.status == DeliveryStatus.completed,
        Delivery.actual_duration.isnot(None),
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    return {
        "courier_id": courier_id,
        "courier_name": courier.full_name,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "deliveries": {
            "total": total_deliveries,
            "completed": completed_deliveries,
            "cancelled": cancelled_deliveries,
            "success_rate": round(success_rate, 2)
        },
        "earnings": {
            "total": float(total_earnings),
            "average_per_delivery": float(total_earnings / completed_deliveries) if completed_deliveries > 0 else 0
        },
        "performance": {
            "average_delivery_time_minutes": float(avg_delivery_time) if avg_delivery_time else 0,
            "total_points": courier_points.total_points if courier_points else 0,
            "level": courier_points.level if courier_points else 1
        }
    }


def get_business_finances(
    db: Session,
    business_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les données financières d'une entreprise.
    """
    business = get_user(db, business_id)
    if business.role != UserRole.business:
        raise ForbiddenError("L'utilisateur n'est pas une entreprise")

    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Livraisons de l'entreprise
    deliveries_query = db.query(Delivery).filter(
        Delivery.client_id == business_id,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    )

    total_deliveries = deliveries_query.count()
    completed_deliveries = deliveries_query.filter(Delivery.status == DeliveryStatus.completed).count()

    # Revenus et coûts
    total_revenue = db.query(func.sum(Delivery.price)).filter(
        Delivery.client_id == business_id,
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    total_courier_fees = db.query(func.sum(Delivery.courier_fee)).filter(
        Delivery.client_id == business_id,
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    # Commission (supposée être 10% du prix)
    commission_rate = 0.10
    total_commission = total_revenue * commission_rate

    return {
        "business_id": business_id,
        "business_name": business.full_name,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "deliveries": {
            "total": total_deliveries,
            "completed": completed_deliveries
        },
        "finances": {
            "total_revenue": float(total_revenue),
            "total_courier_fees": float(total_courier_fees),
            "total_commission": float(total_commission),
            "net_revenue": float(total_revenue - total_courier_fees - total_commission)
        }
    }


def get_global_stats(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    commune: Optional[str] = None
) -> Dict[str, Any]:
    """
    Récupère les statistiques globales de la plateforme.
    """
    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Requête de base pour les utilisateurs
    users_query = db.query(User)
    if commune:
        users_query = users_query.filter(User.commune == commune)

    # Statistiques des utilisateurs
    total_users = users_query.count()
    total_clients = users_query.filter(User.role == UserRole.client).count()
    total_couriers = users_query.filter(User.role == UserRole.courier).count()
    total_businesses = users_query.filter(User.role == UserRole.business).count()

    # Requête de base pour les livraisons
    deliveries_query = db.query(Delivery).filter(
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    )

    if commune:
        deliveries_query = deliveries_query.join(User).filter(User.commune == commune)

    # Statistiques des livraisons
    total_deliveries = deliveries_query.count()
    completed_deliveries = deliveries_query.filter(Delivery.status == DeliveryStatus.completed).count()
    cancelled_deliveries = deliveries_query.filter(Delivery.status == DeliveryStatus.cancelled).count()
    pending_deliveries = deliveries_query.filter(Delivery.status == DeliveryStatus.pending).count()

    # Revenus totaux
    total_revenue = db.query(func.sum(Delivery.price)).filter(
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "users": {
            "total": total_users,
            "clients": total_clients,
            "couriers": total_couriers,
            "businesses": total_businesses
        },
        "deliveries": {
            "total": total_deliveries,
            "completed": completed_deliveries,
            "cancelled": cancelled_deliveries,
            "pending": pending_deliveries,
            "success_rate": round((completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0, 2)
        },
        "revenue": {
            "total": float(total_revenue),
            "average_per_delivery": float(total_revenue / completed_deliveries) if completed_deliveries > 0 else 0
        }
    }


def get_chart_data(
    db: Session,
    chart_type: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    commune: Optional[str] = None
) -> Dict[str, Any]:
    """
    Récupère les données pour les graphiques du tableau de bord.
    """
    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    if chart_type == "deliveries_per_day":
        # Livraisons par jour
        query = db.query(
            func.date(Delivery.created_at).label('date'),
            func.count(Delivery.id).label('count')
        ).filter(
            Delivery.created_at >= start_date,
            Delivery.created_at <= end_date
        ).group_by(func.date(Delivery.created_at)).order_by(func.date(Delivery.created_at))

        results = query.all()
        return {
            "labels": [str(result.date) for result in results],
            "data": [result.count for result in results]
        }

    elif chart_type == "revenue_per_day":
        # Revenus par jour
        query = db.query(
            func.date(Delivery.created_at).label('date'),
            func.sum(Delivery.price).label('revenue')
        ).filter(
            Delivery.created_at >= start_date,
            Delivery.created_at <= end_date,
            Delivery.status == DeliveryStatus.completed
        ).group_by(func.date(Delivery.created_at)).order_by(func.date(Delivery.created_at))

        results = query.all()
        return {
            "labels": [str(result.date) for result in results],
            "data": [float(result.revenue or 0) for result in results]
        }

    elif chart_type == "users_per_role":
        # Utilisateurs par rôle
        query = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role)

        if commune:
            query = query.filter(User.commune == commune)

        results = query.all()
        return {
            "labels": [result.role.value for result in results],
            "data": [result.count for result in results]
        }

    else:
        raise NotFoundError(f"Type de graphique '{chart_type}' non supporté")


def get_revenues(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les données de revenus détaillées.
    """
    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Revenus totaux
    total_revenue = db.query(func.sum(Delivery.price)).filter(
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    # Frais de coursiers
    total_courier_fees = db.query(func.sum(Delivery.courier_fee)).filter(
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    # Commission de la plateforme (10%)
    platform_commission = total_revenue * 0.10

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "revenue": {
            "total": float(total_revenue),
            "courier_fees": float(total_courier_fees),
            "platform_commission": float(platform_commission),
            "net_revenue": float(total_revenue - total_courier_fees)
        }
    }


def get_expenses(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les données de dépenses détaillées.
    """
    # Date par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # Pour l'instant, les principales dépenses sont les frais de coursiers
    total_courier_fees = db.query(func.sum(Delivery.courier_fee)).filter(
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    # Estimation des coûts opérationnels (5% du CA)
    total_revenue = db.query(func.sum(Delivery.price)).filter(
        Delivery.status == DeliveryStatus.completed,
        Delivery.created_at >= start_date,
        Delivery.created_at <= end_date
    ).scalar() or 0

    operational_costs = total_revenue * 0.05

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "expenses": {
            "courier_fees": float(total_courier_fees),
            "operational_costs": float(operational_costs),
            "total": float(total_courier_fees + operational_costs)
        }
    }


def generate_financial_report(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Génère un rapport financier complet.
    """
    revenues = get_revenues(db, start_date, end_date)
    expenses = get_expenses(db, start_date, end_date)

    net_profit = revenues["revenue"]["net_revenue"] - expenses["expenses"]["total"]

    return {
        "period": revenues["period"],
        "summary": {
            "total_revenue": revenues["revenue"]["total"],
            "total_expenses": expenses["expenses"]["total"],
            "net_profit": net_profit,
            "profit_margin": (net_profit / revenues["revenue"]["total"] * 100) if revenues["revenue"]["total"] > 0 else 0
        },
        "details": {
            "revenues": revenues["revenue"],
            "expenses": expenses["expenses"]
        }
    }


def update_app_config(db: Session, config_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Met à jour la configuration de l'application.
    """
    # Ici, on pourrait stocker la configuration dans une table dédiée
    # Pour l'instant, on retourne juste les données reçues
    return config_data


def get_app_config(db: Session) -> Dict[str, Any]:
    """
    Récupère la configuration de l'application.
    """
    # Configuration par défaut
    return {
        "commission_rate": 0.10,
        "points_per_delivery": 10,
        "points_per_level": 100,
        "max_delivery_radius": 50,
        "express_delivery_fee": 5000
    }