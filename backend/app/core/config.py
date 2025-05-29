from pydantic_settings import BaseSettings
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

class Settings(BaseSettings):
    # Informations de l'application
    APP_NAME: str = "Livraison Abidjan API"
    API_V1_STR: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Sécurité
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 jours
    
    # Base de données
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
        "https://livraison-abidjan.com",
        "https://admin.livraison-abidjan.com"
    ]
    
    # Keycloak
    USE_KEYCLOAK: bool = os.getenv("USE_KEYCLOAK", "False").lower() == "true"
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "")
    KEYCLOAK_REALM: str = os.getenv("KEYCLOAK_REALM", "livraison-abidjan")
    KEYCLOAK_CLIENT_ID: str = os.getenv("KEYCLOAK_CLIENT_ID", "backend")
    KEYCLOAK_CLIENT_SECRET: str = os.getenv("KEYCLOAK_CLIENT_SECRET", "")
    KEYCLOAK_ADMIN_USERNAME: str = os.getenv("KEYCLOAK_ADMIN_USERNAME", "admin")
    KEYCLOAK_ADMIN_PASSWORD: str = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "")
    
    # CinetPay
    CINETPAY_API_KEY: str = os.getenv("CINETPAY_API_KEY", "")
    CINETPAY_SITE_ID: str = os.getenv("CINETPAY_SITE_ID", "")
    CINETPAY_SECRET_KEY: str = os.getenv("CINETPAY_SECRET_KEY", "")
    CINETPAY_RETURN_URL: str = os.getenv("CINETPAY_RETURN_URL", "")
    CINETPAY_CANCEL_URL: str = os.getenv("CINETPAY_CANCEL_URL", "")
    
    # Twilio
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # OneSignal
    ONESIGNAL_APP_ID: str = os.getenv("ONESIGNAL_APP_ID", "")
    ONESIGNAL_API_KEY: str = os.getenv("ONESIGNAL_API_KEY", "")
    
    # OpenWeatherMap
    OPENWEATHERMAP_API_KEY: str = os.getenv("OPENWEATHERMAP_API_KEY", "")
    
    # Rasa
    RASA_URL: str = os.getenv("RASA_URL", "http://localhost:5005")
    
    # SMS
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "twilio")
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_SENDER_NUMBER: str = os.getenv("SMS_SENDER_NUMBER", "")
    SMS_DAILY_LIMIT: int = int(os.getenv("SMS_DAILY_LIMIT", "1000"))
    SMS_ENABLED: bool = os.getenv("SMS_ENABLED", "True").lower() == "true"
    
    # Africa's Talking
    AFRICAS_TALKING_USERNAME: str = os.getenv("AFRICAS_TALKING_USERNAME", "")
    
    # Paramètres métier
    DEFAULT_COMMISSION_RATE: float = 0.10  # 10% de commission par défaut
    MIN_DELIVERY_PRICE: float = 500  # Prix minimal en FCFA
    POINTS_PER_DELIVERY: int = 10
    POINTS_PER_FIVE_STAR: int = 5
    POINTS_PER_LEVEL: int = 100
    EXPRESS_DELIVERY_SURCHARGE: float = 1000  # Supplément en FCFA
    EXPRESS_DONATION_PERCENTAGE: float = 0.20  # 20% du supplément
    
    # Communes d'Abidjan
    COMMUNES: List[str] = [
        "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", 
        "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon"
    ]
    
    # Langues supportées
    SUPPORTED_LANGUAGES: List[str] = ["fr", "dioula", "baoulé"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
