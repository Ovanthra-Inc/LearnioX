from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "learniox-payment-service"
    SERVICE_NAME: str = "payment_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str | None = None

    INTERNAL_API_KEY: str = "dev-internal-secret"
    ENROLLMENT_SERVICE_URL: str | None = None
    NOTIFICATION_SERVICE_URL: str | None = None
    AUDIT_SERVICE_URL: str | None = None

    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str = ""

    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
