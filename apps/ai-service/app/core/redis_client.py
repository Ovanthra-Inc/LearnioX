import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("learniox.ai.redis")

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2.0,
            )
            # Ping to verify connectivity
            _redis_client.ping()
            logger.info("Connected to Redis for AI service state tracking.")
        except Exception as e:
            logger.warning(f"Redis not available for AI service: {e}. Falling back to in-memory tracking.")
            _redis_client = False
    return _redis_client if _redis_client is not False else None
