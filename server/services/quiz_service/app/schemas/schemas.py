from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CreateQuizRequest(BaseModel):
    course_id: UUID
    lesson_id: UUID | None = None
    title: str
    description: str | None = None
    time_limit_minutes: int | None = None
    passing_score: float = 60.0


class CreateQuestionRequest(BaseModel):
    question_type: str = "mcq"
    question_text: str
    options: list[dict] = []
    correct_answer: dict | None = None
    marks: int = 1


class SubmitQuizAttemptRequest(BaseModel):
    answers: dict


class QuizResponse(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: UUID | None
    title: str
    description: str | None
    status: str
    time_limit_minutes: int | None
    passing_score: float
    created_at: datetime


class QuestionResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    question_type: str
    question_text: str
    options_json: dict | None
    marks: int


class QuizAttemptResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    user_id: UUID
    status: str
    score: float | None
    submitted_at: datetime | None
    created_at: datetime
