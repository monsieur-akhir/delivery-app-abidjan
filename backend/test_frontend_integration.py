#!/usr/bin/env python3
"""
Test d'intégration complet de l'autocomplétion d'adresse comme le frontend
"""
import requests
import json

API_URL = "http://192.168.1.4:8000"
ENDPOINT = "/api/address-autocomplete"
LOGIN_ENDPOINT = "/api/auth/login"

# Identifiants de test (à adapter)
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


def test_autocomplete_integration(input_value: str):
    print(f"\n1️⃣ Test endpoint POST /address-autocomplete (frontend):")
    token = get_token()
    if not token:
        print("Impossible d'obtenir un token valide.")
        return
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {"input": input_value}
    print(f"POST {API_URL+ENDPOINT}")
    print(f"Headers: {headers}")
    print(f"Payload: {payload}")
    resp = requests.post(API_URL+ENDPOINT, json=payload, headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Réponse: {resp.text}")
    if resp.status_code == 405:
        print("➡️  Fallback GET (comme le frontend)")
        params = {"input": input_value}
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(API_URL+ENDPOINT, params=params, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Réponse: {resp.text}")

if __name__ == "__main__":
    print("Test d'intégration complet de l'autocomplétion d'adresse (POST puis fallback GET)")
    print("="*60)
    test_autocomplete_integration("abidjan")
    test_autocomplete_integration("a")
    test_autocomplete_integration("cocody") 