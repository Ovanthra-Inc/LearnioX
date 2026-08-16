from fastapi import APIRouter
from app.api.v1.endpoints import assessments, health

api_v1_router = APIRouter(prefix="/api/v1/ai")

api_v1_router.include_router(health.router)
api_v1_router.include_router(assessments.router)
