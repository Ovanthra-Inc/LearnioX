import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis.asyncio import ConnectionPool

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.telemetry import setup_telemetry
from app.database.base import Base
from app.database.session import engine
from app.ws.connection_manager import ws_manager

logger = setup_logging("live-service", log_level="DEBUG" if settings.DEBUG else "INFO")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_telemetry(app, "live-service", engine=engine)
    logger.info("Initializing LearnioX Live Classroom Service...")
    logger.info(f"Environment: {settings.ENVIRONMENT} | Port: {settings.PORT} | Media Provider: {settings.MEDIA_PROVIDER}")

    # 1. Initialize PostgreSQL database tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Live Classroom database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")

    # 2. Initialize Redis connection pool for WebSocket Pub/Sub
    try:
        redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            db=settings.REDIS_DB,
            decode_responses=True,
            max_connections=50,
        )
        ws_manager.initialize_redis(redis_pool)
        logger.info("Redis Pub/Sub Connection Pool initialized for live-service.")
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}. Running with in-memory fallback.")

    yield

    logger.info("Shutting down LearnioX Live Classroom Service...")
    if ws_manager.redis_pool:
        await ws_manager.redis_pool.disconnect()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="LearnioX Live Virtual Classroom, WebSockets signaling, and attendance service",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "live-req")
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error in live-service: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal error occurred in Live Classroom service.",
            "data": None,
            "error": {"code": "INTERNAL_SERVER_ERROR", "details": [str(exc)]},
        },
    )


# Health check endpoints
@app.get("/health", tags=["Health"])
@app.get("/ready", tags=["Health"])
@app.get("/api/v1/live/health", tags=["Health"])
@app.get("/api/v1/live/ready", tags=["Health"])
async def live_health():
    return {
        "success": True,
        "message": "Live Classroom service is healthy and operational",
        "data": {
            "status": "healthy",
            "service": "live-service",
            "media_provider": settings.MEDIA_PROVIDER,
            "environment": settings.ENVIRONMENT,
        },
        "error": None,
    }


# Include API v1 Router explicitly with /api/v1/live
app.include_router(api_v1_router, prefix="/api/v1/live")
