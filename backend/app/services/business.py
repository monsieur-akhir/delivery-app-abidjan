
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from fastapi import BackgroundTasks

from ..models.user import User, UserRole, BusinessProfile
from ..models.delivery import Delivery, DeliveryStatus
from ..models.transport import Vehicle
from ..schemas.delivery import DeliveryCreate
from ..schemas.business import BusinessInviteRequest
from ..services.notification import send_sms_notification
from ..core.exceptions import NotFoundError, ForbiddenError


def get_business_dashboard(db: Session, business_id: int, period: str = "week") -> Dict[str, Any]:
    """
    Récupère les données du tableau de bord pour une entreprise
    """
    # Calculer la période
    now = datetime.utcnow()
    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Statistiques générales
    total_deliveries = db.query(Delivery).filter(Delivery.client_id == business_id).count()
    
    active_deliveries = db.query(Delivery).filter(
        Delivery.client_id == business_id,
        Delivery.status.in_(['pending', 'accepted', 'in_progress'])
    ).count()
    
    completed_deliveries = db.query(Delivery).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed'
    ).count()
    
    # Revenus
    total_revenue = db.query(func.sum(Delivery.final_price)).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed'
    ).scalar() or 0
    
    period_revenue = db.query(func.sum(Delivery.final_price)).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date
    ).scalar() or 0
    
    # Coursiers actifs
    active_couriers = db.query(func.count(func.distinct(Delivery.courier_id))).filter(
        Delivery.client_id == business_id,
        Delivery.status.in_(['accepted', 'in_progress']),
        Delivery.courier_id.isnot(None)
    ).scalar() or 0
    
    # Revenus par jour pour le graphique
    daily_revenue = db.query(
        func.date(Delivery.completed_at).label('date'),
        func.sum(Delivery.final_price).label('revenue')
    ).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date
    ).group_by(func.date(Delivery.completed_at)).order_by('date').all()
    
    revenue_by_day = {
        "labels": [item.date.strftime('%Y-%m-%d') for item in daily_revenue],
        "data": [float(item.revenue or 0) for item in daily_revenue]
    }
    
    return {
        "total_deliveries": total_deliveries,
        "active_deliveries": active_deliveries,
        "completed_deliveries": completed_deliveries,
        "total_revenue": float(total_revenue),
        "period_revenue": float(period_revenue),
        "total_couriers": active_couriers,
        "revenue_by_day": revenue_by_day,
        "period": period
    }


def get_business_deliveries(
    db: Session,
    business_id: int,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    limit: int = 20,
    sort: str = "created_at",
    order: str = "desc"
) -> Dict[str, Any]:
    """
    Récupère les livraisons d'une entreprise avec filtrage et pagination
    """
    query = db.query(Delivery).filter(Delivery.client_id == business_id)
    
    # Filtres
    if status:
        query = query.filter(Delivery.status == status)
    if start_date:
        query = query.filter(Delivery.created_at >= start_date)
    if end_date:
        query = query.filter(Delivery.created_at <= end_date)
    
    # Tri
    if hasattr(Delivery, sort):
        if order.lower() == "desc":
            query = query.order_by(desc(getattr(Delivery, sort)))
        else:
            query = query.order_by(getattr(Delivery, sort))
    
    # Pagination
    total = query.count()
    deliveries = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "deliveries": deliveries,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


def create_business_delivery(db: Session, business_id: int, delivery_data: DeliveryCreate) -> Delivery:
    """
    Créer une nouvelle livraison pour l'entreprise
    """
    delivery = Delivery(
        client_id=business_id,
        **delivery_data.dict()
    )
    
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    return delivery


