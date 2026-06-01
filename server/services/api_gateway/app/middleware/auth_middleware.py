"""
Auth middleware: verifies JWT access token LOCALLY (no network call).
On success, injects x-user-id and x-user-email into the downstream request headers.

Public paths (unauthenticated): see PUBLIC_PATH_PREFIXES below.
"""
import jwt as pyjwt
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

settings = get_settings()

# ── Public paths that pass through without token ──────────────────────────────
# Use prefix matching — any path that *starts with* one of these is allowed.
PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/api/v1/bff/public",
    "/api/v1/auth",          # login, register, verify-email, forgot-password, etc.
    "/api/v1/health",
    "/api/v1/public",
    "/api/v1/search",
    "/docs",
    "/redoc",
    "/openapi.json",
)


def _decode_jwt(token: str) -> dict | None:
    """Decode and validate JWT locally. Returns payload dict or None on failure."""
    try:
        payload = pyjwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except pyjwt.ExpiredSignatureError:
        return None
    except pyjwt.InvalidTokenError:
        return None


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # ── CORS preflight passthrough ────────────────────────────────────────
        if request.method == "OPTIONS":
            return await call_next(request)

        # ── Public paths passthrough ──────────────────────────────────────────
        if any(path.startswith(prefix) for prefix in PUBLIC_PATH_PREFIXES):
            return await call_next(request)

        # ── Extract bearer token ──────────────────────────────────────────────
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Missing or invalid Authorization header",
                    "error": {"code": "MISSING_TOKEN", "message": "Bearer token required"},
                },
            )

        token = auth_header[7:]
        payload = _decode_jwt(token)

        if payload is None:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Token invalid or expired",
                    "error": {"code": "INVALID_TOKEN", "message": "Access token is invalid or has expired"},
                },
            )

        # ── Inject identity headers ───────────────────────────────────────────
        user_id = payload.get("sub", "")
        email = payload.get("email", "")

        # Rebuild Starlette scope headers with injected identity
        existing_headers = dict(request.headers)
        existing_headers["x-user-id"] = user_id
        existing_headers["x-user-email"] = email

        scope = dict(request.scope)
        scope["headers"] = [
            (k.lower().encode("latin-1"), v.encode("latin-1"))
            for k, v in existing_headers.items()
        ]

        return await call_next(Request(scope))
