from pydantic import BaseModel
from uuid import UUID


class EnrollCourseRequest(BaseModel):
    user_id: UUID | None = None          # optional; caller can override (e.g. admin enrolling a user)
    institution_id: UUID                  # required so enrollment knows which institution owns the course
    source: str = "free"
    payment_id: UUID | None = None
    subscription_id: UUID | None = None


class CourseAccessCheckRequest(BaseModel):
    user_id: UUID
    course_id: UUID


class LessonAccessCheckRequest(BaseModel):
    user_id: UUID
    lesson_id: UUID
    course_id: UUID


class BulkAccessCheckRequest(BaseModel):
    user_id: UUID
    course_ids: list[UUID] = []
    lesson_ids: list[UUID] = []
