
#!/usr/bin/env python3
"""
Script pour exécuter toutes les nouvelles migrations
"""
import sys
import os
sys.path.append('.')

import asyncio
from alembic.config import Config
from alembic import command
from app.core.config import settings

async def run_migrations():
    """
    Exécute toutes les migrations en attente
    """
    print("🚀 Démarrage des migrations...")
    
    # Configuration Alembic
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    
    try:
        # Vérifier la révision actuelle
        print("📋 Vérification de la révision actuelle...")
        command.current(alembic_cfg)
        
        # Exécuter toutes les migrations en attente
        print("⚡ Exécution des migrations...")
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Toutes les migrations ont été exécutées avec succès!")
        
        # Afficher l'historique des migrations
        print("\n📜 Historique des migrations:")
        command.history(alembic_cfg)
        
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution des migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_migrations())
