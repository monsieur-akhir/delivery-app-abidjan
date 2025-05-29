from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..models.user import User, UserRole
from ..core.exceptions import NotFoundError, BadRequestError


def create_traffic_report(
    db: Session,
    user_id: int,
    zone: str,
    traffic_level: str,
    description: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    Crée un nouveau rapport de trafic.
    Pour l'instant, on simule la création.
    """
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    
    # Valider le niveau de trafic
    valid_levels = ["low", "moderate", "heavy", "blocked"]
    if traffic_level not in valid_levels:
        raise BadRequestError(f"Niveau de trafic invalide. Valeurs autorisées: {', '.join(valid_levels)}")
    
    # Simulation de la création du rapport
    report = {
        "id": 123,  # ID simulé
        "user_id": user_id,
        "user_name": user.full_name,
        "zone": zone,
        "traffic_level": traffic_level,
        "description": description,
        "latitude": lat,
        "longitude": lng,
        "status": "active",
        "votes_count": 1,  # L'utilisateur qui crée vote automatiquement
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=2)).isoformat()
    }
    
    return report


def get_traffic_reports(
    db: Session,
    zone: Optional[str] = None,
    traffic_level: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Récupère la liste des rapports de trafic.
    Pour l'instant, on retourne des données simulées.
    """
    # Données simulées de rapports de trafic
    sample_reports = [
        {
            "id": 1,
            "user_id": 1,
            "user_name": "Jean Dupont",
            "zone": "Plateau",
            "traffic_level": "heavy",
            "description": "Embouteillage important sur le Boulevard de la République",
            "latitude": 5.3364,
            "longitude": -4.0267,
            "status": "active",
            "votes_count": 15,
            "created_at": "2024-01-15T08:30:00Z",
            "expires_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "user_id": 2,
            "user_name": "Marie Kouassi",
            "zone": "Cocody",
            "traffic_level": "moderate",
            "description": "Circulation ralentie près de l'Université",
            "latitude": 5.3467,
            "longitude": -3.9875,
            "status": "active",
            "votes_count": 8,
            "created_at": "2024-01-15T09:15:00Z",
            "expires_at": "2024-01-15T11:15:00Z"
        },
        {
            "id": 3,
            "user_id": 3,
            "user_name": "Paul Martin",
            "zone": "Yopougon",
            "traffic_level": "blocked",
            "description": "Route bloquée suite à un accident",
            "latitude": 5.3456,
            "longitude": -4.0785,
            "status": "active",
            "votes_count": 25,
            "created_at": "2024-01-15T07:45:00Z",
            "expires_at": "2024-01-15T09:45:00Z"
        },
        {
            "id": 4,
            "user_id": 4,
            "user_name": "Aisha Traore",
            "zone": "Treichville",
            "traffic_level": "low",
            "description": "Circulation fluide",
            "latitude": 5.2894,
            "longitude": -4.0167,
            "status": "expired",
            "votes_count": 3,
            "created_at": "2024-01-14T16:20:00Z",
            "expires_at": "2024-01-14T18:20:00Z"
        }
    ]
    
    reports = sample_reports.copy()
    
    # Filtrer par zone si spécifiée
    if zone:
        reports = [report for report in reports if report["zone"].lower() == zone.lower()]
    
    # Filtrer par niveau de trafic si spécifié
    if traffic_level:
        reports = [report for report in reports if report["traffic_level"] == traffic_level]
    
    # Filtrer les rapports actifs seulement si demandé
    if active_only:
        reports = [report for report in reports if report["status"] == "active"]
    
    # Trier par date de création (plus récent en premier)
    reports.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Pagination simple
    start_idx = skip
    end_idx = skip + limit
    
    return reports[start_idx:end_idx]


def get_traffic_zones(db: Session) -> List[Dict[str, Any]]:
    """
    Récupère la liste des zones de trafic avec leurs statistiques.
    """
    # Zones principales d'Abidjan avec leurs coordonnées approximatives
    zones = [
        {
            "name": "Plateau",
            "center_lat": 5.3364,
            "center_lng": -4.0267,
            "current_level": "heavy",
            "reports_count": 15,
            "last_update": "2024-01-15T08:30:00Z"
        },
        {
            "name": "Cocody",
            "center_lat": 5.3467,
            "center_lng": -3.9875,
            "current_level": "moderate",
            "reports_count": 8,
            "last_update": "2024-01-15T09:15:00Z"
        },
        {
            "name": "Yopougon",
            "center_lat": 5.3456,
            "center_lng": -4.0785,
            "current_level": "blocked",
            "reports_count": 25,
            "last_update": "2024-01-15T07:45:00Z"
        },
        {
            "name": "Treichville",
            "center_lat": 5.2894,
            "center_lng": -4.0167,
            "current_level": "low",
            "reports_count": 3,
            "last_update": "2024-01-15T10:00:00Z"
        },
        {
            "name": "Marcory",
            "center_lat": 5.2789,
            "center_lng": -4.0056,
            "current_level": "moderate",
            "reports_count": 6,
            "last_update": "2024-01-15T09:30:00Z"
        },
        {
            "name": "Adjamé",
            "center_lat": 5.3678,
            "center_lng": -4.0234,
            "current_level": "heavy",
            "reports_count": 12,
            "last_update": "2024-01-15T08:45:00Z"
        }
    ]
    
    return zones


def create_weather_alert(
    db: Session,
    user_id: int,
    alert_type: str,
    zone: str,
    description: str,
    severity: str = "medium"
) -> Dict[str, Any]:
    """
    Crée une nouvelle alerte météo.
    """
    # Vérifier que l'utilisateur existe et est un gestionnaire
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    
    if user.role != UserRole.manager:
        raise BadRequestError("Seuls les gestionnaires peuvent créer des alertes météo")
    
    # Valider le type d'alerte
    valid_types = ["rain", "storm", "flood", "wind", "heat", "other"]
    if alert_type not in valid_types:
        raise BadRequestError(f"Type d'alerte invalide. Valeurs autorisées: {', '.join(valid_types)}")
    
    # Valider la sévérité
    valid_severities = ["low", "medium", "high", "critical"]
    if severity not in valid_severities:
        raise BadRequestError(f"Sévérité invalide. Valeurs autorisées: {', '.join(valid_severities)}")
    
    # Simulation de la création de l'alerte
    alert = {
        "id": 456,  # ID simulé
        "user_id": user_id,
        "alert_type": alert_type,
        "zone": zone,
        "description": description,
        "severity": severity,
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=6)).isoformat()
    }
    
    return alert


