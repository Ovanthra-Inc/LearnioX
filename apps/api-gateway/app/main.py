import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.middleware.request_id import GatewayRequestIDMiddleware
from app.middleware.auth_claims import GatewayAuthClaimsMiddleware
from app.registry.routes import SERVICE_REGISTRY
from app.router.proxy import router as proxy_router

logger = logging.getLogger("gateway")

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing LearnioX BFF API Gateway...")
    yield
    logger.info("Shutting down API Gateway...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="LearnioX Central BFF API Gateway & Microservices Router",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# Rate Limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware Pipeline
app.add_middleware(GatewayRequestIDMiddleware)
app.add_middleware(GatewayAuthClaimsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID", "Accept"],
)

# Gateway Operational Endpoints
@app.get("/health", tags=["Health"])
async def gateway_health():
    return {
        "success": True,
        "message": "LearnioX BFF API Gateway is operational",
        "data": {
            "status": "healthy",
            "service": "api-gateway",
            "environment": settings.ENVIRONMENT,
        },
        "error": None,
    }


@app.get("/gateway/routes", tags=["Routes"])
async def list_gateway_routes():
    return {
        "success": True,
        "message": "Active Microservice Route Registry",
        "data": {
            "routes": [r.to_dict() for r in SERVICE_REGISTRY],
        },
        "error": None,
    }


# Include Microservice Reverse Proxy Router
app.include_router(proxy_router)
