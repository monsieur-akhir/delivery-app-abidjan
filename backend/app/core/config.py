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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1800"))  # 30 minutes par défaut
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))  # 7 jours par défaut

    # Base de données
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Upload Configuration
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB par défaut
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

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

    # Brevo (Sendinblue) Configuration
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_API_KEY_MAIL: str = os.getenv("BREVO_API_KEY_MAIL", "")
    BREVO_API_KEY_SMS: str = os.getenv("BREVO_API_KEY_SMS", "")
    BREVO_MAIL_API_URL: str = os.getenv("BREVO_MAIL_API_URL", "https://api.brevo.com/v3/smtp/email")
    BREVO_SMS_API_URL: str = os.getenv("BREVO_SMS_API_URL", "https://api.brevo.com/v3/transactionalSMS/sms")
    BREVO_ENABLED: bool = os.getenv("BREVO_ENABLED", "True").lower() == "true"
    BREVO_FROM_EMAIL: str = os.getenv("BREVO_FROM_EMAIL", "noreply@livraison-abidjan.com")
    BREVO_FROM_NAME: str = os.getenv("BREVO_FROM_NAME", "Livraison Abidjan")
    
    # Email Configuration avancée
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "True").lower() == "true"
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "brevo")
    EMAIL_SENDER_ADDRESS: str = os.getenv("EMAIL_SENDER_ADDRESS", "noreply@livraison-abidjan.com")
    EMAIL_SENDER_NAME: str = os.getenv("EMAIL_SENDER_NAME", "Livraison Abidjan")
    
    # SMS Configuration avancée
    SMS_ENABLED: bool = os.getenv("SMS_ENABLED", "True").lower() == "true"
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "brevo")
    SMS_SENDER: str = os.getenv("SMS_SENDER", "LiverCI")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "LiverCI")
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_SENDER_NUMBER: str = os.getenv("SMS_SENDER_NUMBER", "")
    SMS_DAILY_LIMIT: int = int(os.getenv("SMS_DAILY_LIMIT", "1000"))
    
    # Configuration OTP
    OTP_EXPIRY_MINUTES: int = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))
    OTP_LENGTH: int = int(os.getenv("OTP_LENGTH", "6"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "3"))

    # Configuration Email SMTP (fallback)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "")

    # SMTP/Mail générique (fallback)
    MAIL_HOST: str = os.getenv("MAIL_HOST", "smtp-relay.brevo.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USER: str = os.getenv("MAIL_USER", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@livraison-abidjan.com")
    MAIL_TRANSPORT: str = os.getenv("MAIL_TRANSPORT", "smtp")

    # Google Places
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")

    # Notifications
    NOTIFICATION_ENABLED: bool = os.getenv("NOTIFICATION_ENABLED", "True").lower() == "true"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()