def get_business_couriers(
    db: Session,
    business_id: int,
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    sort: str = "created_at",
    order: str = "desc"
) -> Dict[str, Any]:
    """
    Récupère les coursiers disponibles pour l'entreprise
    """
    # Coursiers qui ont déjà travaillé pour cette entreprise
    courier_ids = db.query(func.distinct(Delivery.courier_id)).filter(
        Delivery.client_id == business_id,
        Delivery.courier_id.isnot(None)
    ).subquery()
    
    query = db.query(User).filter(
        User.role == UserRole.courier,
        or_(
            User.id.in_(courier_ids),
            User.status == 'active'  # Tous les coursiers actifs
        )
    )
    
    # Filtres
    if status:
        query = query.filter(User.status == status)
    
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Tri par défaut
    query = query.order_by(desc(User.created_at))
    
    # Pagination
    total = query.count()
    couriers = query.offset((page - 1) * limit).limit(limit).all()
    
    # Enrichir avec les statistiques
    enriched_couriers = []
    for courier in couriers:
        # Statistiques du coursier pour cette entreprise
        stats = db.query(
            func.count(Delivery.id).label('total_deliveries'),
            func.count(Delivery.id).filter(Delivery.status == 'completed').label('completed_deliveries'),
            func.sum(Delivery.final_price).label('total_earnings')
        ).filter(
            Delivery.courier_id == courier.id,
            Delivery.client_id == business_id
        ).first()
        
        courier_data = {
            **courier.__dict__,
            'stats': {
                'total_deliveries': stats.total_deliveries or 0,
                'completed_deliveries': stats.completed_deliveries or 0,
                'total_earnings': stats.total_earnings or 0,
                'average_rating': 4.5,  # À calculer depuis les évaluations
                'ratings_count': 0
            },
            'is_favorite': False,  # À implémenter avec une table de favoris
            'last_activity': courier.updated_at,
            'vehicle': None  # À enrichir avec les infos du véhicule
        }
        
        enriched_couriers.append(courier_data)
    
    return {
        "couriers": enriched_couriers,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


def invite_courier(
    db: Session,
    business_id: int,
    invite_data: BusinessInviteRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Inviter un coursier à rejoindre l'entreprise
    """
    # Vérifier si le numéro existe déjà
    existing_user = db.query(User).filter(User.phone == invite_data.phone).first()
    
    if existing_user:
        if existing_user.role != UserRole.courier:
            raise ForbiddenError("Ce numéro appartient à un utilisateur non-coursier")
        
        message = f"Invitation à rejoindre l'entreprise. Commission: {invite_data.commission}%"
        if invite_data.message:
            message += f"\nMessage: {invite_data.message}"
    else:
        message = f"Vous êtes invité à devenir coursier. Téléchargez l'app et utilisez ce code: {business_id}"
    
    # Envoyer SMS d'invitation
    background_tasks.add_task(
        send_sms_notification,
        invite_data.phone,
        message
    )
    
    return {
        "message": "Invitation envoyée avec succès",
        "phone": invite_data.phone,
        "existing_user": existing_user is not None
    }


def toggle_courier_favorite(db: Session, business_id: int, courier_id: int, is_favorite: bool) -> Dict[str, Any]:
    """
    Ajouter/retirer un coursier des favoris
    """
    # Vérifier que le coursier existe
    courier = db.query(User).filter(
        User.id == courier_id,
        User.role == UserRole.courier
    ).first()
    
    if not courier:
        raise NotFoundError("Coursier non trouvé")
    
    # Pour l'instant, on retourne juste le statut
    # À implémenter avec une table business_courier_favorites
    
    return {
        "courier_id": courier_id,
        "is_favorite": is_favorite,
        "message": f"Coursier {'ajouté aux' if is_favorite else 'retiré des'} favoris"
    }


def get_business_finances(
    db: Session,
    business_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les données financières de l'entreprise
    """
    # Période par défaut: dernier mois
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Revenus totaux
    total_revenue = db.query(func.sum(Delivery.final_price)).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date,
        Delivery.completed_at <= end_date
    ).scalar() or 0
    
    # Frais de livraison payés aux coursiers
    courier_fees = db.query(func.sum(Delivery.final_price * 0.8)).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date,
        Delivery.completed_at <= end_date
    ).scalar() or 0
    
    # Commission de la plateforme (supposée 10%)
    platform_fees = total_revenue * 0.1
    
    # Nombre de livraisons
    delivery_count = db.query(func.count(Delivery.id)).filter(
        Delivery.client_id == business_id,
        Delivery.status == 'completed',
        Delivery.completed_at >= start_date,
        Delivery.completed_at <= end_date
    ).scalar() or 0
    
    # Prix moyen
    avg_delivery_price = total_revenue / delivery_count if delivery_count > 0 else 0
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "revenue": {
            "total": float(total_revenue),
            "courier_fees": float(courier_fees),
            "platform_fees": float(platform_fees),
            "net_revenue": float(total_revenue - courier_fees - platform_fees)
        },
        "deliveries": {
            "count": delivery_count,
            "average_price": float(avg_delivery_price)
        }
    }


def update_business_settings(db: Session, business_id: int, settings_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Met à jour les paramètres de l'entreprise
    """
    user = db.query(User).filter(User.id == business_id).first()
    if not user or not user.business_profile:
        raise NotFoundError("Profil d'entreprise non trouvé")
    
    # Mettre à jour le profil utilisateur
    user_fields = ['language_preference']
    for field in user_fields:
        if field in settings_data:
            setattr(user, field, settings_data[field])
    
    # Mettre à jour le profil d'entreprise
    business_fields = ['business_name', 'business_type', 'address', 'description']
    for field in business_fields:
        if field in settings_data:
            setattr(user.business_profile, field, settings_data[field])
    
    db.commit()
    
    return {
        "message": "Paramètres mis à jour avec succès",
        "user": user,
        "business_profile": user.business_profile
    }
