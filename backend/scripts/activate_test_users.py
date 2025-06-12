#!/usr/bin/env python3
"""
Script pour activer les utilisateurs de test existants.
"""
import requests
import sys
import os

# Ajouter le répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:8000"

def get_admin_token():
    """Récupérer le token admin"""
    print("🔐 Connexion administrateur...")
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "phone": "+2250700000000",
        "password": "admin123"
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✅ Connexion admin réussie")
        return token
    else:
        print(f"❌ Erreur connexion admin: {response.status_code} - {response.text}")
        return None

def get_user_by_phone(phone, admin_token):
    """Récupérer un utilisateur par son numéro de téléphone"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Utiliser l'endpoint manager pour lister les utilisateurs avec recherche
    response = requests.get(f"{BASE_URL}/api/manager/users", 
                          params={"search": phone, "limit": 10}, 
                          headers=headers)
    
    if response.status_code == 200:
        users = response.json()
        for user in users:
            if user["phone"] == phone:
                return user
    return None

def activate_user(user_id, admin_token):
    """Activer un utilisateur"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    status_update_data = {
        "status": "active"
    }
    
    response = requests.put(f"{BASE_URL}/api/manager/users/{user_id}/status", 
                          json=status_update_data, 
                          headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Erreur activation utilisateur {user_id}: {response.status_code} - {response.text}")
        return None

def main():
    """Script principal"""
    print("🚀 Démarrage de l'activation des utilisateurs de test")
    
    # Récupérer le token admin
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Impossible de récupérer le token admin")
        return
    
    # Liste des utilisateurs de test à activer
    test_users = [
        {
            "phone": "+2250701234567",
            "name": "Client Test"
        },
        {
            "phone": "+2250708123456", 
            "name": "Coursier Test"
        }
    ]
    
    for test_user in test_users:
        print(f"\n📱 Recherche de l'utilisateur {test_user['name']} ({test_user['phone']})...")
        
        # Récupérer l'utilisateur
        user = get_user_by_phone(test_user["phone"], admin_token)
        
        if user:
            print(f"✅ Utilisateur trouvé: ID {user['id']}, Statut: {user['status']}")
            
            if user["status"] != "active":
                print(f"🔄 Activation de l'utilisateur {user['id']}...")
                activated_user = activate_user(user["id"], admin_token)
                
                if activated_user:
                    print(f"✅ Utilisateur {user['id']} activé avec succès! Nouveau statut: {activated_user['status']}")
                else:
                    print(f"❌ Échec de l'activation de l'utilisateur {user['id']}")
            else:
                print(f"ℹ️ Utilisateur {user['id']} déjà actif")
        else:
            print(f"❌ Utilisateur {test_user['name']} non trouvé")
    
    print("\n🎉 Script d'activation terminé!")

if __name__ == "__main__":
    main()
