from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class CourseModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    description: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    module_id: UUID
    title: str
    description: str | None
    lesson_type: str
    access_type: str
    order_index: int
    video_id: UUID | None
    asset_id: UUID | None
    content: str | None
    external_url: str | None
    duration_seconds: int | None
    is_published: bool
    metadata_json: dict | None
    created_at: datetime
    updated_at: datetime


class CurriculumResponse(BaseModel):
    course_id: UUID
    modules: list[CourseModuleResponse]
    lessons: list[LessonResponse]
