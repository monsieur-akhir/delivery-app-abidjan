from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..db.session import get_db
from ..core.dependencies import get_current_user, get_current_active_user
from ..schemas.traffic import (
    TrafficReportCreate, TrafficReportResponse,
    WeatherAlertCreate, WeatherAlertResponse
)
from ..schemas.user import UserResponse
from ..services.traffic import (
    create_traffic_report, get_traffic_reports, get_traffic_zones,
    create_weather_alert, get_weather_alerts, get_weather_forecast
)
from ..services.notification import send_traffic_notification
from ..models.user import UserRole

router = APIRouter()

@router.post("/report", response_model=TrafficReportResponse, status_code=status.HTTP_201_CREATED)
async def create_new_traffic_report(
    report: TrafficReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer un nouveau rapport de trafic.
    """
    # Créer le rapport de trafic
    db_report = create_traffic_report(db, current_user.id, report)
    
    # Notifier les coursiers à proximité
    background_tasks.add_task(
        send_traffic_notification,
        db=db,
        commune=report.commune,
        severity=report.severity,
        lat=report.lat,
        lng=report.lng
    )
    
    return db_report

@router.get("/reports", response_model=List[TrafficReportResponse])
async def read_traffic_reports(
    commune: Optional[str] = None,
    severity: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des rapports de trafic.
    """
    return get_traffic_reports(
        db,
        commune=commune,
        severity=severity,
        active_only=active_only,
        skip=skip,
        limit=limit
    )

@router.get("/zones", response_model=List[dict])
async def read_traffic_zones(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les zones de trafic congestionné.
    """
    return get_traffic_zones(db)

@router.post("/weather/alerts", response_model=WeatherAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_new_weather_alert(
    alert: WeatherAlertCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Créer une nouvelle alerte météo.
    Seuls les gestionnaires peuvent créer des alertes météo manuelles.
    """
    if alert.source == "manual" and current_user.role != UserRole.manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les gestionnaires peuvent créer des alertes météo manuelles"
        )
    
    # Créer l'alerte météo
    db_alert = create_weather_alert(db, alert)
    
    # Notifier les utilisateurs dans la commune concernée
    background_tasks.add_task(
        send_traffic_notification,
        db=db,
        commune=alert.commune,
        message=f"Alerte météo: {alert.description}",
        alert_type="weather"
    )
    
    return db_alert

@router.get("/weather/alerts", response_model=List[WeatherAlertResponse])
async def read_weather_alerts(
    commune: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer la liste des alertes météo.
    """
    return get_weather_alerts(db, commune=commune, active_only=active_only)

@router.get("/weather/forecast/{commune}")
async def read_weather_forecast(
    commune: str,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Récupérer les prévisions météo pour une commune.
    """
    return get_weather_forecast(commune)
