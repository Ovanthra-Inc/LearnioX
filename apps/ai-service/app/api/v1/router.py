from fastapi import APIRouter
from app.api.v1.endpoints import assessments, health
from app.features.lecture_transcription_test.api.transcription_test import (
    router as transcription_test_router,
)

api_v1_router = APIRouter(prefix="/api/v1/ai")

api_v1_router.include_router(health.router)
api_v1_router.include_router(assessments.router)
api_v1_router.include_router(transcription_test_router)
