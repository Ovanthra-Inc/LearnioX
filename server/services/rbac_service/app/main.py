from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1.router import router as api_v1_router
from app.db.session import AsyncSessionLocal
from app.services.rbac_seed_service import RBACSeedService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        await RBACSeedService.seed_system_roles_and_permissions(db)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="RBAC and team membership microservice for LearnioX",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

if settings.CORS_ALLOWED_ORIGINS:
    origins = [origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
