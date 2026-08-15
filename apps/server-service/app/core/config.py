import hmac
import secrets
from pathlib import Path
from typing import List, Union
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

    # Security & JWT — NO default for SECRET_KEY; must come from .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Webhook HMAC secret — NO default; must come from .env
    WEBHOOK_SECRET: str = ""

    # PostgreSQL Database — NO default for password; must come from .env
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "learniox"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/learniox"

    # Database Connection Pool
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"
    ALLOW_DEV_LOGIN: bool = False  # Secure default — must be explicitly enabled in .env

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

            # Block dev login in production
            if self.ALLOW_DEV_LOGIN:
                raise ValueError("ALLOW_DEV_LOGIN must be False in production environment.")

            # Block missing webhook secret in production
            if not self.WEBHOOK_SECRET:
                raise ValueError("WEBHOOK_SECRET must be set in production environment.")

            # Warn about debug docs
            if self.DEBUG:
                raise ValueError("DEBUG must be False in production environment.")
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
