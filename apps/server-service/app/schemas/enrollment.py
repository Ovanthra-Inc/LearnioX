from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class EnrollRequest(BaseModel):
    access_type: str = Field("FREE", pattern="^(FREE|PURCHASED|MEMBERSHIP|ADMIN_GRANTED)$")
    coupon_code: Optional[str] = None


class UpdateEnrollmentRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(ACTIVE|COMPLETED|CANCELLED|EXPIRED)$")
    expires_at: Optional[datetime] = None


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    enrollment_id: UUID
    course_id: UUID
    user_id: UUID
    status: str
    access_type: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class EnrollmentListResponse(BaseModel):
    items: List[EnrollmentResponse]
    total: int
    page: int
    limit: int
    pages: int


class StartLessonRequest(BaseModel):
    started_at: Optional[datetime] = None


class UpdateProgressRequest(BaseModel):
    watch_time: int = Field(..., ge=0)
    last_position: int = Field(..., ge=0)
    progress_percentage: int = Field(..., ge=0, le=100)


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lesson_id: UUID
    status: str
    progress_percentage: int
    watch_time: int
    last_position: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CourseProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: UUID
    completed_lessons: int
    total_lessons: int
    progress_percentage: float
    last_lesson_id: Optional[UUID] = None


class CompletionResponse(BaseModel):
    completed: bool
    completed_at: Optional[datetime] = None
    percentage: float


class BookmarkRequest(BaseModel):
    timestamp_seconds: int = Field(..., ge=0)
    note: Optional[str] = Field(None, max_length=255)


class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    lesson_id: UUID
    timestamp_seconds: int
    note: Optional[str] = None
    created_at: datetime


class ContinueLearningItem(BaseModel):
    course_id: UUID
    course_title: str
    last_lesson_id: Optional[UUID] = None
    last_lesson_title: Optional[str] = None
    last_position: int = 0
    progress_percentage: float = 0.0


class ContinueLearningResponse(BaseModel):
    items: List[ContinueLearningItem]


class LearningHistoryItem(BaseModel):
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_title: str
    last_viewed_at: datetime


class EnrollmentStatisticsResponse(BaseModel):
    total_students: int
    active_students: int
    completed_students: int
    average_progress: float
    completion_rate: float
