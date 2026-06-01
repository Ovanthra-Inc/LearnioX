from fastapi import APIRouter
from app.api.v1.endpoints.analytics import router as analytics_router
router = APIRouter()
router.include_router(analytics_router, tags=["Analytics"])
