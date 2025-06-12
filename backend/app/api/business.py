
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import csv
import io

from ..db.session import get_db
from ..core.dependencies import get_current_business_or_manager, get_current_active_user
from ..models.user import User, UserRole, BusinessProfile
from ..models.delivery import Delivery, DeliveryStatus
from ..models.transport import Vehicle, CourierVehicle
from ..schemas.user import UserResponse
from ..schemas.delivery import DeliveryResponse, DeliveryCreate
from ..schemas.business import (
    BusinessDashboardResponse, BusinessCourierResponse, 
    BusinessInviteRequest, BusinessSettingsResponse,
    BusinessFinancesResponse
)
from ..services.business import (
    get_business_dashboard, get_business_couriers,
    invite_courier, toggle_courier_favorite,
    get_business_deliveries, create_business_delivery,
    get_business_finances, update_business_settings
)
from ..services.notification import send_notification

router = APIRouter()

@router.get("/dashboard", response_model=BusinessDashboardResponse)
async def get_dashboard(
    period: str = Query("week", description="Période: day, week, month, quarter, year"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les données du tableau de bord pour une entreprise
    """
    return get_business_dashboard(db, current_user.id, period)

@router.get("/deliveries", response_model=Dict[str, Any])
async def get_deliveries(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at", description="Champ de tri"),
    order: str = Query("desc", description="Ordre: asc, desc"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les livraisons d'une entreprise avec filtrage et pagination
    """
    return get_business_deliveries(
        db, current_user.id, status, start_date, end_date,
        page, limit, sort, order
    )

@router.post("/deliveries", response_model=DeliveryResponse)
async def create_delivery(
    delivery_data: DeliveryCreate,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle livraison pour l'entreprise
    """
    return create_business_delivery(db, current_user.id, delivery_data)

@router.get("/deliveries/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery_details(
    delivery_id: int,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les détails d'une livraison
    """
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.client_id == current_user.id
    ).first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    return delivery

@router.put("/deliveries/{delivery_id}")
async def update_delivery(
    delivery_id: int,
    delivery_data: Dict[str, Any],
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une livraison
    """
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.client_id == current_user.id
    ).first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier si la livraison peut être modifiée
    if delivery.status in ['in_progress', 'delivered', 'completed']:
        raise HTTPException(
            status_code=400, 
            detail="Cette livraison ne peut plus être modifiée"
        )
    
    # Mettre à jour les champs autorisés
    allowed_fields = ['pickup_address', 'delivery_address', 'package_description', 'proposed_price']
    for field, value in delivery_data.items():
        if field in allowed_fields and hasattr(delivery, field):
            setattr(delivery, field, value)
    
    db.commit()
    db.refresh(delivery)
    return delivery

@router.post("/deliveries/{delivery_id}/cancel")
async def cancel_delivery(
    delivery_id: int,
    reason: str = None,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Annuler une livraison
    """
    delivery = db.query(Delivery).filter(
        Delivery.id == delivery_id,
        Delivery.client_id == current_user.id
    ).first()
    
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    if delivery.status in ['delivered', 'completed']:
        raise HTTPException(
            status_code=400, 
            detail="Cette livraison ne peut plus être annulée"
        )
    
    delivery.status = DeliveryStatus.cancelled
    delivery.cancelled_at = datetime.utcnow()
    
    # Notifier le coursier si assigné
    if delivery.courier_id:
        await send_notification(
            db, delivery.courier_id, 
            "Livraison annulée",
            f"La livraison #{delivery.id} a été annulée par le client"
        )
    
    db.commit()
    return {"message": "Livraison annulée avec succès"}

@router.get("/couriers", response_model=Dict[str, Any])
async def get_couriers(
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at", description="Champ de tri"),
    order: str = Query("desc", description="Ordre: asc, desc"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les coursiers disponibles pour l'entreprise
    """
    return get_business_couriers(
        db, current_user.id, status, vehicle_type, search,
        page, limit, sort, order
    )

@router.get("/couriers/{courier_id}", response_model=BusinessCourierResponse)
async def get_courier_details(
    courier_id: int,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les détails d'un coursier
    """
    courier = db.query(User).filter(
        User.id == courier_id,
        User.role == UserRole.courier
    ).first()
    
    if not courier:
        raise HTTPException(status_code=404, detail="Coursier non trouvé")
    
    # Calculer les statistiques du coursier
    stats = db.query(
        func.count(Delivery.id).label('total_deliveries'),
        func.count(Delivery.id).filter(Delivery.status == 'completed').label('completed_deliveries'),
        func.sum(Delivery.final_price).label('total_earnings')
    ).filter(Delivery.courier_id == courier_id).first()
    
    return {
        **courier.__dict__,
        'stats': {
            'total_deliveries': stats.total_deliveries or 0,
            'completed_deliveries': stats.completed_deliveries or 0,
            'total_earnings': stats.total_earnings or 0,
            'average_rating': 4.5,  # À calculer depuis les évaluations
            'ratings_count': 0
        }
    }

@router.post("/couriers/invite")
async def invite_courier_endpoint(
    invite_data: BusinessInviteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Inviter un coursier à rejoindre l'entreprise
    """
    return invite_courier(db, current_user.id, invite_data, background_tasks)

@router.post("/couriers/{courier_id}/favorite")
async def toggle_courier_favorite_endpoint(
    courier_id: int,
    is_favorite: bool,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Ajouter/retirer un coursier des favoris
    """
    return toggle_courier_favorite(db, current_user.id, courier_id, is_favorite)

@router.get("/vehicles", response_model=List[Dict[str, Any]])
async def get_vehicles(
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les véhicules de l'entreprise
    """
    if not current_user.business_profile:
        raise HTTPException(status_code=404, detail="Profil d'entreprise non trouvé")
    
    vehicles = db.query(Vehicle).filter(
        Vehicle.business_id == current_user.business_profile.id
    ).all()
    
    return [
        {
            **vehicle.__dict__,
            'assigned_couriers': len(vehicle.courier_vehicles)
        }
        for vehicle in vehicles
    ]

@router.post("/vehicles")
async def create_vehicle(
    vehicle_data: Dict[str, Any],
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau véhicule pour l'entreprise
    """
    if not current_user.business_profile:
        raise HTTPException(status_code=404, detail="Profil d'entreprise non trouvé")
    
    vehicle = Vehicle(
        business_id=current_user.business_profile.id,
        **vehicle_data
    )
    
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    
    return vehicle

@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(
    vehicle_id: int,
    vehicle_data: Dict[str, Any],
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un véhicule
    """
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.business_id == current_user.business_profile.id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    
    for field, value in vehicle_data.items():
        if hasattr(vehicle, field):
            setattr(vehicle, field, value)
    
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Supprimer un véhicule
    """
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id,
        Vehicle.business_id == current_user.business_profile.id
    ).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Véhicule non trouvé")
    
    # Vérifier qu'aucun coursier n'utilise ce véhicule
    active_assignments = db.query(CourierVehicle).filter(
        CourierVehicle.vehicle_id == vehicle_id
    ).count()
    
    if active_assignments > 0:
        raise HTTPException(
            status_code=400,
            detail="Ce véhicule est encore assigné à des coursiers"
        )
    
    db.delete(vehicle)
    db.commit()
    
    return {"message": "Véhicule supprimé avec succès"}

@router.get("/finances", response_model=BusinessFinancesResponse)
async def get_finances(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les données financières de l'entreprise
    """
    return get_business_finances(db, current_user.id, start_date, end_date)

@router.get("/settings", response_model=BusinessSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer les paramètres de l'entreprise
    """
    if not current_user.business_profile:
        raise HTTPException(status_code=404, detail="Profil d'entreprise non trouvé")
    
    return {
        "business_profile": current_user.business_profile,
        "user_settings": {
            "language": current_user.language_preference,
            "notifications": True,  # À implémenter avec un modèle de préférences
            "auto_assign": False
        }
    }

@router.put("/settings")
async def update_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour les paramètres de l'entreprise
    """
    return update_business_settings(db, current_user.id, settings_data)

@router.post("/logo")
async def upload_logo(
    logo: UploadFile = File(...),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Télécharger le logo de l'entreprise
    """
    if not current_user.business_profile:
        raise HTTPException(status_code=404, detail="Profil d'entreprise non trouvé")
    
    # Vérifier le type de fichier
    if not logo.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    # Sauvegarder le fichier (à implémenter avec un service de stockage)
    logo_url = f"/uploads/business/{current_user.id}/logo.{logo.filename.split('.')[-1]}"
    
    # Mettre à jour le profil
    current_user.business_profile.logo_url = logo_url
    db.commit()
    
    return {"logo_url": logo_url}

@router.get("/export/deliveries")
async def export_deliveries(
    format: str = Query("csv", description="Format: csv, excel"),
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Exporter les livraisons au format CSV ou Excel
    """
    # Construire la requête
    query = db.query(Delivery).filter(Delivery.client_id == current_user.id)
    
    if status:
        query = query.filter(Delivery.status == status)
    if start_date:
        query = query.filter(Delivery.created_at >= start_date)
    if end_date:
        query = query.filter(Delivery.created_at <= end_date)
    
    deliveries = query.all()
    
    # Générer le CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # En-têtes
    writer.writerow([
        'ID', 'Status', 'Pickup Address', 'Delivery Address',
        'Price', 'Created At', 'Completed At', 'Courier'
    ])
    
    # Données
    for delivery in deliveries:
        writer.writerow([
            delivery.id,
            delivery.status,
            delivery.pickup_address,
            delivery.delivery_address,
            delivery.final_price or delivery.proposed_price,
            delivery.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            delivery.completed_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.completed_at else '',
            delivery.courier.full_name if delivery.courier else ''
        ])
    
    output.seek(0)
    
    return {
        "content": output.getvalue(),
        "filename": f"deliveries_{datetime.now().strftime('%Y%m%d')}.csv"
    }

@router.get("/analytics")
async def get_analytics(
    metric: str = Query(..., description="Métrique: revenue, deliveries, performance"),
    period: str = Query("month", description="Période: week, month, quarter, year"),
    current_user: User = Depends(get_current_business_or_manager),
    db: Session = Depends(get_db)
):
    """
    Récupérer des analyses détaillées
    """
    # Période de calcul
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    if metric == "revenue":
        # Revenus par jour
        daily_revenue = db.query(
            func.date(Delivery.completed_at).label('date'),
            func.sum(Delivery.final_price).label('revenue')
        ).filter(
            Delivery.client_id == current_user.id,
            Delivery.status == 'completed',
            Delivery.completed_at >= start_date
        ).group_by(func.date(Delivery.completed_at)).all()
        
        return {
            "labels": [str(item.date) for item in daily_revenue],
            "data": [float(item.revenue or 0) for item in daily_revenue]
        }
    
    elif metric == "deliveries":
        # Livraisons par statut
        status_counts = db.query(
            Delivery.status,
            func.count(Delivery.id).label('count')
        ).filter(
            Delivery.client_id == current_user.id,
            Delivery.created_at >= start_date
        ).group_by(Delivery.status).all()
        
        return {
            "labels": [item.status for item in status_counts],
            "data": [item.count for item in status_counts]
        }
    
    elif metric == "performance":
        # Performance des coursiers
        courier_performance = db.query(
            User.full_name,
            func.count(Delivery.id).label('deliveries'),
            func.avg(func.extract('epoch', Delivery.delivered_at - Delivery.pickup_at) / 60).label('avg_time')
        ).join(Delivery, User.id == Delivery.courier_id).filter(
            Delivery.client_id == current_user.id,
            Delivery.status == 'completed',
            Delivery.completed_at >= start_date
        ).group_by(User.id, User.full_name).all()
        
        return {
            "couriers": [item.full_name for item in courier_performance],
            "deliveries": [item.deliveries for item in courier_performance],
            "avg_time": [float(item.avg_time or 0) for item in courier_performance]
        }
    
    else:
        raise HTTPException(status_code=400, detail="Métrique non supportée")
