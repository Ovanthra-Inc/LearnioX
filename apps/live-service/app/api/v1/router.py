from fastapi import APIRouter
from app.api.v1.endpoints.classroom import router as classroom_router
from app.api.v1.endpoints.ws import router as ws_router

api_v1_router = APIRouter()

api_v1_router.include_router(classroom_router, tags=["Live Classroom"])
api_v1_router.include_router(ws_router, tags=["WebSockets"])
