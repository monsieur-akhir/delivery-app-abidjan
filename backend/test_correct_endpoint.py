#!/usr/bin/env python3
"""
Test avec la bonne URL de l'endpoint d'autocomplétion - RECHERCHE GLOBALE SANS RESTRICTION
"""
import requests
import json

API_URL = "http://192.168.1.4:8000"
ENDPOINT = "/api/address-autocomplete"  # URL correcte
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


def test_global_search():
    print("🌍 Test de recherche GLOBALE sans restriction géographique")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Impossible d'obtenir un token valide.")
        return
    
    print(f"✅ Token obtenu: {token[:20]}...")
    
    # Tests avec différents types de recherche
    test_queries = [
        "paris",           # Ville française
        "new york",        # Ville américaine  
        "tokyo",           # Ville japonaise
        "cocody",          # Quartier ivoirien
        "rue de la paix",  # Rue générique
        "restaurant",      # Type de lieu
        "hotel",           # Type de lieu
        "a",               # Recherche très courte
        "ab",              # Recherche courte
    ]
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}️⃣ Test POST '{query}' - {API_URL}{ENDPOINT}")
        print("-" * 50)
        
        payload = {"input": query}
        
        print(f"Query: '{query}'")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        try:
            resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get('predictions', [])
                print(f"✅ Succès! {len(predictions)} suggestions trouvées")
                
                if predictions:
                    print("📋 Premières suggestions:")
                    for j, pred in enumerate(predictions[:5]):
                        address = pred.get('description', pred.get('address', 'N/A'))
                        place_id = pred.get('place_id', 'N/A')
                        print(f"   {j+1}. {address}")
                        print(f"      ID: {place_id}")
                else:
                    print("⚠️  Aucune suggestion trouvée")
            else:
                print(f"❌ Échec: {resp.text}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        print()


def test_get_method():
    print("\n🔍 Test méthode GET (alternative)")
    print("=" * 40)
    
    token = get_token()
    if not token:
        print("❌ Impossible d'obtenir un token valide.")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test avec quelques requêtes
    test_queries = ["london", "berlin", "madrid"]
    
    for query in test_queries:
        print(f"\n🌐 Test GET '{query}'")
        print("-" * 30)
        
        params = {"input": query}
        
        try:
            resp = requests.get(API_URL + ENDPOINT, params=params, headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                predictions = data.get('predictions', [])
                print(f"✅ {len(predictions)} suggestions pour '{query}'")
                
                if predictions:
                    for i, pred in enumerate(predictions[:3]):
                        address = pred.get('description', pred.get('address', 'N/A'))
                        print(f"   {i+1}. {address}")
            else:
                print(f"❌ Échec: {resp.text}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")


if __name__ == "__main__":
    test_global_search()
    test_get_method() 