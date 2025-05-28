from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn
import os
from pathlib import Path

# Racine du projet (chemin absolu pour Windows/Linux)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Charger le bon fichier .env automatiquement
ENV = os.getenv("ENVIRONMENT", "development")  # "development" par défaut

env_file_path = BASE_DIR / f".env.{ENV}"

class Settings(BaseSettings):
    # === Application ===
    DEBUG: bool = True
    ENVIRONMENT: str = ENV
    SECRET_KEY: str

    # === Base de données ===
    DATABASE_URL: PostgresDsn

    # === Redis ===
    REDIS_URL: RedisDsn

    # === Keycloak ===
    KEYCLOAK_URL: str
    KEYCLOAK_REALM: str
    KEYCLOAK_CLIENT_ID: str
    KEYCLOAK_CLIENT_SECRET: str
    KEYCLOAK_ADMIN_USERNAME: str
    KEYCLOAK_ADMIN_PASSWORD: str

    # === CinetPay ===
    CINETPAY_API_KEY: str
    CINETPAY_SITE_ID: str
    CINETPAY_SECRET_KEY: str
    CINETPAY_RETURN_URL: str
    CINETPAY_CANCEL_URL: str

    # === Twilio ===
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str

    # === OneSignal ===
    ONESIGNAL_APP_ID: str
    ONESIGNAL_API_KEY: str

    # === OpenWeatherMap ===
    OPENWEATHERMAP_API_KEY: str

    # === Rasa ===
    RASA_URL: str

    model_config = SettingsConfigDict(env_file=str(env_file_path), extra="ignore")


# Instanciation unique à utiliser dans tout le projet
settings = Settings()
