from typing import Tuple, List, Dict, Any, Optional
import requests
import math
import json
from datetime import datetime, timedelta

from ..core.config import settings

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculer la distance entre deux points GPS en kilomètres.
    Utilise la formule de Haversine.
    """
    # Rayon de la Terre en kilomètres
    R = 6371.0
    
    # Convertir les degrés en radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Différence de longitude et latitude
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    # Formule de Haversine
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance

def calculate_duration(distance: float, traffic_factor: float = 1.0) -> int:
    """
    Calculer la durée estimée en minutes pour parcourir une distance en kilomètres.
    Prend en compte un facteur de trafic (1.0 = normal, > 1.0 = trafic dense).
    """
    # Vitesse moyenne en km/h (ajustée pour Abidjan)
    average_speed = 30.0 / traffic_factor
    
    # Durée en heures
    duration_hours = distance / average_speed
    
    # Convertir en minutes
    duration_minutes = int(duration_hours * 60)
    
    return duration_minutes

def calculate_distance_and_duration(
    pickup_lat: Optional[float],
    pickup_lng: Optional[float],
    delivery_lat: Optional[float],
    delivery_lng: Optional[float],
    traffic_factor: float = 1.0
) -> Tuple[Optional[float], Optional[int]]:
    """
    Calculer la distance et la durée estimée entre deux points.
    Retourne (distance en km, durée en minutes).
    """
    # Si les coordonnées ne sont pas fournies, retourner None
    if not pickup_lat or not pickup_lng or not delivery_lat or not delivery_lng:
        return None, None
    
    # Calculer la distance
    distance = calculate_distance(pickup_lat, pickup_lng, delivery_lat, delivery_lng)
    
    # Calculer la durée
    duration = calculate_duration(distance, traffic_factor)
    
    return distance, duration

async def geocode_address(address: str, commune: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Convertir une adresse en coordonnées GPS.
    """
    # Construire l'adresse complète
    full_address = f"{address}, {commune}, Abidjan, Côte d'Ivoire"
    
    # Appeler l'API de géocodage (OpenStreetMap Nominatim)
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": full_address,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "LivraisonAbidjanApp/1.0"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        
        if data and len(data) > 0:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])
            return lat, lon
        else:
            return None, None
    except Exception as e:
        print(f"Erreur lors du géocodage: {str(e)}")
        return None, None

async def reverse_geocode(lat: float, lng: float) -> Dict[str, Any]:
    """
    Convertir des coordonnées GPS en adresse.
    """
    # Appeler l'API de géocodage inverse (OpenStreetMap Nominatim)
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lng,
        "format": "json"
    }
    headers = {
        "User-Agent": "LivraisonAbidjanApp/1.0"
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        
        if "address" in data:
            return {
                "address": data.get("display_name", ""),
                "commune": data.get("address", {}).get("suburb", ""),
                "city": data.get("address", {}).get("city", "Abidjan"),
                "country": data.get("address", {}).get("country", "Côte d'Ivoire")
            }
        else:
            return {
                "address": "Adresse inconnue",
                "commune": "",
                "city": "Abidjan",
                "country": "Côte d'Ivoire"
            }
    except Exception as e:
        print(f"Erreur lors du géocodage inverse: {str(e)}")
        return {
            "address": "Erreur de géocodage",
            "commune": "",
            "city": "Abidjan",
            "country": "Côte d'Ivoire"
        }

async def get_traffic_info(lat: float, lng: float, radius: float = 1.0) -> Dict[str, Any]:
    """
    Obtenir les informations de trafic autour d'un point.
    """
    # Dans un environnement réel, on utiliserait une API de trafic
    # Pour le développement, on simule des données de trafic
    
    # Générer un facteur de trafic aléatoire entre 1.0 et 2.0
    import random
    traffic_factor = 1.0 + random.random()
    
    return {
        "traffic_factor": traffic_factor,
        "congestion_level": "medium" if traffic_factor < 1.5 else "high",
        "last_updated": datetime.now().isoformat()
    }

async def find_nearest_couriers(lat: float, lng: float, max_distance: float = 5.0, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Trouver les coursiers les plus proches d'un point.
    """
    # Dans un environnement réel, on interrogerait la base de données
    # Pour le développement, on simule des données
    
    # Simuler des coursiers à proximité
    import random
    
    couriers = []
    for i in range(limit):
        # Générer des coordonnées aléatoires dans un rayon de max_distance
        distance = random.uniform(0.1, max_distance)
        bearing = random.uniform(0, 360)
        
        # Convertir distance (km) et bearing (degrés) en delta lat/lng
        earth_radius = 6371.0
        delta_lat = distance * math.cos(math.radians(bearing)) / earth_radius
        delta_lng = distance * math.sin(math.radians(bearing)) / (earth_radius * math.cos(math.radians(lat)))
        
        courier_lat = lat + math.degrees(delta_lat)
        courier_lng = lng + math.degrees(delta_lng)
        
        couriers.append({
            "courier_id": i + 1,
            "distance": distance,
            "lat": courier_lat,
            "lng": courier_lng,
            "estimated_arrival_time": int(distance * 2)  # 2 minutes par km
        })
    
    # Trier par distance
    couriers.sort(key=lambda x: x["distance"])
    
    return couriers
