from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_assessment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.assessment import (
    CreateQuizRequest,
    QuizResponse,
    QuizStatisticsResponse,
    UpdateQuizRequest,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Quizzes"])


@router.post(
    "/lessons/{lesson_id}/quizzes",
    summary="Create Quiz in Lesson",
    response_model=APIResponse[QuizResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz(
    lesson_id: UUID,
    body: CreateQuizRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.create_quiz(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Quiz created successfully")


@router.get(
    "/lessons/{lesson_id}/quizzes",
    summary="List Quizzes in Lesson",
    response_model=APIResponse[List[QuizResponse]],
)
async def list_quizzes(
    lesson_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.list_quizzes(lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson quizzes listed successfully")


@router.get(
    "/quizzes/{quiz_id}",
    summary="Get Quiz Details",
    response_model=APIResponse[QuizResponse],
)
async def get_quiz_by_id(
    quiz_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_quiz(quiz_id=quiz_id)
    return APIResponse.ok(data=result, message="Quiz details retrieved")


@router.patch(
    "/quizzes/{quiz_id}",
    summary="Update Quiz Metadata",
    response_model=APIResponse[QuizResponse],
)
async def update_quiz(
    quiz_id: UUID,
    body: UpdateQuizRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.update_quiz(
        quiz_id=quiz_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Quiz updated successfully")


@router.delete(
    "/quizzes/{quiz_id}",
    summary="Delete Quiz",
    response_model=APIResponse[None],
)
async def delete_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    await service.delete_quiz(quiz_id=quiz_id, user_id=current_user.id)
    return APIResponse.ok(message="Quiz deleted successfully")


@router.patch(
    "/quizzes/{quiz_id}/publish",
    summary="Publish Quiz",
    response_model=APIResponse[QuizResponse],
)
async def publish_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.publish_quiz(quiz_id=quiz_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Quiz published successfully")


@router.patch(
    "/quizzes/{quiz_id}/draft",
    summary="Revert Quiz to Draft",
    response_model=APIResponse[QuizResponse],
)
async def draft_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.draft_quiz(quiz_id=quiz_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Quiz reverted to draft")


@router.get(
    "/quizzes/{quiz_id}/statistics",
    summary="Get Quiz Statistics",
    response_model=APIResponse[QuizStatisticsResponse],
)
async def get_quiz_statistics(
    quiz_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_quiz_statistics(quiz_id=quiz_id)
    return APIResponse.ok(data=result, message="Quiz statistics retrieved")
