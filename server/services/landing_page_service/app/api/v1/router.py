from fastapi import APIRouter
from app.api.v1.endpoints.main_endpoints import router as main_router
router = APIRouter()
router.include_router(main_router, tags=['landing_page_service'])