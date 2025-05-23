from typing import Dict, Any, List, Optional
import requests
import json
from datetime import datetime, timedelta

from ..core.config import settings

async def get_weather_forecast(commune: str) -> Dict[str, Any]:
    """
    Récupère les prévisions météo pour une commune d'Abidjan.
    """
    # Coordonnées approximatives des communes d'Abidjan
    commune_coordinates = {
        "Abobo": {"lat": 5.4414, "lon": -4.0444},
        "Adjamé": {"lat": 5.3667, "lon": -4.0167},
        "Attécoubé": {"lat": 5.3333, "lon": -4.0333},
        "Cocody": {"lat": 5.3600, "lon": -3.9678},
        "Koumassi": {"lat": 5.3000, "lon": -3.9500},
        "Marcory": {"lat": 5.3000, "lon": -3.9833},
        "Plateau": {"lat": 5.3167, "lon": -4.0167},
        "Port-Bouët": {"lat": 5.2500, "lon": -3.9333},
        "Treichville": {"lat": 5.2833, "lon": -4.0000},
        "Yopougon": {"lat": 5.3167, "lon": -4.0833}
    }
    
    # Vérifier si la commune est valide
    if commune not in commune_coordinates:
        return {
            "error": "Commune non reconnue",
            "valid_communes": list(commune_coordinates.keys())
        }
    
    # Récupérer les coordonnées
    coordinates = commune_coordinates[commune]
    
    # Appeler l'API OpenWeatherMap
    url = "https://api.openweathermap.org/data/2.5/onecall"
    params = {
        "lat": coordinates["lat"],
        "lon": coordinates["lon"],
        "exclude": "minutely,hourly",
        "units": "metric",
        "lang": "fr",
        "appid": settings.OPENWEATHERMAP_API_KEY
    }
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            # Formater les données
            current = data.get("current", {})
            daily = data.get("daily", [])
            
            # Préparer les prévisions quotidiennes
            daily_forecasts = []
            for day in daily[:5]:  # Limiter à 5 jours
                date = datetime.fromtimestamp(day.get("dt", 0))
                daily_forecasts.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "day_name": date.strftime("%A"),
                    "temp_min": round(day.get("temp", {}).get("min", 0)),
                    "temp_max": round(day.get("temp", {}).get("max", 0)),
                    "humidity": day.get("humidity", 0),
                    "wind_speed": day.get("wind_speed", 0),
                    "weather": day.get("weather", [{}])[0].get("main", ""),
                    "weather_description": day.get("weather", [{}])[0].get("description", ""),
                    "weather_icon": day.get("weather", [{}])[0].get("icon", ""),
                    "rain": day.get("rain", 0),
                    "pop": day.get("pop", 0) * 100  # Probabilité de précipitation en %
                })
            
            # Déterminer les alertes météo
            alerts = []
            if "alerts" in data:
                for alert in data["alerts"]:
                    alerts.append({
                        "event": alert.get("event", ""),
                        "description": alert.get("description", ""),
                        "start": datetime.fromtimestamp(alert.get("start", 0)).strftime("%Y-%m-%d %H:%M"),
                        "end": datetime.fromtimestamp(alert.get("end", 0)).strftime("%Y-%m-%d %H:%M")
                    })
            
            # Déterminer si les conditions sont favorables pour la livraison
            current_weather = current.get("weather", [{}])[0].get("main", "").lower()
            current_rain = current.get("rain", {}).get("1h", 0)
            current_wind = current.get("wind_speed", 0)
            
            is_favorable = True
            unfavorable_reason = None
            
            if current_weather in ["thunderstorm", "rain", "drizzle"] or current_rain > 5:
                is_favorable = False
                unfavorable_reason = "Pluie"
            elif current_wind > 10:
                is_favorable = False
                unfavorable_reason = "Vent fort"
            
            return {
                "commune": commune,
                "current": {
                    "temp": round(current.get("temp", 0)),
                    "feels_like": round(current.get("feels_like", 0)),
                    "humidity": current.get("humidity", 0),
                    "wind_speed": current.get("wind_speed", 0),
                    "weather": current.get("weather", [{}])[0].get("main", ""),
                    "weather_description": current.get("weather", [{}])[0].get("description", ""),
                    "weather_icon": current.get("weather", [{}])[0].get("icon", ""),
                    "rain": current.get("rain", {}).get("1h", 0)
                },
                "daily": daily_forecasts,
                "alerts": alerts,
                "delivery_conditions": {
                    "is_favorable": is_favorable,
                    "unfavorable_reason": unfavorable_reason
                }
            }
        else:
            return {
                "error": f"Erreur OpenWeatherMap: {response.status_code}",
                "message": response.text
            }
    except Exception as e:
        return {
            "error": "Erreur lors de la récupération des prévisions météo",
            "message": str(e)
        }

async def create_weather_alert(db, alert_data):
    """
    Crée une alerte météo dans la base de données.
    """
    from ..models.traffic import WeatherAlert
    
    # Créer l'alerte
    weather_alert = WeatherAlert(
        commune=alert_data.commune,
        alert_type=alert_data.alert_type,
        severity=alert_data.severity,
        description=alert_data.description,
        source=alert_data.source,
        is_active=True,
        expires_at=alert_data.expires_at or datetime.now() + timedelta(hours=24)
    )
    
    db.add(weather_alert)
    db.commit()
    db.refresh(weather_alert)
    
    return weather_alert

async def get_weather_alerts(db, commune=None, active_only=True):
    """
    Récupère les alertes météo de la base de données.
    """
    from ..models.traffic import WeatherAlert
    
    query = db.query(WeatherAlert)
    
    if commune:
        query = query.filter(WeatherAlert.commune == commune)
    
    if active_only:
        query = query.filter(WeatherAlert.is_active == True)
        query = query.filter((WeatherAlert.expires_at > datetime.now()) | (WeatherAlert.expires_at == None))
    
    return query.order_by(WeatherAlert.created_at.desc()).all()

async def update_weather_data():
    """
    Met à jour les données météo pour toutes les communes.
    À exécuter périodiquement via une tâche planifiée.
    """
    db = next(get_db())
    
    # Liste des communes
    communes = settings.COMMUNES
    
    for commune in communes:
        # Récupérer les prévisions météo
        forecast = await get_weather_forecast(commune)
        
        # Vérifier s'il y a des alertes
        if "alerts" in forecast and forecast["alerts"]:
            for alert in forecast["alerts"]:
                # Créer une alerte dans la base de données
                from ..schemas.traffic import WeatherAlertCreate
                
                alert_data = WeatherAlertCreate(
                    commune=commune,
                    alert_type=alert["event"],
                    severity="high" if "thunderstorm" in alert["event"].lower() else "medium",
                    description=alert["description"],
                    source="openweathermap",
                    expires_at=datetime.strptime(alert["end"], "%Y-%m-%d %H:%M")
                )
                
                await create_weather_alert(db, alert_data)
        
        # Vérifier les conditions défavorables
        if not forecast.get("delivery_conditions", {}).get("is_favorable", True):
            reason = forecast.get("delivery_conditions", {}).get("unfavorable_reason", "")
            
            # Créer une alerte pour les conditions défavorables
            from ..schemas.traffic import WeatherAlertCreate
            
            alert_data = WeatherAlertCreate(
                commune=commune,
                alert_type=reason.lower(),
                severity="medium",
                description=f"Conditions météo défavorables: {reason}",
                source="openweathermap",
                expires_at=datetime.now() + timedelta(hours=6)
            )
            
            await create_weather_alert(db, alert_data)
