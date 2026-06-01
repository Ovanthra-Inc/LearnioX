import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.quiz import Quiz, Question, QuizAttempt, QuizStatus, AttemptStatus
from app.schemas.schemas import (
    CreateQuizRequest, CreateQuestionRequest, SubmitQuizAttemptRequest,
    QuizResponse, QuestionResponse, QuizAttemptResponse,
)
from learniox_common.schemas import APIResponse

router = APIRouter()


def get_uid(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


def _qr(q) -> QuizResponse:
    return QuizResponse(id=q.id, course_id=q.course_id, lesson_id=q.lesson_id, title=q.title,
                        description=q.description, status=q.status.value,
                        time_limit_minutes=q.time_limit_minutes, passing_score=float(q.passing_score), created_at=q.created_at)


@router.post("/quizzes", response_model=APIResponse[QuizResponse])
async def create_quiz(request: CreateQuizRequest, db: AsyncSession = Depends(get_db)):
    quiz = Quiz(**request.model_dump())
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return APIResponse(success=True, message="Quiz created", data=_qr(quiz))


@router.get("/quizzes/{quiz_id}", response_model=APIResponse[QuizResponse])
async def get_quiz(quiz_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return APIResponse(success=True, message="Quiz retrieved", data=_qr(quiz))


@router.post("/quizzes/{quiz_id}/publish", response_model=APIResponse[QuizResponse])
async def publish_quiz(quiz_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.status = QuizStatus.PUBLISHED
    await db.commit()
    await db.refresh(quiz)
    return APIResponse(success=True, message="Quiz published", data=_qr(quiz))


@router.post("/quizzes/{quiz_id}/questions", response_model=APIResponse[QuestionResponse])
async def add_question(quiz_id: uuid.UUID, request: CreateQuestionRequest, db: AsyncSession = Depends(get_db)):
    q = Question(quiz_id=quiz_id, question_type=request.question_type, question_text=request.question_text,
                 options_json={"options": request.options}, correct_answer_json=request.correct_answer, marks=request.marks)
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return APIResponse(success=True, message="Question added", data=QuestionResponse(
        id=q.id, quiz_id=q.quiz_id, question_type=q.question_type, question_text=q.question_text,
        options_json=q.options_json, marks=q.marks,
    ))


@router.get("/quizzes/{quiz_id}/questions", response_model=APIResponse[list[QuestionResponse]])
async def list_questions(quiz_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.quiz_id == quiz_id))
    qs = result.scalars().all()
    return APIResponse(success=True, message="Questions retrieved", data=[
        QuestionResponse(id=q.id, quiz_id=q.quiz_id, question_type=q.question_type,
                         question_text=q.question_text, options_json=q.options_json, marks=q.marks) for q in qs
    ])


@router.post("/quizzes/{quiz_id}/attempt", response_model=APIResponse[QuizAttemptResponse])
async def start_attempt(quiz_id: uuid.UUID, user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db)):
    attempt = QuizAttempt(quiz_id=quiz_id, user_id=user_id, status=AttemptStatus.STARTED)
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return APIResponse(success=True, message="Attempt started", data=QuizAttemptResponse(
        id=attempt.id, quiz_id=attempt.quiz_id, user_id=attempt.user_id,
        status=attempt.status.value, score=None, submitted_at=None, created_at=attempt.created_at,
    ))


@router.post("/attempts/{attempt_id}/submit", response_model=APIResponse[QuizAttemptResponse])
async def submit_attempt(attempt_id: uuid.UUID, request: SubmitQuizAttemptRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
    attempt = result.scalar_one_or_none()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    attempt.status = AttemptStatus.SUBMITTED
    attempt.answers_json = request.answers
    attempt.submitted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(attempt)
    return APIResponse(success=True, message="Attempt submitted", data=QuizAttemptResponse(
        id=attempt.id, quiz_id=attempt.quiz_id, user_id=attempt.user_id,
        status=attempt.status.value, score=float(attempt.score) if attempt.score else None,
        submitted_at=attempt.submitted_at, created_at=attempt.created_at,
    ))


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
