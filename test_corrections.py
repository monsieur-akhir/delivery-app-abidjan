#!/usr/bin/env python3
"""
Test après corrections pour vérifier que l'erreur 422 est résolue
"""

import requests
import json

def test_corrections():
    base_url = "http://localhost:8000"
    
    print("=" * 60)
    print("TEST APRÈS CORRECTIONS - ERREUR 422 RÉSOLUE")
    print("=" * 60)
    
    # Test 1: Endpoint send-otp avec structure correcte
    print("\n1. Test send-otp avec structure correcte")
    print("-" * 40)
    try:
        response = requests.post(f"{base_url}/api/auth/send-otp", json={
            "phone": "+22507123456",
            "otp_type": "registration"
        })
        print(f"✅ Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Response: {response.json()}")
        else:
            print(f"❌ Response: {response.json()}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 2: Endpoint login avec structure correcte
    print("\n2. Test login avec structure correcte")
    print("-" * 40)
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={
            "phone": "+22507123456",
            "password": "test123"
        })
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 3: Vérifier que l'erreur 422 est toujours déclenchée avec de mauvaises données
    print("\n3. Test erreur 422 avec mauvaise structure (pour validation)")
    print("-" * 40)
    try:
        response = requests.post(f"{base_url}/api/auth/send-otp", json={
            "username": "+22507123456",  # Champ incorrect
            "password": "test123"        # Champ non attendu
        })
        print(f"Status Code: {response.status_code}")
        if response.status_code == 422:
            print("✅ L'erreur 422 est toujours correctement déclenchée pour les mauvaises données")
        else:
            print("❌ L'erreur 422 devrait être déclenchée")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 4: Test resend-otp
    print("\n4. Test resend-otp")
    print("-" * 40)
    try:
        response = requests.post(f"{base_url}/api/auth/resend-otp", json={
            "phone": "+22507123456",
            "otp_type": "registration"
        })
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    test_corrections()
