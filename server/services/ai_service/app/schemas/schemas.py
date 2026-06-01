from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class GenerateCourseOutlineRequest(BaseModel):
    institution_id: UUID | None = None
    topic: str
    target_audience: str
    level: str = "beginner"
    language: str = "English"
    number_of_modules: int = 8


class GenerateLessonPlanRequest(BaseModel):
    course_title: str
    module_title: str
    lesson_topic: str
    duration_minutes: int | None = None


class GenerateQuizRequest(BaseModel):
    source_text: str
    number_of_questions: int = 10
    difficulty: str = "medium"
    question_types: list[str] = ["mcq"]


class GenerateMarketingCopyRequest(BaseModel):
    course_id: UUID | None = None
    product_name: str
    target_audience: str
    channel: str


class AIJobResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    requested_by_user_id: UUID
    job_type: str
    status: str
    input_payload: dict
    output_payload: dict | None
    error_message: str | None
    provider: str | None
    model_name: str | None
    created_at: datetime
    updated_at: datetime
