
#!/usr/bin/env python3
"""
Script de démarrage pour Replit - Livraison Abidjan Backend
"""

import os
import sys
import subprocess
import asyncio
from pathlib import Path

# Ajouter le répertoire backend au path
sys.path.insert(0, str(Path(__file__).parent))

def check_dependencies():
    """Vérifier et installer les dépendances manquantes"""
    print("Vérification des dépendances...")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'psycopg2',
        'redis',
        'python-dotenv',
        'pydantic'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - MANQUANT")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Installation des packages manquants: {', '.join(missing_packages)}")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "--upgrade", "pip"
            ])
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
            ])
            print("✅ Dépendances installées avec succès")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur lors de l'installation: {e}")
            return False
    
    return True

def setup_environment():
    """Configurer les variables d'environnement"""
    from dotenv import load_dotenv
    
    # Charger les variables d'environnement
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print("✅ Variables d'environnement chargées")
    else:
        print("⚠️  Fichier .env non trouvé, utilisation des valeurs par défaut")
    
    # Variables par défaut pour Replit
    os.environ.setdefault("DATABASE_URL", "sqlite:///./livraison_abidjan.db")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
    os.environ.setdefault("SECRET_KEY", "replit-dev-secret-key-change-in-production")
    os.environ.setdefault("ENVIRONMENT", "development")
    os.environ.setdefault("DEBUG", "true")

async def init_database():
    """Initialiser la base de données"""
    try:
        print("Initialisation de la base de données...")
        
        # Import local après vérification des dépendances
        from app.db.session import engine
        from app.models import user, delivery, wallet, gamification
        from sqlalchemy import text
        
        # Créer les tables
        from app.db.base import Base
        Base.metadata.create_all(bind=engine)
        
        print("✅ Base de données initialisée")
        return True
        
    except Exception as e:
        print(f"⚠️ Erreur lors de l'initialisation de la DB: {e}")
        print("ℹ️  L'application démarrera sans base de données")
        return False

def start_server():
    """Démarrer le serveur FastAPI"""
    try:
        print("Démarrage du serveur FastAPI...")
        
        # Import après vérification des dépendances
        import uvicorn
        
        # Configuration pour Replit
        config = {
            "app": "app.main:app",
            "host": "0.0.0.0",
            "port": 8000,
            "reload": True,
            "log_level": "info",
            "access_log": True
        }
        
        print(f"🚀 Serveur démarré sur http://0.0.0.0:8000")
        print(f"📚 Documentation API: http://0.0.0.0:8000/docs")
        
        uvicorn.run(**config)
        
    except Exception as e:
        print(f"❌ Erreur lors du démarrage du serveur: {e}")
        sys.exit(1)

async def main():
    """Fonction principale"""
    print("🚀 Démarrage de Livraison Abidjan Backend")
    print("="*50)
    
    # 1. Vérifier les dépendances
    if not check_dependencies():
        print("❌ Échec de la vérification des dépendances")
        sys.exit(1)
    
    # 2. Configurer l'environnement
    setup_environment()
    
    # 3. Initialiser la base de données
    await init_database()
    
    # 4. Démarrer le serveur
    start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Arrêt du serveur")
    except Exception as e:
        print(f"❌ Erreur fatale: {e}")
        sys.exit(1)
