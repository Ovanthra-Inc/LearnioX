from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1.endpoints.media import router as media_router

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, version="1.0.0")
origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",")]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(media_router, prefix=settings.API_V1_PREFIX)
