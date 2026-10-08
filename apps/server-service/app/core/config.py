import hmac
import secrets
from pathlib import Path
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Safely locate central .env file for local development without crashing inside Docker containers
parents = Path(__file__).resolve().parents
central_env = str(parents[4] / ".env") if len(parents) > 4 and (parents[4] / ".env").exists() else ".env"

# Fields that must NEVER have hardcoded defaults (enforced at runtime below)
_SENSITIVE_FIELDS = {"SECRET_KEY", "POSTGRES_PASSWORD"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=central_env,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # General App Settings
    PROJECT_NAME: str = "LearnioX Server Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Logging & Observability
    LOG_LEVEL: str = "INFO"
    LEARNIOX_LOG_DIR: str = "/var/log/learniox"
    LOG_FILE_MAX_BYTES: int = 26214400
    LOG_FILE_BACKUP_COUNT: int = 10
    APPLICATIONINSIGHTS_CONNECTION_STRING: Optional[str] = None

    # Microservice Endpoints
    AI_SERVICE_URL: str = "http://ai-service:8001"
    LIVE_SERVICE_URL: str = "http://live-service:8003"
    MARKETING_SERVICE_URL: str = "http://marketing-service:8002"

    # Security & JWT — NO default for SECRET_KEY; must come from .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    SUPERADMIN_EMAILS: List[str] = ["admin@learniox.com"]

    # Webhook HMAC secret — NO default; must come from .env
    WEBHOOK_SECRET: str = ""

    # PostgreSQL Database — NO default for password; must come from .env
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "learniox"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/learniox"

    # Database Connection Pool (Tuned for 1k concurrent users scale)
    DB_POOL_SIZE: int = 25
    DB_MAX_OVERFLOW: int = 15
    DB_POOL_RECYCLE: int = 1800

    # ─── Redis Cache ──────────────────────────────────────────────────────────
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379"
    REDIS_DB: int = 0
    # TTL defaults (seconds)
    CACHE_TTL_USER_PROFILE: int = 300
    CACHE_TTL_RBAC_PERMS: int = 60
    CACHE_TTL_COURSE_LISTING: int = 120
    CACHE_TTL_INSTITUTION: int = 600
    CACHE_TTL_SEARCH: int = 30
    CACHE_TTL_DISCOVERY: int = 60
    CACHE_TTL_ANALYTICS: int = 300

    # ─── Payment Providers ────────────────────────────────────────────────────
    # Set PAYMENT_PROVIDER to 'razorpay', 'stripe', or 'mock'
    PAYMENT_PROVIDER: str = "mock"

    # Razorpay (India-first)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Stripe (global)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""

    # ─── Storage Provider ─────────────────────────────────────────────────────
    # Set STORAGE_PROVIDER to 'local', 'r2', or 's3'
    STORAGE_PROVIDER: str = "local"

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "learniox-media"
    R2_PUBLIC_URL: str = ""  # CDN/public endpoint for signed URLs

    # AWS S3 (alternative)
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = "learniox-media"
    S3_REGION: str = "ap-south-1"

    # ─── Certificate Settings ─────────────────────────────────────────────────
    CERTIFICATE_ISSUER: str = "LearnioX Platform"
    CERTIFICATE_BASE_URL: str = ""  # Base URL for public verify links e.g. https://learniox.com/cert

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"

    # SMTP / Email Service Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "no-reply@learniox.com"
    EMAILS_FROM_NAME: str = "LearnioX Platform"
    FRONTEND_URL: str = "https://culinary-prism-aging.ngrok-free.dev"

    # File Storage Configuration
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5120

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # ─── Computed Properties ──────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    # ─── Validators ───────────────────────────────────────────────────────────

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(64))\""
            )
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, v: List[str]) -> List[str]:
        return v

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.is_production:
            # Block wildcard CORS in production
            if "*" in self.CORS_ORIGINS:
                raise ValueError("Wildcard CORS origin '*' is not allowed in production environment.")

            # Block missing webhook secret in production
            if not self.WEBHOOK_SECRET:
                raise ValueError("WEBHOOK_SECRET must be set in production environment.")

            # Warn about debug docs
            if self.DEBUG:
                raise ValueError("DEBUG must be False in production environment.")

            # Payment provider must be real in production
            if self.PAYMENT_PROVIDER == "mock":
                raise ValueError("PAYMENT_PROVIDER cannot be 'mock' in production environment.")
        return self

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify an HMAC-SHA256 webhook signature against WEBHOOK_SECRET."""
        import hashlib
        if not self.WEBHOOK_SECRET:
            return False
        expected = hmac.new(
            self.WEBHOOK_SECRET.encode("utf-8"),
            payload,
            digestmod=hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


settings = Settings()
