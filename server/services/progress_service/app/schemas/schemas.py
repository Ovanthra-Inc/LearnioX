from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class WatchProgressRequest(BaseModel):
    user_id: UUID | None = None
    course_id: UUID
    lesson_id: UUID
    watched_seconds: int
    duration_seconds: int | None = None


class MarkLessonCompleteRequest(BaseModel):
    user_id: UUID | None = None
    course_id: UUID
    lesson_id: UUID


class RecalculateCourseProgressRequest(BaseModel):
    user_id: UUID
    course_id: UUID
    total_lessons: int


class LessonProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    lesson_id: UUID
    watched_seconds: int
    duration_seconds: int | None
    is_completed: bool
    completed_at: datetime | None
    last_watched_at: datetime | None


class CourseProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    total_lessons: int
    completed_lessons: int
    completion_percentage: float
    last_lesson_id: UUID | None
    is_completed: bool
    completed_at: datetime | None


class ContinueLearningItemResponse(BaseModel):
    course_id: UUID
    last_lesson_id: UUID | None
    completion_percentage: float
    is_completed: bool
