
#!/usr/bin/env python3
"""
Script de démarrage pour Replit Cloud Run
Optimisé pour l'environnement de déploiement sans virtual environment
"""

import os
import sys
import asyncio
from pathlib import Path

# Ajouter le répertoire backend au PYTHONPATH
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configuration des variables d'environnement pour le déploiement
os.environ.setdefault("ENVIRONMENT", "production")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("HOST", "0.0.0.0")
os.environ.setdefault("PORT", "8000")

async def init_database():
    """Initialise la base de données si nécessaire"""
    try:
        from app.db.init_db import init_db
        await init_db()
        print("✅ Base de données initialisée")
    except Exception as e:
        print(f"⚠️ Erreur lors de l'initialisation de la DB: {e}")

def main():
    """Point d'entrée principal"""
    try:
        # Initialisation de la base de données
        asyncio.run(init_database())
        
        # Import et démarrage de l'application
        from app.main import app
        import uvicorn
        
        # Configuration du serveur
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 8000))
        
        print(f"🚀 Démarrage du serveur sur {host}:{port}")
        
        # Démarrage avec uvicorn
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True
        )
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        print("Vérification des dépendances...")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur de démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
