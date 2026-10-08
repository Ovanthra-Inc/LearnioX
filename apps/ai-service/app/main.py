from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.telemetry import setup_telemetry
from app.api.v1.router import api_v1_router
from app.schemas.response import APIResponse

logger = setup_logging("ai-service", log_level="DEBUG" if settings.DEBUG else "INFO")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_telemetry(app, "ai-service")
    logger.info(f"Starting LearnioX AI Microservice on port {settings.AI_SERVICE_PORT}...")
    logger.info(f"Environment: {settings.ENVIRONMENT} | AI Model: {settings.AI_MODEL_NAME}")
    if settings.GEMINI_API_KEY:
        logger.info("Google Gemini AI API Key is configured and ready.")
    else:
        if settings.ENVIRONMENT.lower() == "production":
            raise RuntimeError("CRITICAL CONFIGURATION ERROR: GEMINI_API_KEY must be set in production mode!")
        logger.warning("GEMINI_API_KEY not set — running with local deterministic simulation mode.")
    yield
    logger.info("Shutting down LearnioX AI Microservice...")


app = FastAPI(
    title="LearnioX AI Intelligence & Assessment Microservice",
    version="1.0.0",
    description="Dedicated microservice for 14-type assessment grading, automated quiz generation, and AI intelligence.",
    docs_url="/docs",
    redoc_url="/redoc",
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

from app.middleware.auth import AIAuthRateLimitMiddleware
app.add_middleware(AIAuthRateLimitMiddleware)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "ai-service-req")
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


from app.core.exceptions import AIServiceException


@app.exception_handler(AIServiceException)
async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    logger.warning(f"AI Service Domain Exception on {request.url.path}: {exc.message} ({exc.code})")
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse.fail(
            message=exc.message,
            code=exc.code,
            details=exc.details,
        ).model_dump(),
    )


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled AI Service Error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content=APIResponse.fail(
            message="An unexpected error occurred in AI Service",
            code="AI_SERVICE_INTERNAL_ERROR",
            details=[str(exc)],
        ).model_dump(),
    )


# Health check on root
@app.get("/health", tags=["Health"])
@app.get("/ready", tags=["Health"])
async def root_health():
    return APIResponse.ok(
        data={"service": "ai-service", "status": "healthy"},
        message="LearnioX AI Service is operational",
    )


# Register API v1
app.include_router(api_v1_router)
