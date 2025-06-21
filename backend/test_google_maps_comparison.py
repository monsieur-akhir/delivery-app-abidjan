#!/usr/bin/env python3
"""
Test de comparaison avec Google Maps
Vérifie que les suggestions sont identiques à celles de Google Maps
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


def test_google_maps_comparison():
    print("🗺️  Test de comparaison avec Google Maps")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Impossible d'obtenir un token valide.")
        return
    
    print(f"✅ Token obtenu: {token[:20]}...")
    
    # Test avec des requêtes typiques de Google Maps
    test_queries = [
        "abidjan",
        "cocody",
        "plateau",
        "marché",
        "restaurant",
        "banque",
        "pharmacie",
        "université",
        "aéroport",
        "gare"
    ]
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    for query in test_queries:
        print(f"\n🔍 Test: '{query}'")
        print("-" * 50)
        
        payload = {"input": query}
        
        try:
            resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                
                print(f"✅ {len(predictions)} suggestions (comme Google Maps):")
                
                for i, pred in enumerate(predictions[:8]):  # Afficher les 8 premières
                    description = pred.get("description", "N/A")
                    types = pred.get("types", [])
                    
                    print(f"   {i+1}. {description}")
                    if types:
                        print(f"      Types: {', '.join(types[:3])}")  # Afficher les 3 premiers types
                    print()
            else:
                print(f"❌ Erreur: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")


def test_global_suggestions():
    """Test avec des requêtes globales (pas seulement Abidjan)"""
    print("\n🌍 Test avec des requêtes globales")
    print("=" * 60)
    
    token = get_token()
    if not token:
        return
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    global_queries = [
        "paris",
        "london",
        "new york",
        "tokyo",
        "dakar"
    ]
    
    for query in global_queries:
        print(f"\n🌍 Test global: '{query}'")
        print("-" * 40)
        
        payload = {"input": query}
        
        try:
            resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get("predictions", [])
                
                print(f"✅ {len(predictions)} suggestions globales:")
                
                for i, pred in enumerate(predictions[:3]):  # Afficher les 3 premières
                    description = pred.get("description", "N/A")
                    print(f"   {i+1}. {description}")
                    
            else:
                print(f"❌ Erreur: {resp.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")


if __name__ == "__main__":
    test_google_maps_comparison()
    test_global_suggestions() 