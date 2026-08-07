from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class CreateModuleRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    is_free: bool = False


class UpdateModuleRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    is_free: Optional[bool] = None


class ReorderModulesRequest(BaseModel):
    module_ids: List[UUID] = Field(..., description="Ordered list of module UUIDs")


class ModuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    description: Optional[str] = None
    position: int
    is_free: bool
    is_published: bool
    created_at: datetime


class CreateLessonRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    lesson_type: str = Field("VIDEO", pattern="^(VIDEO|PDF|QUIZ|ASSIGNMENT|LIVE|LINK)$")
    visibility: str = Field("ENROLLED", pattern="^(PUBLIC|ENROLLED|MEMBERSHIP|PRIVATE)$")
    is_preview: bool = False


class UpdateLessonRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    visibility: Optional[str] = Field(None, pattern="^(PUBLIC|ENROLLED|MEMBERSHIP|PRIVATE)$")
    is_preview: Optional[bool] = None


class ReorderLessonsRequest(BaseModel):
    lesson_ids: List[UUID] = Field(..., description="Ordered list of lesson UUIDs")


class ScheduleLessonRequest(BaseModel):
    publish_at: datetime


class LessonVisibilityRequest(BaseModel):
    visibility: str = Field(..., pattern="^(PUBLIC|ENROLLED|MEMBERSHIP|PRIVATE)$")


class PreviewRequest(BaseModel):
    is_preview: bool


class DurationRequest(BaseModel):
    duration: int = Field(..., ge=0)


class AttachContentRequest(BaseModel):
    file_id: Optional[UUID] = None
    external_url: Optional[str] = None
    text_content: Optional[str] = None
    content_type: str = Field("VIDEO", pattern="^(VIDEO|PDF|FILE|LINK|TEXT)$")


class LessonContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    file_id: Optional[UUID] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    text_content: Optional[str] = None
    content_type: str
    created_at: datetime


class ResourceRequest(BaseModel):
    file_id: UUID
    title: str = Field(..., max_length=255)


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    file_id: UUID
    file_url: Optional[str] = None
    title: str
    created_at: datetime


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    module_id: UUID
    title: str
    description: Optional[str] = None
    lesson_type: str
    duration: int = 0
    visibility: str
    status: str
    scheduled_at: Optional[datetime] = None
    is_preview: bool
    position: int
    content: Optional[LessonContentResponse] = None
    resources: List[ResourceResponse] = Field(default_factory=list)
    created_at: datetime


class CourseStructureModuleResponse(ModuleResponse):
    lessons: List[LessonResponse] = Field(default_factory=list)


class CourseStructureResponse(BaseModel):
    course_id: UUID
    modules: List[CourseStructureModuleResponse] = Field(default_factory=list)


class ContentStatisticsResponse(BaseModel):
    total_modules: int = 0
    total_lessons: int = 0
    total_videos: int = 0
    total_pdfs: int = 0
    total_resources: int = 0
    total_duration: int = 0
