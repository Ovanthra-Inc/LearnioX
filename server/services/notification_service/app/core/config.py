from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    APP_NAME: str = "learniox-notification-service"
    SERVICE_NAME: str = "notification_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str
    REDIS_URL: str | None = None
    INTERNAL_API_KEY: str = "dev-internal-secret"
    EMAIL_PROVIDER: str = "resend"
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@learniox.com"
    SMS_PROVIDER: str = "msg91"
    MSG91_AUTH_KEY: str = ""
    WHATSAPP_PROVIDER: str = "gupshup"
    GUPSHUP_API_KEY: str = ""
    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

@lru_cache
def get_settings() -> Settings:
    return Settings()
