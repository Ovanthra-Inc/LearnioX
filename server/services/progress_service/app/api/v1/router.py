from fastapi import APIRouter
from app.api.v1.endpoints.progress import router as progress_router

router = APIRouter()
router.include_router(progress_router, tags=["Progress"])
