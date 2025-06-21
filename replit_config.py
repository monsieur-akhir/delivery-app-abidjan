
"""Configuration spécifique pour l'environnement Replit"""

import os
import sys

# Ajouter le répertoire backend au PATH Python
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Variables d'environnement par défaut pour Replit
REPLIT_ENV_VARS = {
    'DATABASE_URL': 'sqlite:///./livraison.db',  # Base de données locale pour tests
    'REDIS_URL': 'redis://localhost:6379/0',
    'SECRET_KEY': 'replit-development-secret-key',
    'DEBUG': 'true',
    'ENVIRONMENT': 'development',
    'ALLOWED_ORIGINS': '*',
    'CORS_ORIGINS': '*'
}

def setup_replit_environment():
    """Configure l'environnement pour Replit"""
    for key, value in REPLIT_ENV_VARS.items():
        if key not in os.environ:
            os.environ[key] = value
    
    print("✅ Environnement Replit configuré")

if __name__ == "__main__":
    setup_replit_environment()
