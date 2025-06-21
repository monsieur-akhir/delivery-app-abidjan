#!/usr/bin/env python3
"""
Test de l'autocomplétion avec biais de localisation
"""
import requests
import json

API_URL = "http://127.0.0.1:8000"
ENDPOINT = "/api/address-autocomplete"
LOGIN_ENDPOINT = "/api/auth/login"

PHONE = "22507000000"
PASSWORD = "test123"

# Coordonnées de test (centre de Cocody)
TEST_LAT = 5.3600
TEST_LNG = -3.9678

def get_token():
    """Récupère un token JWT valide"""
    try:
        resp = requests.post(
            f"{API_URL}{LOGIN_ENDPOINT}",
            json={"phone": PHONE, "password": PASSWORD},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        resp.raise_for_status()
        return resp.json().get("access_token")
    except requests.RequestException as e:
        print(f"❌ Erreur de connexion pour obtenir le token: {e}")
        return None

def test_location_bias():
    print("🛰️  Test de l'autocomplétion avec biais de localisation")
    print("======================================================")
    
    token = get_token()
    if not token:
        print("❌ Test annulé: impossible d'obtenir un token.")
        return
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    queries = ["groupe itermi", "restaurant", "pharmacie", "cap nord"]
    
    for query in queries:
        print(f"\n🔍 Recherche de '{query}' près de Cocody ({TEST_LAT}, {TEST_LNG})")
        print("------------------------------------------------------")
        
        payload = {
            "input": query,
            "lat": TEST_LAT,
            "lng": TEST_LNG
        }
        
        try:
            resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=15)
            resp.raise_for_status()
            
            data = resp.json()
            predictions = data.get("predictions", [])
            
            if predictions:
                print(f"✅ {len(predictions)} suggestions trouvées:")
                for i, pred in enumerate(predictions[:3]):
                    print(f"  {i+1}. {pred['description']}")
            else:
                print("⚠️ Aucune suggestion trouvée. L'API Google a retourné ZERO_RESULTS.")

        except requests.HTTPError as e:
            print(f"❌ Erreur HTTP: {e.response.status_code} - {e.response.text}")
        except requests.RequestException as e:
            print(f"❌ Erreur de connexion: {e}")
        except json.JSONDecodeError:
            print(f"❌ Erreur de décodage JSON. Réponse reçue: {resp.text}")

if __name__ == "__main__":
    test_location_bias() 