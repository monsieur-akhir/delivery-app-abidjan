#!/usr/bin/env python3
"""
Script pour tester l'authentification avec l'utilisateur administrateur créé
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Données de l'administrateur de test
ADMIN_PHONE = "+2250701234567"
ADMIN_PASSWORD = "admin123"

def test_login():
    """Tester la connexion de l'administrateur"""
    print("🔐 Test de connexion de l'administrateur...")
    
    login_data = {
        "phone": ADMIN_PHONE,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📡 Status code: {response.status_code}")
        print(f"📄 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Connexion réussie !")
            print(f"   - Token: {data.get('access_token', 'Non trouvé')[:50]}...")
            print(f"   - Type de token: {data.get('token_type', 'Non trouvé')}")
            print(f"   - Utilisateur: {data.get('user', {}).get('full_name', 'Non trouvé')}")
            print(f"   - Rôle: {data.get('user', {}).get('role', 'Non trouvé')}")
            return data.get('access_token')
        else:
            print(f"❌ Échec de la connexion: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Erreur: {error_data}")
            except:
                print(f"   - Erreur brute: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au serveur. Vérifiez que le serveur est démarré sur http://localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Erreur lors de la connexion: {e}")
        return None

def test_protected_endpoint(token):
    """Tester un endpoint protégé avec le token"""
    if not token:
        print("⏭️ Pas de token disponible, saut du test des endpoints protégés")
        return
        
    print("\n🛡️ Test d'un endpoint protégé...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{API_URL}/auth/me",
            headers=headers
        )
        
        print(f"📡 Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Accès aux informations utilisateur réussi !")
            print(f"   - ID: {data.get('id')}")
            print(f"   - Nom: {data.get('full_name')}")
            print(f"   - Email: {data.get('email')}")
            print(f"   - Téléphone: {data.get('phone')}")
            print(f"   - Rôle: {data.get('role')}")
            print(f"   - Statut: {data.get('status')}")
        else:
            print(f"❌ Échec d'accès à l'endpoint protégé: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   - Erreur: {error_data}")
            except:
                print(f"   - Erreur brute: {response.text}")
                
    except Exception as e:
        print(f"❌ Erreur lors du test de l'endpoint protégé: {e}")

def test_server_health():
    """Vérifier que le serveur répond"""
    print("🏥 Test de santé du serveur...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"📡 Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Serveur en bonne santé !")
            return True
        else:
            print(f"⚠️ Serveur répond mais avec le code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Serveur non accessible. Vérifiez qu'il est démarré.")
        return False
    except Exception as e:
        print(f"❌ Erreur lors du test de santé: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Tests d'authentification pour l'application Livraison Abidjan")
    print("=" * 60)
    
    # Test de santé du serveur
    server_ok = test_server_health()
    print()
    
    if server_ok:
        # Test de connexion
        token = test_login()
        
        # Test d'un endpoint protégé
        test_protected_endpoint(token)
    
    print("\n" + "=" * 60)
    print("🏁 Tests terminés !")
