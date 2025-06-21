from typing import Tuple, List, Dict, Any, Optional
import requests
import math
import json
from datetime import datetime, timedelta
import os
from sqlalchemy.orm import Session

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

# Lieux populaires d'Abidjan avec coordonnées précises
POPULAR_PLACES = [
    {
        "id": "airport_abidjan",
        "name": "Aéroport Félix Houphouët-Boigny",
        "address": "Aéroport Félix Houphouët-Boigny, Port-Bouët, Abidjan",
        "latitude": 5.2539,
        "longitude": -3.9263,
        "commune": "Port-Bouët",
        "category": "transport",
        "type": "airport",
        "importance": 10
    },
    {
        "id": "university_ufhb",
        "name": "Université Félix Houphouët-Boigny",
        "address": "Université Félix Houphouët-Boigny, Cocody, Abidjan",
        "latitude": 5.3847,
        "longitude": -3.9883,
        "commune": "Cocody",
        "category": "education",
        "type": "university",
        "importance": 9
    },
    {
        "id": "marche_treichville",
        "name": "Marché de Treichville",
        "address": "Marché de Treichville, Treichville, Abidjan",
        "latitude": 5.2833,
        "longitude": -4.0000,
        "commune": "Treichville",
        "category": "shopping",
        "type": "market",
        "importance": 8
    },
    {
        "id": "playce_marcory",
        "name": "Centre Commercial PlaYce Marcory",
        "address": "Centre Commercial PlaYce Marcory, Marcory, Abidjan",
        "latitude": 5.2956,
        "longitude": -3.9750,
        "commune": "Marcory",
        "category": "shopping",
        "type": "mall",
        "importance": 8
    },
    {
        "id": "gare_bassam",
        "name": "Gare de Bassam",
        "address": "Gare de Bassam, Plateau, Abidjan",
        "latitude": 5.3200,
        "longitude": -4.0200,
        "commune": "Plateau",
        "category": "transport",
        "type": "station",
        "importance": 7
    },
    {
        "id": "marche_adjame",
        "name": "Marché d'Adjamé",
        "address": "Marché d'Adjamé, Adjamé, Abidjan",
        "latitude": 5.3667,
        "longitude": -4.0167,
        "commune": "Adjamé",
        "category": "shopping",
        "type": "market",
        "importance": 8
    },
    {
        "id": "riviera_golf",
        "name": "Riviera Golf",
        "address": "Riviera Golf, Cocody, Abidjan",
        "latitude": 5.3789,
        "longitude": -3.9956,
        "commune": "Cocody",
        "category": "entertainment",
        "type": "golf",
        "importance": 6
    },
    {
        "id": "carrefour_kennedy",
        "name": "Carrefour Kennedy",
        "address": "Carrefour Kennedy, Yopougon, Abidjan",
        "latitude": 5.3289,
        "longitude": -4.0756,
        "commune": "Yopougon",
        "category": "intersection",
        "type": "intersection",
        "importance": 7
    },
    {
        "id": "hotel_ivoire",
        "name": "Hôtel Ivoire",
        "address": "Hôtel Ivoire, Cocody, Abidjan",
        "latitude": 5.3439,
        "longitude": -3.9889,
        "commune": "Cocody",
        "category": "hospitality",
        "type": "hotel",
        "importance": 7
    },
    {
        "id": "stade_alassane_ouattara",
        "name": "Stade Alassane Ouattara",
        "address": "Stade Alassane Ouattara, Yopougon, Abidjan",
        "latitude": 5.3156,
        "longitude": -4.0789,
        "commune": "Yopougon",
        "category": "sports",
        "type": "stadium",
        "importance": 6
    }
]

