from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

class Settings(BaseSettings):
    # Paramètres de base de données
    DATABASE_URL: str
    
    # Paramètres Redis
    REDIS_URL: str
    
    # Paramètres JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30
    
    # Paramètres de l'application
    APP_NAME: str = "Livraison Abidjan"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"]
    
    # Paramètres de paiement
    CINETPAY_API_KEY: str = ""
    CINETPAY_SITE_ID: str = ""
    
    # Paramètres de notification
    ONESIGNAL_APP_ID: str = ""
    ONESIGNAL_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
