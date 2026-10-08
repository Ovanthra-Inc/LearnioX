import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate central .env file
parents = Path(__file__).resolve().parents
central_env = str(parents[4] / ".env") if len(parents) > 4 and (parents[4] / ".env").exists() else ".env"


class LiveSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=central_env,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    PROJECT_NAME: str = "LearnioX Live Classroom Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8003
    API_V1_STR: str = "/api/v1/live"

    # Security & JWT
    SECRET_KEY: str = "learniox_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    JOIN_TICKET_EXPIRE_SECONDS: int = 120

    # PostgreSQL Database
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "learniox"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/learniox"
    DB_POOL_SIZE: int = 25
    DB_MAX_OVERFLOW: int = 15
    DB_POOL_RECYCLE: int = 1800

    # Redis Cache & Realtime Pub/Sub
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379"
    REDIS_DB: int = 0

    # Internal Microservice Links
    SERVER_SERVICE_URL: str = "http://server-service:8000"
    AI_SERVICE_URL: str = "http://ai-service:8001"

    # Media Provider Configuration
    MEDIA_PROVIDER: str = "dev"  # "dev" | "livekit"
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "wss://livekit.learniox.local"

    # Classroom Policies Defaults
    MAX_PARTICIPANTS_PER_CLASS: int = 1000
    REACTION_BATCH_INTERVAL_MS: int = 200
    CHAT_RATE_LIMIT_PER_SEC: float = 0.5  # max 1 message per 2 seconds
    ATTENDANCE_MIN_PERCENTAGE_PRESENT: float = 75.0
    ATTENDANCE_MIN_PERCENTAGE_LATE: float = 50.0

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://localhost",
    ]


settings = LiveSettings()
