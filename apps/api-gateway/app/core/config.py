import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Safely locate central .env file for local development without crashing inside Docker containers
parents = Path(__file__).resolve().parents
central_env = str(parents[4] / ".env") if len(parents) > 4 and (parents[4] / ".env").exists() else ".env"


class GatewaySettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=central_env,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "LearnioX API Gateway"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    GATEWAY_PORT: int = 8080
    GATEWAY_HOST: str = "0.0.0.0"

    SECRET_KEY: str = "learniox_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    INTERNAL_API_KEY: str = "learniox_internal_diagnostic_key_2026"

    # Microservice Endpoints
    SERVER_SERVICE_URL: str = "http://server-service:8000"
    AI_SERVICE_URL: str = "http://ai-service:8001"
    MARKETING_SERVICE_URL: str = "http://marketing-service:8002"
    LIVE_SERVICE_URL: str = "http://live-service:8003"

    # Logging & Observability
    LOG_LEVEL: str = "INFO"
    LEARNIOX_LOG_DIR: str = "/var/log/learniox"
    LOG_FILE_MAX_BYTES: int = 26214400
    LOG_FILE_BACKUP_COUNT: int = 10
    APPLICATIONINSIGHTS_CONNECTION_STRING: Optional[str] = None

    # Redis Rate Limiting
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379"
    GATEWAY_RATE_LIMIT_WINDOW_MS: int = 60000
    GATEWAY_RATE_LIMIT_MAX: int = 60000
    GATEWAY_RATE_LIMIT_DEFAULT: str = "60000/minute"

    # Circuit Breaker Resilience Tuning
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 100
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT: float = 10.0

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://localhost",
    ]


settings = GatewaySettings()
