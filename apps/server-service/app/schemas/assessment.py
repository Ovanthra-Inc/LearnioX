from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# Quiz Authoring Schemas
class CreateQuizRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    passing_marks: int = Field(0, ge=0)
    total_marks: int = Field(0, ge=0)
    time_limit: int = Field(0, ge=0, description="in minutes, 0 = no limit")
    attempt_limit: int = Field(0, ge=0, description="0 = unlimited")
    shuffle_questions: bool = False
    show_result: bool = True

    from pydantic import model_validator
    @model_validator(mode="after")
    def validate_marks(self) -> "CreateQuizRequest":
        if self.passing_marks > self.total_marks:
            raise ValueError("passing_marks cannot exceed total_marks")
        return self



class UpdateQuizRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    passing_marks: Optional[int] = Field(None, ge=0)
    total_marks: Optional[int] = Field(None, ge=0)
    time_limit: Optional[int] = Field(None, ge=0)
    attempt_limit: Optional[int] = Field(None, ge=0)
    shuffle_questions: Optional[bool] = None
    show_result: Optional[bool] = None


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    title: str
    description: Optional[str] = None
    passing_marks: int
    total_marks: int
    time_limit: int
    attempt_limit: int
    shuffle_questions: bool
    show_result: bool
    status: str
    created_at: datetime


# Question & Option Schemas
class OptionRequest(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False


class OptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: UUID
    option_text: str
    is_correct: bool


class CreateQuestionRequest(BaseModel):
    question: str = Field(..., min_length=3)
    question_type: str = Field("MCQ", pattern="^(MCQ|MULTIPLE|TRUE_FALSE|SHORT_ANSWER)$")
    marks: int = Field(1, ge=1)
    explanation: Optional[str] = None
    options: List[OptionRequest] = Field(default_factory=list)


class UpdateQuestionRequest(BaseModel):
    question: Optional[str] = Field(None, min_length=3)
    question_type: Optional[str] = Field(None, pattern="^(MCQ|MULTIPLE|TRUE_FALSE|SHORT_ANSWER)$")
    marks: Optional[int] = Field(None, ge=1)
    explanation: Optional[str] = None


class ReorderQuestionRequest(BaseModel):
    question_ids: List[UUID] = Field(..., description="Ordered list of question UUIDs")


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quiz_id: UUID
    question: str
    question_type: str
    marks: int
    position: int
    explanation: Optional[str] = None
    options: List[OptionResponse] = Field(default_factory=list)


# Student Quiz Attempt Schemas
class SubmitAnswerItem(BaseModel):
    question_id: UUID
    option_id: Optional[UUID] = None
    text_answer: Optional[str] = None


class SubmitQuizRequest(BaseModel):
    answers: List[SubmitAnswerItem] = Field(..., min_length=1)


class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attempt_id: UUID
    quiz_id: UUID
    user_id: UUID
    status: str
    started_at: datetime
    expires_at: Optional[datetime] = None


class QuizAnswerDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: UUID
    selected_option_id: Optional[UUID] = None
    text_answer: Optional[str] = None
    marks_awarded: int = 0
    is_correct: bool = False


class QuizResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attempt_id: UUID
    quiz_id: UUID
    score: int
    total_marks: int
    percentage: float
    passed: bool
    answers: List[QuizAnswerDetail] = Field(default_factory=list)
    submitted_at: Optional[datetime] = None


# Assignment & Submission Schemas
class CreateAssignmentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    total_marks: int = Field(100, ge=1)
    due_date: datetime
    allow_late_submission: bool = False


class UpdateAssignmentRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    total_marks: Optional[int] = Field(None, ge=1)
    due_date: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    title: str
    description: str
    total_marks: int
    due_date: datetime
    allow_late_submission: bool
    status: str
    created_at: datetime


class SubmitAssignmentRequest(BaseModel):
    file_id: Optional[UUID] = None
    remarks: Optional[str] = None


class GradeSubmissionRequest(BaseModel):
    marks: int = Field(..., ge=0)
    feedback: str = Field(..., min_length=1)


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    student_id: UUID
    file_id: Optional[UUID] = None
    file_url: Optional[str] = None
    remarks: Optional[str] = None
    marks: Optional[int] = None
    feedback: Optional[str] = None
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime] = None


# Statistics Schemas
class QuizStatisticsResponse(BaseModel):
    attempts: int
    passed: int
    failed: int
    average_score: float


class AssignmentStatisticsResponse(BaseModel):
    submitted: int
    graded: int
    pending: int
    average_marks: float
