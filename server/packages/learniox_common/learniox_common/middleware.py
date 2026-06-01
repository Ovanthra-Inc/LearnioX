"""
learniox_common/middleware.py — shared middleware for all services.

Usage in main.py:
    from learniox_common.middleware import add_common_middleware
    add_common_middleware(app)
"""
import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


# ── Global Exception Handler ──────────────────────────────────────────────────

def add_exception_handlers(app: FastAPI) -> None:
    """Register consistent JSON error responses for unhandled exceptions."""

    from fastapi import HTTPException
    from pydantic import ValidationError

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail,
                "error": {"code": f"HTTP_{exc.status_code}", "message": exc.detail},
            },
        )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": "Validation error",
                "error": {"code": "VALIDATION_ERROR", "details": exc.errors()},
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"},
            },
        )


# ── Request Correlation ID ────────────────────────────────────────────────────

class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """Injects x-correlation-id into every request/response for distributed tracing."""

    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())[:8]
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        response.headers["x-correlation-id"] = correlation_id
        response.headers["x-response-time-ms"] = str(duration_ms)
        logger.info(
            f"{request.method} {request.url.path} → {response.status_code} [{duration_ms}ms] cid={correlation_id}"
        )
        return response


# ── Rate Limiting (Redis-based) ───────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple sliding-window rate limiter using Redis.
    Skips gracefully if Redis is unavailable (fail-open).
    """

    def __init__(self, app, redis_url: str | None = None, limit: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window_seconds
        self._redis = None
        if redis_url:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(redis_url, decode_responses=True)
            except ImportError:
                logger.warning("redis package not installed — rate limiting disabled")

    async def dispatch(self, request: Request, call_next):
        if not self._redis:
            return await call_next(request)

        # Use IP + path-prefix as key (coarser than per-endpoint to reduce Redis load)
        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}"

        try:
            pipe = self._redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.window)
            results = await pipe.execute()
            count = results[0]

            if count > self.limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "message": "Too many requests",
                        "error": {"code": "RATE_LIMITED", "message": f"Limit: {self.limit} req/{self.window}s"},
                    },
                    headers={"Retry-After": str(self.window)},
                )
        except Exception as e:
            logger.warning(f"Rate limit check failed (fail-open): {e}")

        return await call_next(request)


# ── Convenience: add all common middleware to a FastAPI app ───────────────────

def add_common_middleware(
    app: FastAPI,
    cors_origins: list[str] | None = None,
    redis_url: str | None = None,
    rate_limit: int = 120,
) -> None:
    """Call this from any service's main.py instead of manually adding each middleware."""
    # Exception handlers first
    add_exception_handlers(app)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Correlation ID + timing
    app.add_middleware(CorrelationIDMiddleware)

    # Rate limiting (skips if no Redis URL)
    if redis_url:
        app.add_middleware(RateLimitMiddleware, redis_url=redis_url, limit=rate_limit)
