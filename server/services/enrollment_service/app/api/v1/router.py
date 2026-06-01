from fastapi import APIRouter

from app.api.v1.endpoints import enrollments, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(enrollments.router, tags=["Enrollments"])
