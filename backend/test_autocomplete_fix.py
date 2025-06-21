#!/usr/bin/env python3
"""
Script de test pour l'endpoint d'autocomplétion après correction
"""

import requests
import json

def test_autocomplete():
    """Test de l'endpoint d'autocomplétion"""
    print("🧪 Test de l'endpoint d'autocomplétion")
    print("=" * 50)
    
    # URL de test
    url = "http://localhost:8000/api/deliveries/address-autocomplete"
    
    # Test avec un token valide (vous devez avoir un utilisateur connecté)
    # Pour ce test, on va d'abord essayer sans token pour voir l'erreur
    print("1️⃣ Test sans token (devrait retourner 401 ou 422):")
    try:
        response = requests.get(f"{url}?input=abidjan")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n2️⃣ Test avec token invalide:")
    try:
        response = requests.get(f"{url}?input=abidjan", headers={"Authorization": "Bearer invalid_token"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n📋 Analyse:")
    print("- Si vous voyez 401: Problème d'authentification")
    print("- Si vous voyez 422: Problème de validation des paramètres")
    print("- Si vous voyez 200: L'endpoint fonctionne")
    
    print("\n🔧 Solutions possibles:")
    print("1. Vérifiez que l'utilisateur est connecté dans l'app mobile")
    print("2. Vérifiez que le token JWT est valide")
    print("3. Vérifiez que l'endpoint n'a pas de problèmes de validation")

if __name__ == "__main__":
    test_autocomplete() 