# Coordonnées des communes d'Abidjan
COMMUNE_COORDINATES = {
    "Abobo": {"latitude": 5.4414, "longitude": -4.0444},
    "Adjamé": {"latitude": 5.3667, "longitude": -4.0167},
    "Attécoubé": {"latitude": 5.3333, "longitude": -4.0333},
    "Cocody": {"latitude": 5.3600, "longitude": -3.9678},
    "Koumassi": {"latitude": 5.3000, "longitude": -3.9500},
    "Marcory": {"latitude": 5.3000, "longitude": -3.9833},
    "Plateau": {"latitude": 5.3167, "longitude": -4.0167},
    "Port-Bouët": {"latitude": 5.2500, "longitude": -3.9333},
    "Treichville": {"latitude": 5.2833, "longitude": -4.0000},
    "Yopougon": {"latitude": 5.3167, "longitude": -4.0833}
}

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculer la distance entre deux points géographiques en kilomètres"""
    R = 6371  # Rayon de la Terre en km

    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) * math.sin(dlng / 2))

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance

async def get_address_suggestions(
    db: Session,
    query: str,
    user_location: Optional[Dict[str, float]] = None,
    limit: int = 8
) -> List[Dict[str, Any]]:
    """Obtenir des suggestions d'adresses intelligentes"""
    suggestions = []
    query_lower = query.lower()

    # 1. Rechercher dans les lieux populaires
    matching_places = []
    for place in POPULAR_PLACES:
        if (query_lower in place["name"].lower() or 
            query_lower in place["address"].lower() or
            query_lower in place["commune"].lower()):

            place_suggestion = {
                "id": place["id"],
                "address": place["address"],
                "name": place["name"],
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "commune": place["commune"],
                "type": place["type"],
                "category": place["category"],
                "importance": place["importance"],
                "distance": None
            }

            # Calculer la distance si la position utilisateur est fournie
            if user_location:
                distance = calculate_distance(
                    user_location["latitude"], user_location["longitude"],
                    place["latitude"], place["longitude"]
                )
                place_suggestion["distance"] = round(distance, 2)

            matching_places.append(place_suggestion)

    # Trier les lieux populaires par importance et distance
    if user_location:
        matching_places.sort(key=lambda x: (x["distance"] or 999, -x["importance"]))
    else:
        matching_places.sort(key=lambda x: -x["importance"])

    suggestions.extend(matching_places[:4])  # Maximum 4 lieux populaires

    # 2. Générer des suggestions pour chaque commune
    commune_suggestions = []
    for commune, coords in COMMUNE_COORDINATES.items():
        if query_lower in commune.lower():
            commune_suggestion = {
                "id": f"commune_{commune.lower()}",
                "address": f"{query}, {commune}, Abidjan",
                "name": f"{query} - {commune}",
                "latitude": coords["latitude"],
                "longitude": coords["longitude"],
                "commune": commune,
                "type": "custom",
                "category": "address",
                "importance": 1,
                "distance": None
            }

            if user_location:
                distance = calculate_distance(
                    user_location["latitude"], user_location["longitude"],
                    coords["latitude"], coords["longitude"]
                )
                commune_suggestion["distance"] = round(distance, 2)

            commune_suggestions.append(commune_suggestion)

    # Trier par distance si disponible
    if user_location and commune_suggestions:
        commune_suggestions.sort(key=lambda x: x["distance"] or 999)

    # Ajouter les suggestions de commune (maximum 4)
    suggestions.extend(commune_suggestions[:4])

    # 3. Si pas assez de suggestions, ajouter des suggestions génériques
    if len(suggestions) < limit:
        generic_suggestions = []
        for commune in ["Cocody", "Plateau", "Marcory", "Yopougon", "Treichville"]:
            if len(suggestions) + len(generic_suggestions) >= limit:
                break

            coords = COMMUNE_COORDINATES[commune]
            generic_suggestion = {
                "id": f"generic_{commune.lower()}_{query}",
                "address": f"{query}, {commune}, Abidjan",
                "name": f"{query} - {commune}",
                "latitude": coords["latitude"],
                "longitude": coords["longitude"],
                "commune": commune,
                "type": "custom",
                "category": "address",
                "importance": 0,
                "distance": None
            }

            if user_location:
                distance = calculate_distance(
                    user_location["latitude"], user_location["longitude"],
                    coords["latitude"], coords["longitude"]
                )
                generic_suggestion["distance"] = round(distance, 2)

            generic_suggestions.append(generic_suggestion)

        suggestions.extend(generic_suggestions)

    # Limiter le nombre de suggestions
    return suggestions[:limit]

