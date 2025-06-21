import requests
import os

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def reverse_geocode(lat, lng):
    url = (
        f"https://maps.googleapis.com/maps/api/geocode/json"
        f"?latlng={lat},{lng}&key={GOOGLE_MAPS_API_KEY}&language=fr"
    )
    resp = requests.get(url)
    data = resp.json()
    if data["status"] == "OK":
        for comp in data["results"][0]["address_components"]:
            if "sublocality" in comp["types"] or "locality" in comp["types"]:
                return comp["long_name"]
    return None

def get_route_info(pickup_lat, pickup_lng, delivery_lat, delivery_lng):
    url = (
        f"https://maps.googleapis.com/maps/api/directions/json"
        f"?origin={pickup_lat},{pickup_lng}&destination={delivery_lat},{delivery_lng}"
        f"&mode=driving&key={GOOGLE_MAPS_API_KEY}&language=fr"
    )
    resp = requests.get(url)
    data = resp.json()
    if data["status"] == "OK":
        route = data["routes"][0]
        leg = route["legs"][0]
        return {
            "distance": leg["distance"]["value"] / 1000,  # en km
            "duration": leg["duration"]["value"] // 60,    # en minutes
            "polyline": route["overview_polyline"]["points"]
        }
    return {"distance": None, "duration": None, "polyline": None}

def geocode_address(address):
    url = (
        f"https://maps.googleapis.com/maps/api/geocode/json"
        f"?address={requests.utils.quote(address)}&key={GOOGLE_MAPS_API_KEY}&language=fr"
    )
    resp = requests.get(url)
    data = resp.json()
    if data["status"] == "OK":
        loc = data["results"][0]["geometry"]["location"]
        return loc["lat"], loc["lng"]
    return None, None 