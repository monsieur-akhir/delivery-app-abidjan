
#!/usr/bin/env python3
"""
Script de démarrage optimisé pour Replit
"""
import uvicorn
import os
import sys
from pathlib import Path

# Ajouter le répertoire courant au PYTHONPATH
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def main():
    """Démarre le serveur FastAPI sur Replit"""
    
    # Configuration pour Replit
    config = {
        "app": "app.main:app",
        "host": "0.0.0.0",  # Important pour Replit
        "port": 8000,
        "reload": False,  # Désactiver en production
        "workers": 1,
        "log_level": "info",
        "access_log": True,
    }
    
    print("🚀 Démarrage du backend FastAPI sur Replit...")
    print("=" * 50)
    print(f"📍 Host: {config['host']}")
    print(f"🔌 Port: {config['port']}")
    print("=" * 50)
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
