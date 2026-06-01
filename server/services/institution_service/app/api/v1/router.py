from fastapi import APIRouter

from app.api.v1.endpoints import institutions, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(institutions.router, prefix="/institutions", tags=["Institutions"])