async def get_popular_places(
    db: Session,
    user_location: Optional[Dict[str, float]] = None,
    category: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Obtenir les lieux populaires d'Abidjan"""
    places = POPULAR_PLACES.copy()

    # Filtrer par catégorie si spécifiée
    if category:
        places = [p for p in places if p["category"] == category]

    # Calculer les distances si la position utilisateur est fournie
    if user_location:
        for place in places:
            distance = calculate_distance(
                user_location["latitude"], user_location["longitude"],
                place["latitude"], place["longitude"]
            )
            place["distance"] = round(distance, 2)

        # Trier par distance puis par importance
        places.sort(key=lambda x: (x["distance"], -x["importance"]))
    else:
        # Trier par importance seulement
        places.sort(key=lambda x: -x["importance"])

    return places[:limit]

async def reverse_geocode(
    latitude: float,
    longitude: float
) -> Optional[Dict[str, Any]]:
    """Géocodage inverse pour obtenir l'adresse à partir de coordonnées"""

    # Trouver la commune la plus proche
    closest_commune = None
    min_distance = float('inf')

    for commune, coords in COMMUNE_COORDINATES.items():
        distance = calculate_distance(
            latitude, longitude,
            coords["latitude"], coords["longitude"]
        )

        if distance < min_distance:
            min_distance = distance
            closest_commune = commune

    if closest_commune and min_distance < 20:  # Moins de 20km
        return {
            "address": f"Position actuelle, {closest_commune}, Abidjan",
            "commune": closest_commune,
            "latitude": latitude,
            "longitude": longitude,
            "distance": round(min_distance, 2)
        }

    return {
        "address": f"Position actuelle, Abidjan",
        "commune": "Abidjan",
        "latitude": latitude,
        "longitude": longitude,
        "distance": 0
    }

def point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """
    Vérifier si un point est à l'intérieur d'un polygone en utilisant l'algorithme du point dans le polygone.

    Args:
        point: Tuple (latitude, longitude) du point à vérifier
        polygon: Liste de tuples (latitude, longitude) formant le polygone

    Returns:
        bool: True si le point est à l'intérieur du polygone, False sinon
    """
    x, y = point
    n = len(polygon)
    inside = False

    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside

async def get_google_places_suggestions(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Obtient des suggestions d'adresses depuis Google Places API
    """
    try:
        # Vérifier si la clé API est configurée
        api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        if not api_key:
            print("❌ Clé API Google Places non configurée, utilisation de données de simulation")
            return get_simulated_suggestions(query, max_results)

        # URL de l'API Google Places Autocomplete
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"

        # Paramètres de la requête
        params = {
            "input": query,
            "key": api_key,
            "language": "fr",
            "components": "country:ci",  # Limiter à la Côte d'Ivoire
            "types": "geocode"  # Adresses géographiques uniquement
        }

        # Faire la requête
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    print(f"❌ Erreur API Google Places: {response.status}, utilisation de simulation")
                    return get_simulated_suggestions(query, max_results)

                data = await response.json()

                if data.get("status") != "OK":
                    print(f"❌ Erreur Google Places: {data.get('status')}, utilisation de simulation")
                    return get_simulated_suggestions(query, max_results)

                # Traiter les prédictions
                suggestions = []
                for prediction in data.get("predictions", [])[:max_results]:
                    suggestions.append({
                        "address": prediction["description"],
                        "place_id": prediction["place_id"],
                        "commune": extract_commune_from_description(prediction["description"]),
                        "description": prediction["description"]
                    })

                return suggestions

    except Exception as e:
        print(f"❌ Erreur lors de la récupération des suggestions Google Places: {str(e)}")
        return get_simulated_suggestions(query, max_results)

def get_simulated_suggestions(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Retourne des suggestions simulées pour Abidjan
    """
    communes = ["Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"]

    # Lieux populaires d'Abidjan
    popular_places = [
        "Université Félix Houphouët-Boigny, Cocody",
        "Aéroport Félix Houphouët-Boigny, Port-Bouët",
        "Marché de Treichville, Treichville",
        "CHU de Cocody, Cocody",
        "Plateau Centre-ville, Plateau",
        "Riviera Golf, Cocody",
        "Gare de Yopougon, Yopougon",
        "Centre Commercial PlaYce Marcory, Marcory",
        "Banco, Yopougon",
        "Deux Plateaux, Cocody"
    ]

    suggestions = []
    query_lower = query.lower()

    # Rechercher dans les lieux populaires
    for place in popular_places:
        if query_lower in place.lower():
            commune = place.split(", ")[-1]
            suggestions.append({
                "address": place,
                "place_id": f"place_{len(suggestions)}",
                "commune": commune,
                "description": place
            })

    # Ajouter des communes correspondantes
    for commune in communes:
        if query_lower in commune.lower():
            suggestions.append({
                "address": f"{commune}, Abidjan",
                "place_id": f"commune_{commune}",
                "commune": commune,
                "description": f"{commune}, Abidjan"
            })

    # Générer des adresses de rues
    if len(suggestions) < max_results:
        street_types = ["Rue", "Avenue", "Boulevard"]
        for i, street_type in enumerate(street_types):
            if len(suggestions) >= max_results:
                break
            commune = communes[i % len(communes)]
            address = f"{street_type} {query.title()}, {commune}, Abidjan"
            suggestions.append({
                "address": address,
                "place_id": f"street_{i}",
                "commune": commune,
                "description": address
            })

    return suggestions[:max_results]