from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "learniox-rbac-service"
    SERVICE_NAME: str = "rbac_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str | None = None

    INTERNAL_API_KEY: str
    AUTH_SERVICE_URL: str
    USER_SERVICE_URL: str
    NOTIFICATION_SERVICE_URL: str | None = None
    AUDIT_SERVICE_URL: str | None = None

    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"


@lru_cache
def get_settings() -> Settings:
    return Settings()
