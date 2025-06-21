#!/usr/bin/env python3
"""
Script de test pour le serveur WebSocket
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test de connexion WebSocket"""
    try:
        # URL du serveur WebSocket
        uri = "ws://localhost:8001/ws/123?token=test_token"
        
        print(f"Tentative de connexion à {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ Connexion WebSocket établie avec succès!")
            
            # Envoyer un message de test
            test_message = {
                "type": "test",
                "data": {
                    "message": "Test de connexion WebSocket",
                    "timestamp": "2024-01-01T12:00:00Z"
                }
            }
            
            await websocket.send(json.dumps(test_message))
            print("✅ Message de test envoyé")
            
            # Attendre une réponse (optionnel)
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
        print(f"❌ Erreur de connexion: {e}")

if __name__ == "__main__":
    print("🧪 Test du serveur WebSocket")
    print("=" * 40)
    
    asyncio.run(test_websocket())
    
    print("\n📋 Résumé:")
    print("- Si vous voyez '✅ Connexion WebSocket établie', le serveur fonctionne")
    print("- Si vous voyez '❌ Connexion refusée (403)', c'est normal (token de test)")
    print("- Si vous voyez '❌ Connexion refusée', le serveur n'est pas démarré") 