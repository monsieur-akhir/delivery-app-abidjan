from typing import Dict, Any, List
import httpx
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

async def get_route_directions(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
    """
    Récupérer les directions entre deux points
    """
    try:
        # Utiliser l'API OpenRouteService ou MapBox pour les directions
        # En attendant, simulation des données
        
        # Calcul de la distance approximative (formule haversine simplifiée)
        import math
        
        dlat = math.radians(end_lat - start_lat)
        dlng = math.radians(end_lng - start_lng)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(start_lat)) * math.cos(math.radians(end_lat)) *
             math.sin(dlng / 2) * math.sin(dlng / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = 6371 * c  # Rayon de la Terre en km
        
        # Estimation du temps de trajet (vitesse moyenne de 25 km/h à Abidjan)
        duration = (distance / 25) * 60  # en minutes
        
        return {
            "routes": [{
                "distance": round(distance * 1000),  # en mètres
                "duration": round(duration * 60),    # en secondes
                "geometry": {
                    "coordinates": [
                        [start_lng, start_lat],
                        [end_lng, end_lat]
                    ]
                },
                "steps": [
                    {
                        "instruction": "Départ",
                        "distance": 0,
                        "duration": 0,
                        "location": [start_lng, start_lat]
                    },
                    {
                        "instruction": f"Continuez tout droit pendant {distance:.1f} km",
                        "distance": round(distance * 1000 * 0.8),
                        "duration": round(duration * 60 * 0.8),
                        "location": [(start_lng + end_lng) / 2, (start_lat + end_lat) / 2]
                    },
                    {
                        "instruction": "Arrivée à destination",
                        "distance": round(distance * 1000),
                        "duration": round(duration * 60),
                        "location": [end_lng, end_lat]
                    }
                ]
            }],
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des directions: {e}")
        return {
            "error": f"Impossible de calculer les directions: {str(e)}",
            "status": "error"
        }

async def get_traffic_info(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
    """
    Récupérer les informations de trafic pour un itinéraire
    """
    try:
        directions = await get_route_directions(start_lat, start_lng, end_lat, end_lng)
        
        if "error" in directions:
            return directions
            
        route = directions["routes"][0]
        distance = route["distance"] / 1000  # en km
        duration = route["duration"] / 60    # en minutes
        
        # Calculer la vitesse moyenne
        speed = (distance / duration) * 60 if duration > 0 else 0
        
        # Déterminer le niveau de trafic basé sur la vitesse
        if speed > 30:
            level = "fluide"
            delay = 0
        elif speed > 20:
            level = "modéré"
            delay = duration * 0.2
        elif speed > 10:
            level = "dense"
            delay = duration * 0.5
        else:
            level = "embouteillage"
            delay = duration * 1.0
            
        return {
            "distance": distance,
            "duration": duration,
            "route": route["geometry"],
            "traffic": {
                "level": level,
                "delay": delay,
                "description": f"Trafic {level} - Retard estimé: {int(delay)} minutes"
            }
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos trafic: {e}")
        return {
            "error": f"Impossible de récupérer les informations de trafic: {str(e)}"
        }
