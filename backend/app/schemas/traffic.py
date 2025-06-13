from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import enum

class TrafficSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    blocked = "blocked"

# Schémas pour les rapports de trafic
class TrafficReportBase(BaseModel):
    lat: float
    lng: float
    commune: str
    severity: TrafficSeverity
    description: Optional[str] = None

# Schéma pour la création d'un rapport de trafic
class TrafficReportCreate(TrafficReportBase):
    pass

# Schéma pour la réponse de rapport de trafic
class TrafficReportResponse(TrafficReportBase):
    id: int
    reporter_id: int
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        from_attributes = True  # Keeping for backwards compatibility

# Schémas pour les alertes météo
class WeatherAlertBase(BaseModel):
    commune: str
    alert_type: str
    severity: str
    description: str
    source: str = "openweathermap"

# Schéma pour la création d'une alerte météo
class WeatherAlertCreate(WeatherAlertBase):
    expires_at: Optional[datetime] = None

# Schéma pour la réponse d'alerte météo
class WeatherAlertResponse(WeatherAlertBase):
    id: int
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
