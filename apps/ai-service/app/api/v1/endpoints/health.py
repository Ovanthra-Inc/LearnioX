from fastapi import APIRouter
from app.schemas.response import APIResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=APIResponse[dict])
async def health_check():
    return APIResponse.ok(
        data={
            "service": "ai-service",
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "ai_configured": bool(settings.GEMINI_API_KEY),
            "model": settings.AI_MODEL_NAME,
        },
        message="AI Service is operational",
    )
