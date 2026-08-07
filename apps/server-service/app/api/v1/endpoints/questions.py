from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_assessment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.assessment import (
    CreateQuestionRequest,
    OptionRequest,
    OptionResponse,
    QuestionResponse,
    ReorderQuestionRequest,
    UpdateQuestionRequest,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Quiz Questions & Options"])


@router.post(
    "/quizzes/{quiz_id}/questions",
    summary="Create Question in Quiz",
    response_model=APIResponse[QuestionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_question(
    quiz_id: UUID,
    body: CreateQuestionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.create_question(
        quiz_id=quiz_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Question created successfully")


@router.get(
    "/quizzes/{quiz_id}/questions",
    summary="List Questions in Quiz",
    response_model=APIResponse[List[QuestionResponse]],
)
async def list_questions(
    quiz_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.list_questions(quiz_id=quiz_id)
    return APIResponse.ok(data=result, message="Quiz questions listed")


@router.patch(
    "/questions/{question_id}",
    summary="Update Question Details",
    response_model=APIResponse[QuestionResponse],
)
async def update_question(
    question_id: UUID,
    body: UpdateQuestionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.update_question(
        question_id=question_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Question updated successfully")


@router.delete(
    "/questions/{question_id}",
    summary="Delete Question",
    response_model=APIResponse[None],
)
async def delete_question(
    question_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    await service.delete_question(question_id=question_id, user_id=current_user.id)
    return APIResponse.ok(message="Question deleted successfully")


@router.patch(
    "/quizzes/{quiz_id}/questions/reorder",
    summary="Reorder Questions in Quiz",
    response_model=APIResponse[None],
)
async def reorder_questions(
    quiz_id: UUID,
    body: ReorderQuestionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    await service.reorder_questions(
        quiz_id=quiz_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(message="Questions reordered successfully")


# Option Endpoints
@router.post(
    "/questions/{question_id}/options",
    summary="Add Option to Question",
    response_model=APIResponse[OptionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_option(
    question_id: UUID,
    body: OptionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.add_option(
        question_id=question_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Option added successfully")


@router.patch(
    "/options/{option_id}",
    summary="Update Option",
    response_model=APIResponse[OptionResponse],
)
async def update_option(
    option_id: UUID,
    body: OptionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.update_option(
        option_id=option_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Option updated successfully")


@router.delete(
    "/options/{option_id}",
    summary="Delete Option",
    response_model=APIResponse[None],
)
async def delete_option(
    option_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    await service.delete_option(option_id=option_id, user_id=current_user.id)
    return APIResponse.ok(message="Option deleted successfully")
