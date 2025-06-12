#!/usr/bin/env python3
"""
Script de test pour l'authentification avec l'utilisateur admin créé
"""
import requests
import json

def test_login():
    """Test de connexion avec l'administrateur créé"""
    
    # URL de l'API
    base_url = "http://localhost:8000/api"
    login_url = f"{base_url}/auth/login"
    
    # Données de connexion
    login_data = {
        "phone": "+2250701234567",
        "password": "admin123"
    }
    
    print("🔍 Test de connexion avec l'administrateur...")
    print(f"📞 Téléphone: {login_data['phone']}")
    print(f"🔐 URL: {login_url}")
    
    try:
        # Envoi de la requête de connexion
        response = requests.post(login_url, json=login_data)
        
        print(f"\n📊 Statut de la réponse: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ Connexion réussie !")
            print(f"🔍 Debugging - Structure complète de la réponse:")
            print(json.dumps(result, indent=2))
            
            # Extraction sécurisée des données
            access_token = result.get('access_token')
            refresh_token = result.get('refresh_token')
            user_data = result.get('user', {})
            
            if access_token:
                print(f"🎫 Access Token: {access_token[:50]}...")
            else:
                print("❌ Pas de token d'accès dans la réponse")
                
            if refresh_token:
                print(f"🔄 Refresh Token: {refresh_token[:50]}...")
            else:
                print("⚠️ Pas de refresh token dans la réponse")
                
            if user_data:
                print(f"👤 Utilisateur: {user_data.get('full_name', 'N/A')}")
                print(f"📧 Email: {user_data.get('email', 'N/A')}")
                print(f"🎭 Rôle: {user_data.get('role', 'N/A')}")
            else:
                print("⚠️ Pas de données utilisateur dans la réponse")
            
            # Test d'un endpoint protégé
            if access_token:
                test_protected_endpoint(base_url, access_token)
            else:
                print("❌ Impossible de tester l'endpoint protégé sans token")
                
        elif response.status_code == 422:
            print("❌ Erreur 422 - Validation des données")
            print(f"Détails: {response.text}")
            
        elif response.status_code == 401:
            print("❌ Erreur 401 - Identifiants incorrects")
            print(f"Détails: {response.text}")
            
        elif response.status_code == 403:
            print("❌ Erreur 403 - Accès interdit")
            print(f"Détails: {response.text}")
            
        else:
            print(f"❌ Erreur {response.status_code}")
            print(f"Détails: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Erreur de connexion - Le serveur backend n'est pas accessible")
        print("💡 Assurez-vous que le serveur est démarré avec: uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")

def test_protected_endpoint(base_url, token):
    """Test d'un endpoint protégé avec le token"""
    print("\n🔒 Test d'un endpoint protégé...")
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Test de l'endpoint users/me
        me_url = f"{base_url}/users/me"
        response = requests.get(me_url, headers=headers)
        
        print(f"📊 Statut /users/me: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Accès aux données utilisateur réussi !")
            print(f"👤 ID: {user_data.get('id')}")
            print(f"📞 Téléphone: {user_data.get('phone')}")
            print(f"🎭 Rôle: {user_data.get('role')}")
        else:
            print(f"❌ Erreur accès endpoint protégé: {response.status_code}")
            print(f"Détails: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur test endpoint protégé: {e}")

if __name__ == "__main__":
    print("🧪 Test d'authentification - Administrateur")
    print("=" * 50)
    test_login()
