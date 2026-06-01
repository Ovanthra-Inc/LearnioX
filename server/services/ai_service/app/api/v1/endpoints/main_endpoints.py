import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.ai_job import AIJob, AIJobType, AIJobStatus
from app.schemas.schemas import (
    GenerateCourseOutlineRequest, GenerateLessonPlanRequest,
    GenerateQuizRequest, GenerateMarketingCopyRequest, AIJobResponse,
)
from learniox_common.schemas import APIResponse
from pydantic import BaseModel

router = APIRouter()


def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


def _jr(j) -> AIJobResponse:
    return AIJobResponse(
        id=j.id, institution_id=j.institution_id, requested_by_user_id=j.requested_by_user_id,
        job_type=j.job_type.value, status=j.status.value,
        input_payload=j.input_payload, output_payload=j.output_payload,
        error_message=j.error_message, provider=j.provider, model_name=j.model_name,
        created_at=j.created_at, updated_at=j.updated_at,
    )


def _dispatch(job_id: str):
    """Enqueue Celery task — gracefully no-ops if Celery/Redis not available."""
    try:
        from app.workers.celery_app import run_ai_job
        run_ai_job.apply_async(args=[job_id], queue="ai_jobs")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Celery dispatch failed (job will remain QUEUED): {e}")


async def _create_job(
    db: AsyncSession, user_id: uuid.UUID, job_type: AIJobType,
    payload: dict, institution_id: uuid.UUID | None = None, model: str | None = None,
) -> AIJob:
    job = AIJob(
        requested_by_user_id=user_id, institution_id=institution_id,
        job_type=job_type, status=AIJobStatus.QUEUED,
        input_payload=payload, model_name=model,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    # Enqueue for async execution
    _dispatch(str(job.id))
    return job


# ── Generate Endpoints ────────────────────────────────────────────────────────

@router.post("/ai/generate/course-outline", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_course_outline(
    request: GenerateCourseOutlineRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    """Queue course outline generation. Poll GET /ai/jobs/{id} for result."""
    job = await _create_job(db, user_id, AIJobType.COURSE_OUTLINE, request.model_dump(), request.institution_id)
    return APIResponse(success=True, message="Course outline generation queued", data=_jr(job))


@router.post("/ai/generate/lesson-plan", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_lesson_plan(
    request: GenerateLessonPlanRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.LESSON_PLAN, request.model_dump())
    return APIResponse(success=True, message="Lesson plan generation queued", data=_jr(job))


@router.post("/ai/generate/quiz", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_quiz(
    request: GenerateQuizRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.QUIZ_GENERATION, request.model_dump())
    return APIResponse(success=True, message="Quiz generation queued", data=_jr(job))


@router.post("/ai/generate/marketing-copy", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_marketing_copy(
    request: GenerateMarketingCopyRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.MARKETING_COPY, request.model_dump())
    return APIResponse(success=True, message="Marketing copy generation queued", data=_jr(job))


class VideoAnalysisRequest(BaseModel):
    transcript: str
    course_title: str | None = None
    duration_seconds: int | None = None
    institution_id: uuid.UUID | None = None


@router.post("/ai/generate/video-summary", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_video_summary(
    request: VideoAnalysisRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.VIDEO_SUMMARY, request.model_dump(), request.institution_id)
    return APIResponse(success=True, message="Video summary generation queued", data=_jr(job))


@router.post("/ai/generate/video-chapters", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_video_chapters(
    request: VideoAnalysisRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.VIDEO_CHAPTERS, request.model_dump(), request.institution_id)
    return APIResponse(success=True, message="Video chapters generation queued", data=_jr(job))


class DoubtAnswerRequest(BaseModel):
    question: str
    course_title: str | None = None
    institution_id: uuid.UUID | None = None


@router.post("/ai/generate/doubt-answer", response_model=APIResponse[AIJobResponse], status_code=202)
async def generate_doubt_answer(
    request: DoubtAnswerRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    job = await _create_job(db, user_id, AIJobType.DOUBT_DRAFT_ANSWER, request.model_dump(), request.institution_id)
    return APIResponse(success=True, message="Draft answer generation queued", data=_jr(job))


# ── Job Status ────────────────────────────────────────────────────────────────

@router.get("/ai/jobs/{job_id}", response_model=APIResponse[AIJobResponse])
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIJob).where(AIJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return APIResponse(success=True, message="Job retrieved", data=_jr(job))


@router.get("/ai/jobs", response_model=APIResponse[list[AIJobResponse]])
async def list_my_jobs(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AIJob).where(AIJob.requested_by_user_id == user_id)
        .order_by(AIJob.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return APIResponse(success=True, message="Jobs retrieved", data=[_jr(j) for j in result.scalars().all()])


@router.delete("/ai/jobs/{job_id}", response_model=APIResponse[dict])
async def cancel_job(
    job_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIJob).where(AIJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.requested_by_user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if job.status in (AIJobStatus.COMPLETED, AIJobStatus.FAILED):
        raise HTTPException(status_code=400, detail="Cannot cancel a finished job")
    job.status = AIJobStatus.FAILED
    job.error_message = "Cancelled by user"
    await db.commit()
    return APIResponse(success=True, message="Job cancelled", data={})


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy", "worker": "celery"})
