#!/usr/bin/env python3
"""
Script simple pour tester rapidement l'endpoint send-otp
"""

import requests
import json

def test_simple():
    url = "http://localhost:8000/api/auth/send-otp"
    
    # Test avec les données correctes
    data_correct = {
        "phone": "+22507123456",
        "otp_type": "registration"
    }
    
    # Test avec les données incorrectes (comme dans mobile/api.ts)
    data_incorrect = {
        "username": "+22507123456",  # Champ incorrect
        "password": "test123"        # Champ non attendu
    }
    
    print("=== Test avec données correctes ===")
    try:
        response = requests.post(url, json=data_correct)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n=== Test avec données incorrectes ===")
    try:
        response = requests.post(url, json=data_incorrect)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    test_simple()
