from fastapi import APIRouter

from app.api.v1.endpoints import courses, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
# Include courses directly at root prefix since they are configured under `/courses` or `/public` etc.
router.include_router(courses.router, tags=["Courses"])
