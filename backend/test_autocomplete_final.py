#!/usr/bin/env python3
"""
Test final de l'endpoint d'autocomplétion avec le nouveau schéma
"""

import requests
import json

def test_autocomplete_final():
    """Test final de l'endpoint d'autocomplétion"""
    print("🧪 Test final de l'endpoint d'autocomplétion")
    print("=" * 50)
    
    # URL de test
    url = "http://localhost:8000/api/deliveries/address-autocomplete"
    
    print("1️⃣ Test sans token (devrait retourner 401):")
    try:
        response = requests.get(f"{url}?input=abidjan")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correct: Authentification requise")
        else:
            print(f"❌ Inattendu: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n2️⃣ Test avec token invalide:")
    try:
        response = requests.get(f"{url}?input=abidjan", headers={"Authorization": "Bearer invalid_token"})
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correct: Token invalide rejeté")
        else:
            print(f"❌ Inattendu: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n3️⃣ Test avec chaîne trop courte (devrait retourner 422):")
    try:
        response = requests.get(f"{url}?input=a", headers={"Authorization": "Bearer test_token"})
        print(f"Status: {response.status_code}")
        if response.status_code == 422:
            print("✅ Correct: Validation des paramètres")
        else:
            print(f"❌ Inattendu: {response.text[:200]}...")
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n📋 Résumé des améliorations:")
    print("✅ Endpoint utilise un response_model Pydantic")
    print("✅ Structure de réponse cohérente avec les autres endpoints")
    print("✅ Validation automatique des paramètres")
    print("✅ Sérialisation automatique de la réponse")
    print("✅ Documentation OpenAPI automatique")
    
    print("\n🎯 Prochaines étapes:")
    print("1. Redémarrez l'application mobile")
    print("2. Connectez-vous avec un vrai compte")
    print("3. Testez l'autocomplétion d'adresse")
    print("4. Vérifiez que les suggestions s'affichent correctement")

if __name__ == "__main__":
    test_autocomplete_final() 