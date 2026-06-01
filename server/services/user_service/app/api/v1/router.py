from fastapi import APIRouter

from app.api.v1.endpoints import profiles, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(profiles.router, prefix="/users", tags=["Profiles"])
