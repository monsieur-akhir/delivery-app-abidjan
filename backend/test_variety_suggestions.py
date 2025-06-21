#!/usr/bin/env python3
"""
Test des suggestions variées (lieux d'intérêt, adresses, etc.)
"""
import requests
import json

API_URL = "http://192.168.1.4:8000"
ENDPOINT = "/api/address-autocomplete"
LOGIN_ENDPOINT = "/api/auth/login"

# Identifiants de test
PHONE = "22507000000"
PASSWORD = "test123"


def get_token():
    """Récupère un token JWT valide"""
    resp = requests.post(
        API_URL + LOGIN_ENDPOINT,
        json={"phone": PHONE, "password": PASSWORD},
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"Erreur login: {resp.status_code} {resp.text}")
    return None


def test_variety_suggestions():
    print("🎯 Test des suggestions variées (lieux d'intérêt, adresses, etc.)")
    print("=" * 70)
    
    token = get_token()
    if not token:
        print("❌ Impossible d'obtenir un token valide.")
        return
    
    print(f"✅ Token obtenu: {token[:20]}...")
    
    # Test avec différentes requêtes
    test_queries = [
        "cocody",
        "plateau", 
        "marché",
        "restaurant",
        "banque",
        "pharmacie",
        "université"
    ]
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    for query in test_queries:
        print(f"\n🔍 Test: '{query}'")
        print("-" * 40)
        
        payload = {"input": query}
        
        try:
            resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                
                print(f"✅ {len(predictions)} suggestions trouvées:")
                
                for i, pred in enumerate(predictions[:5]):  # Afficher les 5 premières
                    description = pred.get("description", "N/A")
                    google_type = pred.get("google_type", "N/A")
                    types = pred.get("types", [])
                    
                    print(f"   {i+1}. {description}")
                    print(f"      Type: {google_type}")
                    if types:
                        print(f"      Types Google: {types[:3]}...")  # Afficher les 3 premiers types
                    print()
            else:
                print(f"❌ Erreur: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")


if __name__ == "__main__":
    test_variety_suggestions() 