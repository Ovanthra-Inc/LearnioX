from pydantic import BaseModel
from uuid import UUID


class CreateModuleRequest(BaseModel):
    title: str
    description: str | None = None
    order_index: int = 0


class UpdateModuleRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    order_index: int | None = None


class CreateLessonRequest(BaseModel):
    title: str
    description: str | None = None
    lesson_type: str = "video"
    access_type: str = "enrolled_only"
    order_index: int = 0
    video_id: UUID | None = None
    asset_id: UUID | None = None
    content: str | None = None
    external_url: str | None = None
    duration_seconds: int | None = None


class UpdateLessonRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    access_type: str | None = None
    video_id: UUID | None = None
    asset_id: UUID | None = None
    content: str | None = None
    external_url: str | None = None
    duration_seconds: int | None = None


class ReorderCurriculumRequest(BaseModel):
    modules: list[dict]
