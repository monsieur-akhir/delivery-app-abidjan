from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from ..core.config import settings

# Créer l'URL de connexion à la base de données
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Créer le moteur de base de données
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Pour les serveurs à faible ressource, limiter le pool de connexions
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

# Créer une session locale
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Créer une classe de base pour les modèles
Base = declarative_base()
