"""
API Gateway / BFF entrypoint.
- CORS middleware (via learniox_common.middleware)
- Auth middleware (local JWT decode)
- Correlation ID + response timing
- Redis rate limiting
- Request logging
- BFF routes + health endpoint
"""
from fastapi import FastAPI, Request
from learniox_common.middleware import add_common_middleware

from app.core.config import get_settings
from app.middleware.auth_middleware import AuthMiddleware
from app.api.v1.router import router as api_v1_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="API Gateway / BFF for LearnioX — aggregates all microservices",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Common middleware (CORS, exception handlers, correlation ID, rate limit) ──
origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",")]
add_common_middleware(app, cors_origins=origins, redis_url=settings.REDIS_URL, rate_limit=settings.RATE_LIMIT_PER_MINUTE)

# ── Auth middleware (JWT verification, must run AFTER CORS) ───────────────────
app.add_middleware(AuthMiddleware)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/api/v1/health")
async def health():
    return {"success": True, "data": {"status": "healthy", "service": settings.SERVICE_NAME}}
