"""
Core middleware package for LearnioX Server Service.

Contains:
- RequestIDMiddleware  — generates a server-side X-Request-ID on every request  (LOW-05)
- SecurityHeadersMiddleware — injects OWASP-recommended HTTP security headers  (LOW-07)
- AccessLogMiddleware — JSON-structured request access log

Rate limiting is configured in main.py via slowapi.
"""
import logging
import time
import uuid
from pythonjsonlogger import jsonlogger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


# ─── Structured JSON Logger Setup ────────────────────────────────────────────
def configure_json_logging(log_level: str = "INFO") -> None:
    """
    Replace the default basicConfig formatter with a JSON formatter.
    Call this once at application startup before any other logging.
    """
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ",
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))


# ─── Request ID Middleware (LOW-05 fix) ───────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Generates a server-side UUID for every request (X-Request-ID).
    The client-supplied header is IGNORED to prevent correlation-ID spoofing.
    The ID is echoed in the response and stored in request.state.request_id.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Always generate server-side — never trust client-supplied value
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


# ─── Security Headers Middleware (LOW-07) ─────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds OWASP-recommended HTTP security headers to every response.
    These are equivalent to Node.js Helmet.js defaults.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Only add HSTS in production (avoids breaking local HTTP dev)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


# ─── Access Log Middleware ─────────────────────────────────────────────────────
class AccessLogMiddleware(BaseHTTPMiddleware):
    """
    Emits a structured JSON access log entry for every HTTP request.
    Fields: method, path, status_code, duration_ms, request_id.
    """

    def __init__(self, app, logger_name: str = "server-service.access"):
        super().__init__(app)
        self.logger = logging.getLogger(logger_name)

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "-")

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        self.logger.info(
            "HTTP request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "request_id": request_id,
                "client": request.client.host if request.client else "unknown",
            },
        )
        return response
