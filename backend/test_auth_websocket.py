#!/usr/bin/env python3
"""
Script de test pour l'authentification et le WebSocket avec un vrai token JWT
"""

import asyncio
import websockets
import json
import requests
import sys
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
WS_BASE_URL = "ws://localhost:8001"

async def test_auth_and_websocket():
    """Test complet d'authentification et WebSocket"""
    print("🧪 Test Authentification + WebSocket")
    print("=" * 50)
    
    # Étape 1: Authentification
    print("1️⃣ Authentification...")
    try:
        # Essayer de se connecter avec un utilisateur de test
        login_data = {
            "phone": "22507000000",  # Numéro de test
            "password": "test123"    # Mot de passe de test
        }
        
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get("token")
            user = auth_data.get("user")
            
            print(f"✅ Authentification réussie!")
            print(f"   - User ID: {user.get('id')}")
            print(f"   - User Name: {user.get('full_name')}")
            print(f"   - Token: {token[:20]}...")
            
        else:
            print(f"❌ Échec de l'authentification: {response.status_code}")
            print(f"   Réponse: {response.text}")
            
            # Essayer de créer un utilisateur de test
            print("\n🔄 Tentative de création d'utilisateur de test...")
            register_data = {
                "full_name": "Test User",
                "phone": "22507000000",
                "email": "test@example.com",
                "password": "test123",
                "role": "client"
            }
            
            register_response = requests.post(f"{API_BASE_URL}/api/auth/register", json=register_data)
            
            if register_response.status_code == 200:
                print("✅ Utilisateur de test créé!")
                # Réessayer la connexion
                response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
                if response.status_code == 200:
                    auth_data = response.json()
                    token = auth_data.get("token")
                    user = auth_data.get("user")
                    print(f"✅ Connexion réussie après création!")
                else:
                    print(f"❌ Échec de la connexion après création: {response.status_code}")
                    return
            else:
                print(f"❌ Échec de la création d'utilisateur: {register_response.status_code}")
                return
                
    except Exception as e:
        print(f"❌ Erreur lors de l'authentification: {e}")
        return
    
    # Étape 2: Test WebSocket avec le vrai token
    print("\n2️⃣ Test WebSocket avec token valide...")
    try:
        user_id = user.get("id")
        ws_url = f"{WS_BASE_URL}/ws/{user_id}?token={token}"
        
        print(f"🔗 Connexion à: {ws_url}")
        
        async with websockets.connect(ws_url) as websocket:
            print("✅ Connexion WebSocket établie avec succès!")
            
            # Envoyer un message de test
            test_message = {
                "type": "test",
                "data": {
                    "message": "Test de connexion WebSocket authentifiée",
                    "timestamp": datetime.now().isoformat(),
                    "user_id": user_id
                }
            }
            
            await websocket.send(json.dumps(test_message))
            print("✅ Message de test envoyé")
            
            # Attendre une réponse
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"✅ Réponse reçue: {response}")
            except asyncio.TimeoutError:
                print("⚠️  Aucune réponse reçue dans les 5 secondes (normal)")
            
            print("✅ Test WebSocket terminé avec succès!")
            
    except websockets.exceptions.InvalidStatusCode as e:
        if e.status_code == 403:
            print("❌ Connexion refusée (403): Token invalide ou expiré")
        else:
            print(f"❌ Erreur de statut: {e.status_code}")
    except websockets.exceptions.ConnectionRefusedError:
        print("❌ Connexion refusée: Le serveur WebSocket n'est pas démarré")
    except Exception as e:
        print(f"❌ Erreur de connexion WebSocket: {e}")
    
    print("\n📋 Résumé:")
    print("- Si vous voyez '✅ Connexion WebSocket établie', tout fonctionne")
    print("- Le token JWT généré peut être utilisé dans l'app mobile")
    print("- Vérifiez que l'URL WebSocket correspond à votre configuration mobile")

if __name__ == "__main__":
    asyncio.run(test_auth_and_websocket()) 