
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_business_or_manager
from ..models.user import User
from ..models.delivery import Delivery, DeliveryStatus
from ..schemas.business import BusinessStatsResponse

router = APIRouter()

@router.get("/performance-metrics")
async def get_performance_metrics(
    period: str = Query("month", description="Période: week, month, quarter, year"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les métriques de performance détaillées
    """
    # Calculer la période
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Métriques de livraison
    delivery_metrics = db.query(
        func.count(Delivery.id).label('total'),
        func.count(Delivery.id).filter(Delivery.status == DeliveryStatus.completed).label('completed'),
        func.count(Delivery.id).filter(Delivery.status == DeliveryStatus.cancelled).label('cancelled'),
        func.avg(func.extract('epoch', Delivery.delivered_at - Delivery.created_at) / 60).label('avg_delivery_time'),
        func.sum(Delivery.final_price).label('total_revenue')
    ).filter(
        Delivery.client_id == current_user.id,
        Delivery.created_at >= start_date
    ).first()
    
    # Taux de satisfaction client
    satisfaction_rate = 4.5  # À calculer depuis les évaluations
    
    # Performance par jour
    daily_performance = db.query(
        func.date(Delivery.created_at).label('date'),
        func.count(Delivery.id).label('deliveries'),
        func.sum(Delivery.final_price).label('revenue')
    ).filter(
        Delivery.client_id == current_user.id,
        Delivery.created_at >= start_date
    ).group_by(func.date(Delivery.created_at)).order_by('date').all()
    
    return {
        "period": period,
        "metrics": {
            "total_deliveries": delivery_metrics.total or 0,
            "completed_deliveries": delivery_metrics.completed or 0,
            "cancelled_deliveries": delivery_metrics.cancelled or 0,
            "completion_rate": (delivery_metrics.completed / delivery_metrics.total * 100) if delivery_metrics.total > 0 else 0,
            "average_delivery_time": delivery_metrics.avg_delivery_time or 0,
            "total_revenue": delivery_metrics.total_revenue or 0,
            "satisfaction_rate": satisfaction_rate
        },
        "daily_performance": [
            {
                "date": item.date.strftime('%Y-%m-%d'),
                "deliveries": item.deliveries,
                "revenue": float(item.revenue or 0)
            }
            for item in daily_performance
        ]
    }

@router.get("/courier-performance")
async def get_courier_performance(
    period: str = Query("month", description="Période: week, month, quarter, year"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer la performance des coursiers
    """
    # Calculer la période
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Performance par coursier
    courier_performance = db.query(
        User.id,
        User.full_name,
        func.count(Delivery.id).label('total_deliveries'),
        func.count(Delivery.id).filter(Delivery.status == DeliveryStatus.completed).label('completed_deliveries'),
        func.avg(func.extract('epoch', Delivery.delivered_at - Delivery.pickup_at) / 60).label('avg_delivery_time'),
        func.sum(Delivery.final_price).label('total_revenue')
    ).join(Delivery, User.id == Delivery.courier_id).filter(
        Delivery.client_id == current_user.id,
        Delivery.created_at >= start_date
    ).group_by(User.id, User.full_name).order_by(desc('completed_deliveries')).all()
    
    return {
        "period": period,
        "couriers": [
            {
                "id": courier.id,
                "name": courier.full_name,
                "total_deliveries": courier.total_deliveries,
                "completed_deliveries": courier.completed_deliveries,
                "completion_rate": (courier.completed_deliveries / courier.total_deliveries * 100) if courier.total_deliveries > 0 else 0,
                "avg_delivery_time": float(courier.avg_delivery_time or 0),
                "total_revenue": float(courier.total_revenue or 0),
                "rating": 4.5  # À calculer depuis les évaluations
            }
            for courier in courier_performance
        ]
    }

@router.get("/delivery-zones")
async def get_delivery_zones_stats(
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les statistiques par zone de livraison
    """
    # Statistiques par commune de livraison
    zone_stats = db.query(
        Delivery.delivery_commune,
        func.count(Delivery.id).label('total_deliveries'),
        func.sum(Delivery.final_price).label('total_revenue'),
        func.avg(Delivery.final_price).label('avg_price')
    ).filter(
        Delivery.client_id == current_user.id,
        Delivery.status == DeliveryStatus.completed
    ).group_by(Delivery.delivery_commune).order_by(desc('total_deliveries')).all()
    
    return {
        "zones": [
            {
                "commune": zone.delivery_commune,
                "total_deliveries": zone.total_deliveries,
                "total_revenue": float(zone.total_revenue or 0),
                "average_price": float(zone.avg_price or 0)
            }
            for zone in zone_stats
        ]
    }
