from app.modules.transcription.schemas import (
    TranscriptionJobStatus,
    TranscriptSegment,
    TranscriptionUploadResponse,
    TranscriptionStatusResponse,
    TranscriptionResultResponse,
)
from app.modules.transcription.service import (
    TranscriptionModuleService,
    transcription_module_service,
)
from app.modules.transcription.router import router as transcription_router
from fastapi import APIRouter

# Backward compatibility alias for legacy /test/lecture-transcription route
legacy_test_router = APIRouter(prefix="/test/lecture-transcription", tags=["Test — Lecture Transcription"])
for route in transcription_router.routes:
    legacy_test_router.routes.append(route)

__all__ = [
    "TranscriptionJobStatus",
    "TranscriptSegment",
    "TranscriptionUploadResponse",
    "TranscriptionStatusResponse",
    "TranscriptionResultResponse",
    "TranscriptionModuleService",
    "transcription_module_service",
    "transcription_router",
    "legacy_test_router",
]
