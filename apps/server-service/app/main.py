import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response
from sqlalchemy import text

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.handlers import register_exception_handlers
from app.core.middleware import (
    AccessLogMiddleware,
    RequestIDMiddleware,
    SecurityHeadersMiddleware,
    configure_json_logging,
)
from app.core.response import APIResponse
from app.database.base import Base
from app.database.session import engine

# Configure structured JSON logging before any other logging
configure_json_logging(log_level="DEBUG" if settings.DEBUG else "INFO")
logger = logging.getLogger("server-service")

# Rate limiter — keyed by client IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ─── Request Body Size Limit Middleware (MED-11) ──────────────────────────────
class RequestBodySizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Rejects requests whose Content-Length exceeds MAX_UPLOAD_SIZE bytes.
    Prevents trivial OOM DoS via oversized JSON/form bodies.
    """

    def __init__(self, app, max_bytes: int = 500 * 1024 * 1024):  # 500 MB default
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: StarletteRequest, call_next) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_bytes:
            from app.core.response import APIResponse as _APIResponse
            from fastapi.responses import JSONResponse
            body = _APIResponse.fail(
                message=f"Request body too large. Maximum allowed size is {self.max_bytes // (1024 * 1024)} MB.",
                code="REQUEST_TOO_LARGE",
            ).model_dump()
            return JSONResponse(status_code=413, content=body)
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...", extra={"service": settings.PROJECT_NAME})
    try:
        async with engine.begin() as conn:
            # Use PostgreSQL transaction advisory lock to serialize table initialization across multi-process workers
            if "postgresql" in str(engine.url):
                await conn.execute(text("SELECT pg_advisory_xact_lock(123456789)"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning("Could not automatically create database tables on startup", extra={"error": str(e)})
    yield
    logger.info("Shutting down application...")
    # Allow in-flight requests to drain before closing the DB pool
    await engine.dispose()


# Disable OpenAPI docs & Swagger UI in production
_docs_url = None if settings.is_production else "/docs"
_redoc_url = None if settings.is_production else "/redoc"
_openapi_url = None if settings.is_production else "/openapi.json"

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade FastAPI backend for LearnioX multi-tenant learning platform",
    version="1.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
    lifespan=lifespan,
)

# Attach rate limiter to app state and register rate-limit handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Middleware Execution Chain (Order Matters: Outer -> Inner) ───────────────
# 1. Security HTTP Headers
app.add_middleware(SecurityHeadersMiddleware)

# 2. Correlation ID tracking (X-Request-ID)
app.add_middleware(RequestIDMiddleware)

# 3. Request Body Size Limiter (500 MB max)
app.add_middleware(RequestBodySizeLimitMiddleware, max_bytes=settings.MAX_FILE_SIZE_MB * 1024 * 1024)

# 4. Access Logging
app.add_middleware(AccessLogMiddleware)

# 5. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers (Pydantic, HTTPException, AppException)
register_exception_handlers(app)

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Docker / Kubernetes liveness probes."""
    return APIResponse.ok(
        data={"status": "healthy", "service": settings.PROJECT_NAME},
        message="Server Service is healthy and operational",
    )
