import os
import requests
from dotenv import load_dotenv
load_dotenv()

# Renseigne ta clé ici ou utilise la variable d'environnement
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY") or "TA_CLE_GOOGLE"
QUERY = "plateau"

url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={QUERY}&key={API_KEY}&language=fr&components=country:ci"

print(f"[DEBUG] Clé Google utilisée: {API_KEY}")
print(f"[DEBUG] URL appelée: {url}")

response = requests.get(url)
print("[DEBUG] Réponse brute:")
print(response.text) 