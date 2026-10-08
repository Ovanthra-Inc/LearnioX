from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

parents = Path(__file__).resolve().parents
central_env = str(parents[3] / ".env") if len(parents) > 3 and (parents[3] / ".env").exists() else ".env"


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server & Port
    AI_SERVICE_HOST: str = "0.0.0.0"
    AI_SERVICE_PORT: int = 8001

    # Logging & Observability
    LOG_LEVEL: str = "INFO"
    LEARNIOX_LOG_DIR: str = "/var/log/learniox"
    LOG_FILE_MAX_BYTES: int = 26214400
    LOG_FILE_BACKUP_COUNT: int = 10
    APPLICATIONINSIGHTS_CONNECTION_STRING: Optional[str] = None

    # Rate Limiting
    AI_RATE_LIMIT_PER_MINUTE: int = 30

    # Google Gemini AI Settings
    GEMINI_API_KEY: Optional[str] = None
    AI_MODEL_NAME: str = "gemini-1.5-flash"
    AI_TEMPERATURE: float = 0.2
    AI_MAX_OUTPUT_TOKENS: int = 4096

    # Speech-to-Text & Lecture Transcription Testing Settings
    OPENAI_API_KEY: Optional[str] = None
    WHISPER_MODEL: str = "whisper-1"
    MAX_TRANSCRIPTION_FILE_SIZE_MB: int = 100
    TRANSCRIPTION_STORAGE_DIR: str = "/app/storage/lecture_transcription_test"

    # Redis Cache & Background Tasks
    REDIS_URL: str = "redis://redis:6379/1"

    # Cross-Origin Resource Sharing (CORS)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://localhost",
    ]

    model_config = SettingsConfigDict(
        env_file=central_env,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
