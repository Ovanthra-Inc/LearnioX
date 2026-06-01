import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.repositories.analytics_repository import AnalyticsRepository
from app.models.analytics_event import AnalyticsEvent
from app.schemas.schemas import (
    TrackEventRequest, BatchTrackEventRequest, AnalyticsEventResponse,
    InstitutionAnalyticsOverviewResponse, CourseAnalyticsOverviewResponse,
)
from learniox_common.schemas import APIResponse

router = APIRouter()


def _ae(e) -> AnalyticsEventResponse:
    return AnalyticsEventResponse(
        id=e.id, event_name=e.event_name, user_id=e.user_id,
        institution_id=e.institution_id, course_id=e.course_id, lesson_id=e.lesson_id,
        session_id=e.session_id, source=e.source, properties=e.properties, created_at=e.created_at,
    )


@router.post("/analytics/track", response_model=APIResponse[AnalyticsEventResponse])
async def track_event(request: TrackEventRequest, db: AsyncSession = Depends(get_db)):
    repo = AnalyticsRepository(db)
    event = AnalyticsEvent(**request.model_dump())
    saved = await repo.track(event)
    return APIResponse(success=True, message="Event tracked", data=_ae(saved))


@router.post("/analytics/track/batch", response_model=APIResponse[dict])
async def batch_track_events(request: BatchTrackEventRequest, db: AsyncSession = Depends(get_db)):
    repo = AnalyticsRepository(db)
    events = [AnalyticsEvent(**e.model_dump()) for e in request.events]
    await repo.bulk_track(events)
    return APIResponse(success=True, message=f"{len(events)} events tracked", data={"count": len(events)})


@router.get("/analytics/institutions/{institution_id}", response_model=APIResponse[InstitutionAnalyticsOverviewResponse])
async def institution_analytics(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return APIResponse(
        success=True, message="Institution analytics",
        data=InstitutionAnalyticsOverviewResponse(institution_id=institution_id),
    )


@router.get("/analytics/courses/{course_id}", response_model=APIResponse[CourseAnalyticsOverviewResponse])
async def course_analytics(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return APIResponse(
        success=True, message="Course analytics",
        data=CourseAnalyticsOverviewResponse(course_id=course_id),
    )


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
