from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import json
from fastapi.responses import JSONResponse

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..models.user import User, UserRole
from ..schemas.user import UserResponse
from ..schemas.delivery import DeliveryResponse
from ..schemas.collaborative import (
    CollaborativeDeliveryResponse, CollaborativeMessageResponse,
    CollaborativeDeliveryCreate, CollaborativeMessageCreate,
    JoinDeliveryRequest
)
from ..services.delivery import get_courier_deliveries, update_delivery_status, get_available_deliveries
from ..services.collaborative_service import (
    get_collaborative_deliveries, get_collaborative_delivery_details,
    join_collaborative_delivery, send_collaborative_message,
    calculate_collaborative_earnings, get_collaborative_stats
)
from ..services.notification import send_delivery_notification
from .. import models, schemas

router = APIRouter()

@router.get("/deliveries", response_model=List[DeliveryResponse])
async def read_courier_deliveries(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les livraisons d'un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    return get_courier_deliveries(db, current_user.id, status, start_date, end_date, skip, limit)

@router.get("/collaborative-deliveries", response_model=List[Dict[str, Any]])
async def read_collaborative_deliveries(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les livraisons collaboratives disponibles pour un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    return get_collaborative_deliveries(db, skip, limit, status)

@router.get("/collaborative-deliveries/{delivery_id}", response_model=Dict[str, Any])
async def read_collaborative_delivery_details(
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les détails d'une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    return get_collaborative_delivery_details(db, delivery_id)

@router.post("/collaborative-deliveries/{delivery_id}/join", response_model=CollaborativeDeliveryResponse)
async def join_collaborative_delivery_endpoint(
    join_request: JoinDeliveryRequest,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Rejoindre une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    try:
        collaboration = join_collaborative_delivery(db, delivery_id, current_user.id, join_request)

        # Envoyer une notification au client
        if background_tasks:
            delivery = get_delivery(db, delivery_id)
            if delivery and delivery.client_id:
                message = f"Le coursier {current_user.full_name} a rejoint votre livraison collaborative #{delivery_id} en tant que {join_request.role.value}."
                background_tasks.add_task(
                    send_delivery_notification,
                    db=db,
                    user_id=delivery.client_id,
                    message=message
                )

        return collaboration
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/collaborative-deliveries/{delivery_id}/message", response_model=CollaborativeMessageResponse)
async def send_collaborative_message_endpoint(
    message_data: CollaborativeMessageCreate,
    delivery_id: int = Path(..., title="ID de la livraison collaborative"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Envoyer un message dans le chat d'une livraison collaborative.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    try:
        message = send_collaborative_message(db, delivery_id, current_user.id, message_data)

        # Envoyer des notifications aux autres participants
        if background_tasks:
            delivery_details = get_collaborative_delivery_details(db, delivery_id)
            for collaborator in delivery_details["collaborators"]:
                if collaborator["courier_id"] != current_user.id:
                    notification_message = f"Nouveau message de {current_user.full_name} dans la livraison collaborative #{delivery_id}"
                    background_tasks.add_task(
                        send_delivery_notification,
                        db=db,
                        user_id=collaborator["courier_id"],
                        message=notification_message
                    )

        return message
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/collaborative-stats", response_model=Dict[str, Any])
async def get_courier_collaborative_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les statistiques des livraisons collaboratives pour un coursier.
    """
    if current_user.role != UserRole.courier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les coursiers peuvent accéder à cette route"
        )

    return get_collaborative_stats(db, current_user.id)

@router.get("/profile")
async def get_courier_profile(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le profil du coursier"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "is_verified": current_user.is_verified,
        "is_online": current_user.is_online,
        "created_at": current_user.created_at
    }

@router.get("/status")
async def get_courier_status(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer le statut du coursier"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    return {
        "is_online": current_user.is_online or False,
        "last_active": current_user.last_active_at,
        "current_location": {
            "lat": current_user.current_lat,
            "lng": current_user.current_lng
        } if current_user.current_lat and current_user.current_lng else None
    }

@router.post("/status")
async def update_courier_status(
    status_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le statut du coursier"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    is_online = status_data.get("is_online")
    location = status_data.get("location")

    if is_online is not None:
        current_user.is_online = is_online
        current_user.last_active_at = datetime.utcnow()

    if location:
        current_user.current_lat = location.get("lat")
        current_user.current_lng = location.get("lng")

    db.commit()

    return {
        "message": "Statut mis à jour",
        "is_online": current_user.is_online,
        "last_active": current_user.last_active_at
    }

@router.get("/stats")
async def get_courier_stats(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les statistiques du coursier"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    today = datetime.utcnow().date()

    # Statistiques générales
    total_deliveries = db.query(models.Delivery).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status == "completed"
    ).count()

    # Statistiques d'aujourd'hui
    completed_today = db.query(models.Delivery).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status == "completed",
        func.date(models.Delivery.completed_at) == today
    ).count()

    # Gains d'aujourd'hui
    earnings_today = db.query(func.sum(models.Delivery.final_price)).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status == "completed",
        func.date(models.Delivery.completed_at) == today
    ).scalar() or 0

    # Gains totaux
    total_earnings = db.query(func.sum(models.Delivery.final_price)).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status == "completed"
    ).scalar() or 0

    # Note moyenne
    average_rating = db.query(func.avg(models.Rating.score)).filter(
        models.Rating.rated_user_id == current_user.id
    ).scalar() or 0

    # Livraisons en cours
    active_deliveries = db.query(models.Delivery).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status.in_(["accepted", "picked_up", "in_transit"])
    ).count()

    return {
        "total_deliveries": total_deliveries,
        "completed_today": completed_today,
        "earnings_today": float(earnings_today),
        "total_earnings": float(total_earnings),
        "average_rating": float(average_rating),
        "active_deliveries": active_deliveries,
        "current_earnings": float(total_earnings)  # Alias pour compatibilité
    }

@router.get("/earnings")
async def get_courier_earnings(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    period: str = "week"  # week, month, year
):
    """Récupérer les gains du coursier par période"""
    if current_user.role != "courier":
        raise HTTPException(status_code=403, detail="Accès réservé aux coursiers")

    # Calculer la période
    end_date = datetime.utcnow()
    if period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    elif period == "year":
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=7)

    # Récupérer les livraisons complétées dans la période
    deliveries = db.query(models.Delivery).filter(
        models.Delivery.courier_id == current_user.id,
        models.Delivery.status == "completed",
        models.Delivery.completed_at >= start_date,
        models.Delivery.completed_at <= end_date
    ).all()

    total_earnings = sum(float(d.final_price) for d in deliveries if d.final_price)
    total_deliveries = len(deliveries)

    # Grouper par jour
    daily_earnings = {}
    for delivery in deliveries:
        date_key = delivery.completed_at.date().isoformat()
        if date_key not in daily_earnings:
            daily_earnings[date_key] = {"earnings": 0, "deliveries": 0}
        daily_earnings[date_key]["earnings"] += float(delivery.final_price) if delivery.final_price else 0
        daily_earnings[date_key]["deliveries"] += 1

    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_earnings": total_earnings,
        "total_deliveries": total_deliveries,
        "average_per_delivery": total_earnings / total_deliveries if total_deliveries > 0 else 0,
        "daily_breakdown": daily_earnings
    }

@router.get("/available-deliveries", response_model=List[DeliveryResponse])
async def get_available_deliveries_route(
    commune: Optional[str] = None,
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: float = Query(5.0),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir les livraisons disponibles pour le coursier.
    """
    deliveries = get_available_deliveries(db, current_user.id, commune, skip, limit, lat, lng, radius_km)
    result = []
    for d in deliveries:
        delivery_dict = d.__dict__.copy()
        # Relations: client, courier, vehicle
        if hasattr(d, 'client') and d.client:
            delivery_dict['client'] = {
                'id': d.client.id,
                'full_name': d.client.full_name,
                'phone': d.client.phone,
                'email': d.client.email,
                'profile_picture': d.client.profile_picture,
            }
        else:
            delivery_dict['client'] = None
        if hasattr(d, 'courier') and d.courier:
            delivery_dict['courier'] = {
                'id': d.courier.id,
                'full_name': d.courier.full_name,
                'phone': d.courier.phone,
                'email': d.courier.email,
                'profile_picture': d.courier.profile_picture,
            }
        else:
            delivery_dict['courier'] = None
        if hasattr(d, 'vehicle') and d.vehicle:
            delivery_dict['vehicle'] = {
                'id': d.vehicle.id,
                'type': getattr(d.vehicle, 'type', None),
                'plate': getattr(d.vehicle, 'plate', None),
            }
        else:
            delivery_dict['vehicle'] = None
        result.append(delivery_dict)
    return result

@router.get("/communes")
async def get_communes():
    """Retourne la liste des communes disponibles pour le filtrage des livraisons."""
    try:
        # Utiliser un chemin absolu depuis la racine du projet
        current_dir = os.path.dirname(os.path.abspath(__file__))
        communes_path = os.path.join(current_dir, '..', 'data', 'communes.json')
        
        print(f"🔍 [DEBUG] Chemin du fichier communes: {communes_path}")
        print(f"🔍 [DEBUG] Fichier existe: {os.path.exists(communes_path)}")
        
        with open(communes_path, encoding='utf-8') as f:
            communes = json.load(f)
        
        print(f"✅ [DEBUG] Communes chargées: {len(communes)} communes")
        return communes
    except Exception as e:
        print(f"❌ [DEBUG] Erreur lors du chargement des communes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du chargement des communes: {str(e)}")