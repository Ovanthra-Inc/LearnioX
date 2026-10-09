import time
import logging
from typing import Dict, Tuple
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.schemas.response import APIResponse

from app.core.config import settings

logger = logging.getLogger("learniox.ai-service.auth")

# In-memory sliding window rate limiter: user_id -> (timestamp, count)
_user_rate_limits: Dict[str, Tuple[float, int]] = {}
WINDOW_SECONDS = 60.0

EXEMPT_PATHS = {
    "/health",
    "/ready",
    "/api/v1/ai/health",
    "/api/v1/ai/ready",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/",
}


class AIAuthRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Validates X-User-ID header injected by API Gateway.
    Prevents unauthorized quota burn and limits AI generation requests per user.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Exempt health and docs endpoints
        if path in EXEMPT_PATHS or not path.startswith("/api/"):
            return await call_next(request)

        user_id = request.headers.get("x-user-id")
        if not user_id:
            logger.warning(f"Unauthenticated AI request blocked on {path} — missing X-User-ID")
            return JSONResponse(
                status_code=401,
                content=APIResponse.fail(
                    message="Missing authentication identity. X-User-ID header required from API Gateway.",
                    code="UNAUTHORIZED",
                ).model_dump(),
            )

        # Per-user rate limiting
        now = time.time()
        window_start, count = _user_rate_limits.get(user_id, (now, 0))

        if now - window_start > WINDOW_SECONDS:
            _user_rate_limits[user_id] = (now, 1)
        else:
            if count >= settings.AI_RATE_LIMIT_PER_MINUTE:
                logger.warning(f"Rate limit exceeded for user {user_id} on {path}")
                return JSONResponse(
                    status_code=429,
                    content=APIResponse.fail(
                        message="AI generation rate limit exceeded. Please wait a minute before submitting further requests.",
                        code="RATE_LIMIT_EXCEEDED",
                    ).model_dump(),
                )
            _user_rate_limits[user_id] = (window_start, count + 1)

        # Clean up stale rate limit entries periodically
        if len(_user_rate_limits) > 5000:
            stale_keys = [k for k, (t, _) in _user_rate_limits.items() if now - t > WINDOW_SECONDS * 2]
            for k in stale_keys:
                _user_rate_limits.pop(k, None)

        return await call_next(request)
