from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool
    ENVIRONMENT: str
    SECRET_KEY: str
    DATABASE_URL: str
    REDIS_URL: str
    ...

    class Config:
        env_file = ".env"

settings = Settings()
