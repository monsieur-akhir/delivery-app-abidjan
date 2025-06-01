#!/usr/bin/env python3
"""
Script pour tester l'endpoint /api/auth/send-otp et identifier l'erreur 422.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"  # Modifier selon votre configuration
ENDPOINT = f"{BASE_URL}/api/auth/send-otp"

def test_send_otp_scenarios():
    """Teste différents scénarios d'appel à l'endpoint send-otp"""
    
    print("=" * 60)
    print("TEST DE L'ENDPOINT /api/auth/send-otp")
    print("=" * 60)
    
    # Scénarios de test
    test_cases = [
        {
            "name": "Requête valide - Registration",
            "payload": {
                "phone": "+22507123456",
                "email": "test@example.com",
                "otp_type": "registration"
            }
        },
        {
            "name": "Requête valide - Login",
            "payload": {
                "phone": "+22507123456",
                "otp_type": "login"
            }
        },
        {
            "name": "Requête valide - Password Reset",
            "payload": {
                "phone": "+22507123456",
                "email": "test@example.com",
                "otp_type": "password_reset"
            }
        },
        {
            "name": "Champ phone manquant",
            "payload": {
                "email": "test@example.com",
                "otp_type": "registration"
            }
        },
        {
            "name": "Champ otp_type manquant",
            "payload": {
                "phone": "+22507123456",
                "email": "test@example.com"
            }
        },
        {
            "name": "otp_type invalide",
            "payload": {
                "phone": "+22507123456",
                "otp_type": "invalid_type"
            }
        },
        {
            "name": "Phone vide",
            "payload": {
                "phone": "",
                "otp_type": "registration"
            }
        },
        {
            "name": "Format téléphone invalide",
            "payload": {
                "phone": "123",
                "otp_type": "registration"
            }
        },
        {
            "name": "Payload vide",
            "payload": {}
        },
        {
            "name": "Requête avec structure incorrecte (comme dans mobile/api.ts)",
            "payload": {
                "username": "+22507123456",  # Au lieu de "phone"
                "password": "test123"        # Champ non attendu
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print("-" * 50)
        
        try:
            response = requests.post(
                ENDPOINT,
                json=test_case['payload'],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            except json.JSONDecodeError:
                print(f"Response Text: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ ERREUR: Impossible de se connecter au serveur.")
            print("Assurez-vous que le serveur FastAPI est démarré sur localhost:8000")
            return False
        except requests.exceptions.Timeout:
            print("❌ ERREUR: Timeout de la requête")
        except Exception as e:
            print(f"❌ ERREUR: {e}")
    
    return True

def test_server_connection():
    """Teste la connexion au serveur"""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Serveur accessible")
            return True
        else:
            print(f"⚠️  Serveur répond avec le code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Serveur non accessible")
        return False
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return False

def check_required_fields():
    """Vérifie les champs requis selon le schéma Pydantic"""
    print("\n" + "=" * 60)
    print("ANALYSE DU SCHÉMA OTPRequest")
    print("=" * 60)
    
    print("Selon le code backend/app/schemas/otp.py:")
    print("- phone: str (REQUIS)")
    print("- email: Optional[str] (OPTIONNEL)")
    print("- otp_type: OTPType (REQUIS)")
    print("\nTypes OTP valides:")
    print("- 'registration'")
    print("- 'login'")
    print("- 'password_reset'")
    print("- 'two_factor'")

def main():
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Vérifier la connexion au serveur
    if not test_server_connection():
        print("\n❌ Impossible de se connecter au serveur backend.")
        print("Démarrez le serveur avec: uvicorn app.main:app --reload --port 8000")
        return 1
    
    # Afficher l'analyse du schéma
    check_required_fields()
    
    # Lancer les tests
    if test_send_otp_scenarios():
        print("\n" + "=" * 60)
        print("RÉSUMÉ")
        print("=" * 60)
        print("✅ Tests terminés. Analysez les réponses ci-dessus pour identifier:")
        print("   - Les erreurs 422 (Validation Error)")
        print("   - Les champs manquants ou invalides")
        print("   - Les différences entre les appels frontend/mobile")
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
