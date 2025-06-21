#!/usr/bin/env python3
"""
Script pour tester exactement ce que le frontend envoie
Simule les requêtes du frontend React Native
"""

import requests
import json
import time

# Configuration du frontend
API_URL = "http://192.168.1.4:8000"
ENDPOINT = "/api/deliveries/address-autocomplete"

def test_frontend_request():
    """Test exactement ce que le frontend envoie"""
    
    print("=== TEST FRONTEND REQUEST ===")
    print(f"URL: {API_URL}{ENDPOINT}")
    print()
    
    # Test 1: POST avec body JSON (méthode principale du frontend)
    print("1. Test POST avec body JSON:")
    print("-" * 40)
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN_HERE"  # Le frontend ajoute automatiquement le token
    }
    
    # Simuler exactement ce que le frontend envoie
    payload = {
        "input": "abidjan"  # input.trim() du frontend
    }
    
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}{ENDPOINT}",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur POST: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: GET avec query param (fallback du frontend)
    print("2. Test GET avec query param (fallback):")
    print("-" * 40)
    
    headers = {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
    }
    
    params = {
        "input": "abidjan"  # encodeURIComponent(input.trim()) du frontend
    }
    
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Params: {json.dumps(params, indent=2)}")
    print()
    
    try:
        response = requests.get(
            f"{API_URL}{ENDPOINT}",
            params=params,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur GET: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 3: Sans authentification (pour voir l'erreur 401)
    print("3. Test sans authentification:")
    print("-" * 40)
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "input": "abidjan"
    }
    
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{API_URL}{ENDPOINT}",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
    except requests.exceptions.RequestException as e:
        print(f"Erreur: {e}")

def test_with_real_token():
    """Test avec un vrai token (si disponible)"""
    print("=== TEST AVEC VRAI TOKEN ===")
    
    # Essayer de récupérer un token valide
    try:
        # Login pour obtenir un token
        login_data = {
            "phone": "22507000000",  # Numéro de test
            "password": "test123"
        }
        
        login_response = requests.post(
            f"{API_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            print(f"Token obtenu: {token[:20]}...")
            
            # Test avec le vrai token
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            
            payload = {
                "input": "abidjan"
            }
            
            print(f"Test avec token valide:")
            print(f"Headers: {json.dumps(headers, indent=2)}")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            print()
            
            response = requests.post(
                f"{API_URL}{ENDPOINT}",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Response Body: {response.text}")
            
        else:
            print(f"Échec login: {login_response.status_code} - {login_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Erreur login: {e}")

if __name__ == "__main__":
    print("Test des requêtes frontend vers l'API d'autocomplétion")
    print("=" * 60)
    print()
    
    test_frontend_request()
    print()
    test_with_real_token() 