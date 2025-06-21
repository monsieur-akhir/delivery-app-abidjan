#!/usr/bin/env python3
"""
Test des deux endpoints d'autocomplétion (GET et POST)
"""

import requests
import json

def test_both_endpoints():
    """Test des endpoints GET et POST d'autocomplétion"""
    
    # URL de base
    base_url = "http://localhost:8000"
    
    print("🧪 Test des endpoints d'autocomplétion")
    print("=" * 60)
    
    # Test 1: Endpoint GET (original)
    print("\n1️⃣ Test endpoint GET /address-autocomplete:")
    print("-" * 40)
    
    try:
        response = requests.get(
            f"{base_url}/api/deliveries/address-autocomplete",
            params={"input": "Yopougon"},
            timeout=5
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Correct: Authentification requise")
        elif response.status_code == 422:
            print("   ❌ Problème: Validation échouée")
            print(f"   📄 Détails: {response.text}")
        elif response.status_code == 200:
            print("   ✅ Correct: Requête réussie")
            data = response.json()
            print(f"   📊 Réponse: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Inattendu: {response.status_code}")
            print(f"   📄 Contenu: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Erreur: Impossible de se connecter au serveur")
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
    
    # Test 2: Endpoint POST (nouveau)
    print("\n2️⃣ Test endpoint POST /address-autocomplete:")
    print("-" * 40)
    
    try:
        response = requests.post(
            f"{base_url}/api/deliveries/address-autocomplete",
            json={"input": "Yopougon"},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Correct: Authentification requise")
        elif response.status_code == 422:
            print("   ❌ Problème: Validation échouée")
            print(f"   📄 Détails: {response.text}")
        elif response.status_code == 200:
            print("   ✅ Correct: Requête réussie")
            data = response.json()
            print(f"   📊 Réponse: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Inattendu: {response.status_code}")
            print(f"   📄 Contenu: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Erreur: Impossible de se connecter au serveur")
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
    
    # Test 3: Endpoint de test simple
    print("\n3️⃣ Test endpoint GET /test-autocomplete:")
    print("-" * 40)
    
    try:
        response = requests.get(
            f"{base_url}/api/deliveries/test-autocomplete",
            params={"input": "test"},
            timeout=5
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ Correct: Authentification requise")
        elif response.status_code == 422:
            print("   ❌ Problème: Validation échouée")
            print(f"   📄 Détails: {response.text}")
        elif response.status_code == 200:
            print("   ✅ Correct: Requête réussie")
            data = response.json()
            print(f"   📊 Réponse: {json.dumps(data, indent=2)}")
        else:
            print(f"   ❌ Inattendu: {response.status_code}")
            print(f"   📄 Contenu: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Erreur: Impossible de se connecter au serveur")
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎯 Recommandations:")
    print("- Si GET donne 422 mais POST fonctionne: Utilisez POST")
    print("- Si les deux donnent 401: Problème d'authentification")
    print("- Si les deux donnent 422: Problème de validation")
    print("- Si le serveur ne répond pas: Démarrez-le d'abord")

if __name__ == "__main__":
    test_both_endpoints() 