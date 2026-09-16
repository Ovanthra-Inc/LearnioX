"""
LearnioX Redis Cache Layer
--------------------------
Async Redis connection pool with tenant-safe key namespacing.

Key Naming Convention:
    user:{user_id}:profile
    inst:{institution_id}:member:{user_id}:perms
    inst:{institution_id}:courses:list
    search:courses:{hash_of_params}
    discovery:trending:courses

Usage:
    from app.cache.redis_client import get_redis, cache_get, cache_set, cache_delete, tenant_key
"""
import hashlib
import json
import logging
from typing import Any, Optional
from uuid import UUID

from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger("server-service.cache")

_redis_pool: Optional[ConnectionPool] = None


def create_redis_pool() -> ConnectionPool:
    """Create the global async Redis connection pool. Call once in lifespan."""
    return ConnectionPool.from_url(
        settings.REDIS_URL,
        db=settings.REDIS_DB,
        encoding="utf-8",
        decode_responses=True,
        max_connections=50,
        socket_connect_timeout=5,
        socket_keepalive=True,
        health_check_interval=30,
    )


def set_redis_pool(pool: ConnectionPool) -> None:
    global _redis_pool
    _redis_pool = pool


def get_redis_pool() -> Optional[ConnectionPool]:
    return _redis_pool


async def get_redis() -> Optional[Redis]:
    """
    FastAPI dependency that yields a Redis client using the shared pool.
    Returns None gracefully if pool not initialized — callers treat as cache miss.
    """
    if _redis_pool is None:
        logger.warning("Redis pool not initialized; caching disabled for this request.")
        return None
    return Redis(connection_pool=_redis_pool)


# ─── Key Builders ─────────────────────────────────────────────────────────────

def tenant_key(institution_id: Any, resource: str, *parts: str) -> str:
    """Build a tenant-namespaced Redis key.
    Example: tenant_key(inst_id, "courses", "list") -> "inst:{id}:courses:list"
    """
    base = f"inst:{institution_id}:{resource}"
    if parts:
        base = f"{base}:{':'.join(str(p) for p in parts)}"
    return base


def user_key(user_id: Any, resource: str, *parts: str) -> str:
    """Build a user-scoped Redis key."""
    base = f"user:{user_id}:{resource}"
    if parts:
        base = f"{base}:{':'.join(str(p) for p in parts)}"
    return base


def search_key(resource: str, **params: Any) -> str:
    """Build a stable search cache key from query params using a SHA-1 hash."""
    param_str = json.dumps(params, sort_keys=True, default=str)
    param_hash = hashlib.sha1(param_str.encode()).hexdigest()[:12]
    return f"search:{resource}:{param_hash}"


# ─── Cache Operations ─────────────────────────────────────────────────────────

async def cache_get(redis: Optional[Redis], key: str) -> Optional[Any]:
    """Retrieve a JSON-serialized value from Redis. Returns None on miss or error."""
    if redis is None:
        return None
    try:
        raw = await redis.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (RedisError, json.JSONDecodeError) as e:
        logger.warning("Cache GET failed", extra={"key": key, "error": str(e)})
        return None


async def cache_set(redis: Optional[Redis], key: str, value: Any, ttl: int = 60) -> bool:
    """Serialize and store a value in Redis with a TTL. Returns True on success."""
    if redis is None:
        return False
    try:
        serialized = json.dumps(value, default=str)
        await redis.setex(key, ttl, serialized)
        return True
    except (RedisError, TypeError) as e:
        logger.warning("Cache SET failed", extra={"key": key, "error": str(e)})
        return False


async def cache_delete(redis: Optional[Redis], key: str) -> bool:
    """Delete a single Redis key."""
    if redis is None:
        return False
    try:
        await redis.delete(key)
        return True
    except RedisError as e:
        logger.warning("Cache DELETE failed", extra={"key": key, "error": str(e)})
        return False


async def cache_delete_pattern(redis: Optional[Redis], pattern: str) -> int:
    """
    Delete all keys matching a glob pattern using SCAN (safe for production).
    Never uses KEYS command which blocks the Redis event loop.
    """
    if redis is None:
        return 0
    deleted = 0
    try:
        async for key in redis.scan_iter(match=pattern, count=100):
            await redis.delete(key)
            deleted += 1
    except RedisError as e:
        logger.warning("Cache DELETE PATTERN failed", extra={"pattern": pattern, "error": str(e)})
    return deleted


async def cache_incr(redis: Optional[Redis], key: str, ttl: int = 60) -> int:
    """
    Atomic increment for rate limiting counters.
    Sets TTL only on first creation (INCR + EXPIRE NX pattern).
    """
    if redis is None:
        return 0
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, ttl)
        return count
    except RedisError as e:
        logger.warning("Cache INCR failed", extra={"key": key, "error": str(e)})
        return 0


async def acquire_lock(redis: Optional[Redis], key: str, ttl: int = 30) -> bool:
    """
    Acquire a distributed lock using SET NX EX pattern.
    Returns True if lock was acquired, False if already held by another worker.
    Fails open (returns True) if Redis is unavailable to prevent deadlock.
    """
    if redis is None:
        return True  # Fail open
    try:
        result = await redis.set(f"lock:{key}", "1", nx=True, ex=ttl)
        return result is True
    except RedisError as e:
        logger.warning("Cache LOCK failed", extra={"key": key, "error": str(e)})
        return True  # Fail open


async def release_lock(redis: Optional[Redis], key: str) -> None:
    """Release a distributed lock."""
    await cache_delete(redis, f"lock:{key}")


async def check_redis_health(redis: Optional[Redis]) -> bool:
    """Ping Redis to verify connectivity. Used in detailed health checks."""
    if redis is None:
        return False
    try:
        return await redis.ping()
    except RedisError:
        return False
