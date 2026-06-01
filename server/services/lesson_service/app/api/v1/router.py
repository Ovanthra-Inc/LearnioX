from fastapi import APIRouter

from app.api.v1.endpoints import curriculum, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
# Include curriculum endpoints directly at the root since they define courses/modules/lessons prefixes.
router.include_router(curriculum.router, tags=["Curriculum"])