def get_weather_alerts(
    db: Session,
    zone: Optional[str] = None,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Récupère la liste des alertes météo.
    """
    # Données simulées d'alertes météo
    sample_alerts = [
        {
            "id": 1,
            "user_id": 1,
            "alert_type": "rain",
            "zone": "Plateau",
            "description": "Fortes pluies prévues dans l'après-midi",
            "severity": "medium",
            "status": "active",
            "created_at": "2024-01-15T06:00:00Z",
            "expires_at": "2024-01-15T18:00:00Z"
        },
        {
            "id": 2,
            "user_id": 1,
            "alert_type": "flood",
            "zone": "Yopougon",
            "description": "Risque d'inondation suite aux pluies",
            "severity": "high",
            "status": "active",
            "created_at": "2024-01-15T07:30:00Z",
            "expires_at": "2024-01-15T19:30:00Z"
        },
        {
            "id": 3,
            "user_id": 1,
            "alert_type": "wind",
            "zone": "Cocody",
            "description": "Vents forts attendus",
            "severity": "low",
            "status": "expired",
            "created_at": "2024-01-14T14:00:00Z",
            "expires_at": "2024-01-14T20:00:00Z"
        }
    ]
    
    alerts = sample_alerts.copy()
    
    # Filtrer par zone si spécifiée
    if zone:
        alerts = [alert for alert in alerts if alert["zone"].lower() == zone.lower()]
    
    # Filtrer par type d'alerte si spécifié
    if alert_type:
        alerts = [alert for alert in alerts if alert["alert_type"] == alert_type]
    
    # Filtrer par sévérité si spécifiée
    if severity:
        alerts = [alert for alert in alerts if alert["severity"] == severity]
    
    # Filtrer les alertes actives seulement si demandé
    if active_only:
        alerts = [alert for alert in alerts if alert["status"] == "active"]
    
    # Trier par date de création (plus récent en premier)
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Pagination simple
    start_idx = skip
    end_idx = skip + limit
    
    return alerts[start_idx:end_idx]


def get_weather_forecast(
    zone: Optional[str] = None,
    days: int = 3
) -> Dict[str, Any]:
    """
    Récupère les prévisions météo pour une zone.
    Pour l'instant, on retourne des données simulées.
    """
    # Données simulées de prévisions météo
    base_date = datetime.utcnow().date()
    
    forecast_days = []
    for i in range(days):
        date = base_date + timedelta(days=i)
        day_forecast = {
            "date": date.isoformat(),
            "temperature_min": 24 + (i * 2),
            "temperature_max": 32 + (i * 1),
            "humidity": 75 - (i * 5),
            "rain_probability": max(20, 60 - (i * 15)),
            "wind_speed": 15 + (i * 2),
            "conditions": ["sunny", "partly_cloudy", "rainy"][i % 3],
            "description": [
                "Ensoleillé avec quelques nuages",
                "Partiellement nuageux",
                "Averses possibles dans l'après-midi"
            ][i % 3]
        }
        forecast_days.append(day_forecast)
    
    return {
        "zone": zone or "Abidjan",
        "forecast": forecast_days,
        "last_updated": datetime.utcnow().isoformat()
    }


def vote_traffic_report(
    db: Session,
    user_id: int,
    report_id: int,
    vote_type: str
) -> Dict[str, Any]:
    """
    Permet à un utilisateur de voter sur un rapport de trafic.
    """
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("Utilisateur non trouvé")
    
    # Valider le type de vote
    if vote_type not in ["confirm", "deny"]:
        raise BadRequestError("Type de vote invalide. Valeurs autorisées: confirm, deny")
    
    # Pour l'instant, on simule le vote
    # Dans une vraie implémentation, on vérifierait si l'utilisateur a déjà voté
    # et on mettrait à jour la base de données
    
    return {
        "report_id": report_id,
        "user_id": user_id,
        "vote_type": vote_type,
        "created_at": datetime.utcnow().isoformat(),
        "message": f"Vote '{vote_type}' enregistré pour le rapport #{report_id}"
    }


def get_traffic_statistics(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Récupère les statistiques de trafic.
    """
    # Date par défaut: dernière semaine
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=7)
    
    # Données simulées de statistiques
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "reports": {
            "total": 156,
            "by_level": {
                "low": 45,
                "moderate": 67,
                "heavy": 32,
                "blocked": 12
            },
            "by_zone": {
                "Plateau": 35,
                "Cocody": 28,
                "Yopougon": 31,
                "Treichville": 22,
                "Marcory": 19,
                "Adjamé": 21
            }
        },
        "alerts": {
            "total": 23,
            "by_type": {
                "rain": 12,
                "flood": 6,
                "wind": 3,
                "storm": 2
            },
            "by_severity": {
                "low": 8,
                "medium": 10,
                "high": 4,
                "critical": 1
            }
        },
        "average_response_time": 15,  # en minutes
        "most_affected_zone": "Plateau",
        "peak_hours": ["07:00-09:00", "17:00-19:00"]
    }
