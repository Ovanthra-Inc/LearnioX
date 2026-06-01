from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "learniox-media-service"
    SERVICE_NAME: str = "media_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str | None = None
    INTERNAL_API_KEY: str = "dev-internal-secret"
    AUDIT_SERVICE_URL: str | None = None

    # Cloudflare Stream
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_STREAM_API_TOKEN: str = ""

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "learniox-assets"
    R2_PUBLIC_URL: str = "https://assets.example.com"

    MAX_VIDEO_SIZE_MB: int = 2048
    MAX_ASSET_SIZE_MB: int = 50

    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
