from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CreateAssignmentRequest(BaseModel):
    course_id: UUID
    lesson_id: UUID | None = None
    title: str
    description: str | None = None
    due_date: datetime | None = None
    max_marks: int = 100


class SubmitAssignmentRequest(BaseModel):
    text_answer: str | None = None
    file_asset_id: UUID | None = None


class ReviewAssignmentRequest(BaseModel):
    marks_obtained: float
    feedback: str | None = None


class AssignmentResponse(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: UUID | None
    title: str
    description: str | None
    due_date: datetime | None
    max_marks: int
    status: str
    created_at: datetime


class AssignmentSubmissionResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    user_id: UUID
    text_answer: str | None
    file_asset_id: UUID | None
    status: str
    marks_obtained: float | None
    feedback: str | None
    created_at: datetime
