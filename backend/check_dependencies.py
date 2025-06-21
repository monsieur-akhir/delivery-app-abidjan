
"""Vérifier que toutes les dépendances nécessaires sont installées"""

import importlib
import sys

REQUIRED_PACKAGES = [
    'fastapi',
    'uvicorn',
    'sqlalchemy',
    'alembic',
    'pydantic',
    'redis',
    'httpx',
    'passlib',
    'python_jose',
    'python_multipart'
]

def check_dependencies():
    """Vérifier la disponibilité des packages requis"""
    missing_packages = []
    
    for package in REQUIRED_PACKAGES:
        try:
            importlib.import_module(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - MANQUANT")
    
    if missing_packages:
        print(f"\n⚠️ Packages manquants: {', '.join(missing_packages)}")
        print("Les dépendances seront installées automatiquement par Replit.")
    else:
        print("\n🎉 Toutes les dépendances sont disponibles!")
    
    return len(missing_packages) == 0

if __name__ == "__main__":
    check_dependencies()
