from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router
from app.modules.assessments import assessments_router
from app.modules.transcription import transcription_router, legacy_test_router
from app.modules.tutor import tutor_router
from app.modules.curriculum import curriculum_router
from app.modules.video_intelligence import video_intelligence_router

api_v1_router = APIRouter(prefix="/api/v1/ai")

# 1. Health & Status
api_v1_router.include_router(health_router)

# 2. Assessment Intelligence (14 types generator & grader)
api_v1_router.include_router(assessments_router)

# 3. Lecture Audio/Video Transcription Pipeline
api_v1_router.include_router(transcription_router)

# 4. In-Classroom 24/7 AI Doubt Resolver / Tutor
api_v1_router.include_router(tutor_router)

# 5. Course Outline & Syllabus Generator
api_v1_router.include_router(curriculum_router)

# 6. Video Intelligence, Chapters & Summaries
api_v1_router.include_router(video_intelligence_router)

# 7. Backward compatibility alias for legacy tests
api_v1_router.include_router(legacy_test_router)
