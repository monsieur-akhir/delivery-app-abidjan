#!/usr/bin/env python3
"""
Test simple de l'API d'autocomplétion
"""
import requests
import json
import time

API_URL = "http://localhost:8000"
ENDPOINT = "/api/address-autocomplete"

def test_simple_autocomplete():
    print("🧪 Test simple de l'API d'autocomplétion")
    print("=" * 50)
    
    # Test 1: Requête POST simple
    print("\n1️⃣ Test POST /api/address-autocomplete")
    print("-" * 40)
    
    payload = {"input": "paris"}
    headers = {"Content-Type": "application/json"}
    
    try:
        print(f"URL: {API_URL}{ENDPOINT}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        resp = requests.post(API_URL + ENDPOINT, json=payload, headers=headers, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Headers: {dict(resp.headers)}")
        print(f"Réponse: {resp.text[:500]}...")
        
        if resp.status_code == 200:
            data = resp.json()
            predictions = data.get('predictions', [])
            print(f"✅ Succès! {len(predictions)} suggestions trouvées")
            
            if predictions:
                print("📋 Premières suggestions:")
                for i, pred in enumerate(predictions[:3]):
                    address = pred.get('description', pred.get('address', 'N/A'))
                    print(f"   {i+1}. {address}")
            else:
                print("⚠️  Aucune suggestion trouvée")
        else:
            print("❌ Échec")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 2: Requête GET simple
    print("\n2️⃣ Test GET /api/address-autocomplete")
    print("-" * 40)
    
    params = {"input": "london"}
    
    try:
        print(f"URL: {API_URL}{ENDPOINT}")
        print(f"Params: {json.dumps(params, indent=2)}")
        
        resp = requests.get(API_URL + ENDPOINT, params=params, timeout=15)
        print(f"Status: {resp.status_code}")
        print(f"Réponse: {resp.text[:500]}...")
        
        if resp.status_code == 200:
            data = resp.json()
            predictions = data.get('predictions', [])
            print(f"✅ Succès! {len(predictions)} suggestions trouvées")
            
            if predictions:
                print("📋 Premières suggestions:")
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
    test_simple_autocomplete() 