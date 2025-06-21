#!/usr/bin/env python3
"""
Script de démarrage optimisé du serveur FastAPI
Résout les problèmes de connexion HTTP et améliore la stabilité
"""
import uvicorn
import os
import sys
from pathlib import Path

# Ajouter le répertoire courant au PYTHONPATH
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def main():
    """Démarre le serveur avec des paramètres optimisés"""
    
    # Configuration optimisée pour éviter les erreurs de connexion
    config = {
        "app": "app.main:app",
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True,
        "workers": 1,  # Un seul worker pour éviter les conflits
        "loop": "asyncio",
        "http": "h11",
        "ws": "websockets",
        "log_level": "info",
        "access_log": True,
        "use_colors": True,
        "timeout_keep_alive": 30,  # Augmenter le timeout
        "timeout_graceful_shutdown": 30,
        "limit_concurrency": 1000,  # Limiter les connexions simultanées
        "limit_max_requests": 1000,  # Limiter les requêtes par worker
        "backlog": 2048,  # Augmenter la file d'attente
        "proxy_headers": True,
        "forwarded_allow_ips": "*",
    }
    
    print("🚀 Démarrage du serveur FastAPI avec configuration optimisée...")
    print("=" * 60)
    print(f"📍 Host: {config['host']}")
    print(f"🔌 Port: {config['port']}")
    print(f"⚡ Workers: {config['workers']}")
    print(f"⏱️  Timeout Keep-Alive: {config['timeout_keep_alive']}s")
    print(f"🔗 Connexions max: {config['limit_concurrency']}")
    print("=" * 60)
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 