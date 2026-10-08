import json
import logging
import os
import sys
import tempfile
from datetime import datetime, timezone
from typing import Optional

try:
    from concurrent_log_handler import ConcurrentRotatingFileHandler
except ImportError:
    from logging.handlers import RotatingFileHandler as ConcurrentRotatingFileHandler


class LearnioxJsonFormatter(logging.Formatter):
    """
    Structured JSON log formatter for LearnioX microservices.
    Produces machine-parsable logs matching Work Order 1.2 specifications.
    """

    def __init__(self, service_name: str):
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "service": self.service_name,
            "request_id": getattr(record, "request_id", None) or getattr(record, "x_request_id", None),
            "user_id": getattr(record, "user_id", None),
            "path": getattr(record, "path", None),
            "duration_ms": getattr(record, "duration_ms", None),
            "message": record.getMessage(),
        }

        if record.exc_info:
            log_entry["exc_info"] = self.formatException(record.exc_info)
        elif record.exc_text:
            log_entry["exc_info"] = record.exc_text
        else:
            log_entry["exc_info"] = None

        for key, val in record.__dict__.items():
            if key not in log_entry and not key.startswith("_") and key not in (
                "args", "msg", "levelname", "levelno", "pathname", "filename",
                "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
                "created", "msecs", "relativeCreated", "thread", "threadName",
                "processName", "process", "name"
            ):
                log_entry[key] = val

        return json.dumps(log_entry, default=str)


def setup_logging(service_name: str, log_level: Optional[str] = None) -> logging.Logger:
    """
    Initializes centralized structured JSON logging with stdout streaming and 
    ConcurrentRotatingFileHandler writing to /var/log/learniox/{service_name}.json.log.
    Controllable via environment variables: LOG_LEVEL, LEARNIOX_LOG_DIR, LOG_FILE_MAX_BYTES, LOG_FILE_BACKUP_COUNT.
    """
    raw_level = (
        log_level
        or os.getenv("LOG_LEVEL")
        or ("DEBUG" if os.getenv("DEBUG", "false").lower() in ("true", "1") else "INFO")
    )
    level = getattr(logging, raw_level.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    formatter = LearnioxJsonFormatter(service_name=service_name)

    # 1. Stdout stream handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    stream_handler.setLevel(level)

    root_logger.handlers = [stream_handler]

    # 2. File handler with configurable max size and backup count
    log_dir = os.getenv("LEARNIOX_LOG_DIR", "/var/log/learniox")
    try:
        os.makedirs(log_dir, exist_ok=True)
    except OSError:
        log_dir = os.path.join(tempfile.gettempdir(), "learniox_logs")
        os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, f"{service_name}.json.log")
    max_bytes = int(os.getenv("LOG_FILE_MAX_BYTES", str(25 * 1024 * 1024)))
    backup_count = int(os.getenv("LOG_FILE_BACKUP_COUNT", "10"))
    try:
        file_handler = ConcurrentRotatingFileHandler(
            filename=log_file,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(level)
        root_logger.addHandler(file_handler)
    except Exception as e:
        sys.stderr.write(f"Warning: Could not initialize rotating file log handler for {log_file}: {e}\n")

    return logging.getLogger(service_name)
