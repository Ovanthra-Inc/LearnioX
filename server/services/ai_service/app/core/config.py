from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "learniox-ai-service"
    SERVICE_NAME: str = "ai_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/8"
    INTERNAL_API_KEY: str = "dev-internal-secret"

    # OpenRouter — supports GPT-4o, Claude-3.5, Gemini Flash, Llama etc.
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    DEFAULT_LLM_MODEL: str = "google/gemini-flash-1.5"  # fast + cheap default

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/8"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/9"

    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"


@lru_cache
def get_settings() -> Settings:
    return Settings()