from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_assessment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.assessment import (
    QuizAttemptResponse,
    QuizResultResponse,
    SubmitQuizRequest,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Student Quiz Attempts"])


@router.post(
    "/quizzes/{quiz_id}/start",
    summary="Start New Quiz Attempt",
    response_model=APIResponse[QuizAttemptResponse],
    status_code=status.HTTP_201_CREATED,
)
async def start_attempt(
    quiz_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.start_attempt(quiz_id=quiz_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Quiz attempt started successfully")


@router.post(
    "/quizzes/{quiz_id}/submit",
    summary="Submit Quiz Attempt for Auto-Grading",
    response_model=APIResponse[QuizResultResponse],
)
async def submit_attempt(
    quiz_id: UUID,
    body: SubmitQuizRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.submit_attempt(
        quiz_id=quiz_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Quiz submitted and evaluated successfully")


@router.get(
    "/attempts/{attempt_id}",
    summary="Get Attempt Details",
    response_model=APIResponse[QuizAttemptResponse],
)
async def get_attempt_by_id(
    attempt_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_attempt(attempt_id=attempt_id)
    return APIResponse.ok(data=result, message="Attempt details retrieved")


@router.get(
    "/attempts/{attempt_id}/result",
    summary="Get Quiz Attempt Result & Breakdown",
    response_model=APIResponse[QuizResultResponse],
)
async def get_attempt_result(
    attempt_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_attempt_result(attempt_id=attempt_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Quiz result retrieved")


@router.get(
    "/users/me/quiz-history",
    summary="Get Learner Quiz History",
    response_model=APIResponse[List[QuizAttemptResponse]],
)
async def get_user_quiz_history(
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_user_quiz_history(user_id=current_user.id)
    return APIResponse.ok(data=result, message="Quiz history retrieved")
