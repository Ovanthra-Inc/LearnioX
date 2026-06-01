from fastapi import APIRouter
from app.api.v1.endpoints.bff import router as bff_router

router = APIRouter()
router.include_router(bff_router, tags=["BFF"])
