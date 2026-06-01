import uuid
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class TrackEventRequest(BaseModel):
    event_name: str
    user_id: UUID | None = None
    institution_id: UUID | None = None
    course_id: UUID | None = None
    lesson_id: UUID | None = None
    session_id: str | None = None
    source: str | None = None
    properties: dict | None = None


class BatchTrackEventRequest(BaseModel):
    events: list[TrackEventRequest]


class AnalyticsEventResponse(BaseModel):
    id: UUID
    event_name: str
    user_id: UUID | None
    institution_id: UUID | None
    course_id: UUID | None
    lesson_id: UUID | None
    session_id: str | None
    source: str | None
    properties: dict | None
    created_at: datetime


class InstitutionAnalyticsOverviewResponse(BaseModel):
    institution_id: UUID
    total_learners: int = 0
    total_courses: int = 0
    total_watch_time_seconds: int = 0
    active_learners: int = 0


class CourseAnalyticsOverviewResponse(BaseModel):
    course_id: UUID
    total_views: int = 0
    total_enrollments: int = 0
    completion_rate: float = 0.0
    average_watch_percentage: float = 0.0
