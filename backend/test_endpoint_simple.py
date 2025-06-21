#!/usr/bin/env python3
"""
Test simple de l'endpoint d'autocomplétion
"""

import requests
import json

def test_autocomplete():
    """Test de l'endpoint d'autocomplétion"""
    
    # URL de base (ajuste selon ton serveur)
    base_url = "http://localhost:8000"
    
    # Test avec différents paramètres
    test_cases = [
        {"input": "Yo", "expected_status": 422},  # Trop court
        {"input": "Yop", "expected_status": 200},  # OK
        {"input": "Yopougon", "expected_status": 200},  # OK
    ]
    
    print("🧪 Test de l'endpoint d'autocomplétion")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        input_text = test_case["input"]
        expected_status = test_case["expected_status"]
        
        print(f"\n{i}️⃣ Test avec input='{input_text}' (attendu: {expected_status}):")
        
        try:
            # Requête sans authentification (devrait donner 401)
            response = requests.get(
                f"{base_url}/api/deliveries/address-autocomplete",
                params={"input": input_text},
                timeout=5
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Correct: Authentification requise")
            elif response.status_code == 422:
                print("   ✅ Correct: Validation échouée (longueur insuffisante)")
            elif response.status_code == 200:
                print("   ✅ Correct: Requête réussie")
                data = response.json()
                print(f"   📊 Réponse: {json.dumps(data, indent=2)}")
            else:
                print(f"   ❌ Inattendu: {response.status_code}")
                print(f"   📄 Contenu: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Erreur: Impossible de se connecter au serveur")
            print("   💡 Assurez-vous que le serveur FastAPI est démarré sur le port 8000")
        except Exception as e:
            print(f"   ❌ Erreur: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 Résumé:")
    print("- Si vous voyez des 401: L'authentification fonctionne")
    print("- Si vous voyez des 422: La validation fonctionne")
    print("- Si vous voyez des 200: L'endpoint fonctionne parfaitement")
    print("- Si vous voyez des erreurs de connexion: Démarrez le serveur")

if __name__ == "__main__":
    test_autocomplete() 