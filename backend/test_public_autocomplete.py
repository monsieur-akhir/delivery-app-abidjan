#!/usr/bin/env python3
"""
Test des endpoints publics d'autocomplétion
"""
import requests
import json
import time

API_URL = "http://localhost:8000"
ENDPOINT_PUBLIC_GET = "/api/address-autocomplete/public"
ENDPOINT_PUBLIC_POST = "/api/address-autocomplete/public"

def test_public_autocomplete():
    print("🌍 Test des endpoints publics d'autocomplétion")
    print("=" * 60)
    
    # Test 1: Requête GET publique
    print("\n1️⃣ Test GET /api/address-autocomplete/public")
    print("-" * 50)
    
    params = {"input": "paris"}
    
    try:
        print(f"URL: {API_URL}{ENDPOINT_PUBLIC_GET}")
        print(f"Params: {json.dumps(params, indent=2)}")
        
        resp = requests.get(API_URL + ENDPOINT_PUBLIC_GET, params=params, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Headers: {dict(resp.headers)}")
        print(f"Réponse: {resp.text[:500]}...")
        
        if resp.status_code == 200:
            data = resp.json()
            predictions = data.get('predictions', [])
            print(f"✅ Succès! {len(predictions)} suggestions trouvées")
            
            if predictions:
                print("📋 Premières suggestions:")
                for i, pred in enumerate(predictions[:5]):
                    address = pred.get('description', pred.get('address', 'N/A'))
                    place_id = pred.get('place_id', 'N/A')
                    print(f"   {i+1}. {address}")
                    print(f"      ID: {place_id}")
            else:
                print("⚠️  Aucune suggestion trouvée")
        else:
            print("❌ Échec")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 2: Requête POST publique
    print("\n2️⃣ Test POST /api/address-autocomplete/public")
    print("-" * 50)
    
    payload = {"input": "london"}
    headers = {"Content-Type": "application/json"}
    
    try:
        print(f"URL: {API_URL}{ENDPOINT_PUBLIC_POST}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        resp = requests.post(API_URL + ENDPOINT_PUBLIC_POST, json=payload, headers=headers, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Réponse: {resp.text[:500]}...")
        
        if resp.status_code == 200:
            data = resp.json()
            predictions = data.get('predictions', [])
            print(f"✅ Succès! {len(predictions)} suggestions trouvées")
            
            if predictions:
                print("📋 Premières suggestions:")
                for i, pred in enumerate(predictions[:5]):
                    address = pred.get('description', pred.get('address', 'N/A'))
                    place_id = pred.get('place_id', 'N/A')
                    print(f"   {i+1}. {address}")
                    print(f"      ID: {place_id}")
            else:
                print("⚠️  Aucune suggestion trouvée")
        else:
            print("❌ Échec")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 3: Recherche courte
    print("\n3️⃣ Test recherche courte 'a'")
    print("-" * 30)
    
    params = {"input": "a"}
    
    try:
        resp = requests.get(API_URL + ENDPOINT_PUBLIC_GET, params=params, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            predictions = data.get('predictions', [])
            print(f"✅ {len(predictions)} suggestions pour 'a'")
            
            if predictions:
                for i, pred in enumerate(predictions[:3]):
                    address = pred.get('description', pred.get('address', 'N/A'))
                    print(f"   {i+1}. {address}")
            else:
                print("⚠️  Aucune suggestion trouvée")
        else:
            print("❌ Échec")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

def test_server_health():
    print("\n🏥 Test de santé du serveur")
    print("-" * 30)
    
    try:
        resp = requests.get(f"{API_URL}/health", timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Réponse: {resp.text}")
    except Exception as e:
        print(f"❌ Serveur non accessible: {e}")

if __name__ == "__main__":
    test_server_health()
    time.sleep(2)  # Attendre un peu
    test_public_autocomplete() 