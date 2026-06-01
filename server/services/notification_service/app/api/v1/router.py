from fastapi import APIRouter
from app.api.v1.endpoints.notifications import router as notif_router
router = APIRouter()
router.include_router(notif_router, tags=["Notifications"])
