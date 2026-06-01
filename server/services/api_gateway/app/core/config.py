from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "learniox-api-gateway"
    SERVICE_NAME: str = "api_gateway"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    REDIS_URL: str | None = None
    DATABASE_URL: str | None = None

    INTERNAL_API_KEY: str = "dev-internal-secret"

    # JWT — must match auth_service values
    JWT_SECRET_KEY: str = "change-me-dev-jwt-key-2026-very-secure-random"
    JWT_ALGORITHM: str = "HS256"

    AUTH_SERVICE_URL: str
    USER_SERVICE_URL: str
    INSTITUTION_SERVICE_URL: str
    RBAC_SERVICE_URL: str
    COURSE_SERVICE_URL: str
    LESSON_SERVICE_URL: str
    ENROLLMENT_SERVICE_URL: str
    PROGRESS_SERVICE_URL: str
    SEARCH_SERVICE_URL: str
    ANALYTICS_SERVICE_URL: str
    NOTIFICATION_SERVICE_URL: str
    AI_SERVICE_URL: str
    REVIEW_SERVICE_URL: str
    AUDIT_SERVICE_URL: str
    MEDIA_SERVICE_URL: str | None = None
    MEMBERSHIP_SERVICE_URL: str | None = None
    PAYMENT_SERVICE_URL: str | None = None
    QUIZ_SERVICE_URL: str | None = None
    ASSIGNMENT_SERVICE_URL: str | None = None
    CERTIFICATE_SERVICE_URL: str | None = None
    DOUBT_SERVICE_URL: str | None = None
    COMMUNITY_SERVICE_URL: str | None = None
    LANDING_PAGE_SERVICE_URL: str | None = None
    MARKETING_SERVICE_URL: str | None = None
    ADMIN_SERVICE_URL: str | None = None

    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    RATE_LIMIT_PER_MINUTE: int = 120
    REQUEST_TIMEOUT_SECONDS: int = 30

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
