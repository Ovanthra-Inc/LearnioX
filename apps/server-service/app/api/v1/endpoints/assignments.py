from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_assessment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.assessment import (
    AssignmentResponse,
    AssignmentStatisticsResponse,
    CreateAssignmentRequest,
    GenerateAssignmentWithAIRequest,
    UpdateAssignmentRequest,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Assignments"])


@router.post(
    "/lessons/{lesson_id}/assignments/generate-ai",
    summary="Generate & Create Assignment in Lesson with AI (All 14 Types)",
    response_model=APIResponse[AssignmentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def generate_assignment_with_ai(
    lesson_id: UUID,
    body: GenerateAssignmentWithAIRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Synthesizes an assessment using the AI Question Generator engine across any of the 14
    assessment types and persists it to the lesson.
    """
    result = await service.generate_and_create_assignment_with_ai(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(
        data=result,
        message=f"Assignment generated with AI as {result.assessment_type} and added to lesson",
    )


@router.post(
    "/lessons/{lesson_id}/assignments",
    summary="Create Assignment in Lesson",
    response_model=APIResponse[AssignmentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    lesson_id: UUID,
    body: CreateAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.create_assignment(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Assignment created successfully")


@router.get(
    "/lessons/{lesson_id}/assignments",
    summary="List Assignments in Lesson",
    response_model=APIResponse[List[AssignmentResponse]],
)
async def list_assignments(
    lesson_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.list_assignments(lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson assignments listed")


@router.get(
    "/assignments/{assignment_id}",
    summary="Get Assignment Details",
    response_model=APIResponse[AssignmentResponse],
)
async def get_assignment_by_id(
    assignment_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_assignment(assignment_id=assignment_id)
    return APIResponse.ok(data=result, message="Assignment details retrieved")


@router.patch(
    "/assignments/{assignment_id}",
    summary="Update Assignment Details",
    response_model=APIResponse[AssignmentResponse],
)
async def update_assignment(
    assignment_id: UUID,
    body: UpdateAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.update_assignment(
        assignment_id=assignment_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Assignment updated successfully")


@router.delete(
    "/assignments/{assignment_id}",
    summary="Delete Assignment",
    response_model=APIResponse[None],
)
async def delete_assignment(
    assignment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    await service.delete_assignment(assignment_id=assignment_id, user_id=current_user.id)
    return APIResponse.ok(message="Assignment deleted successfully")


@router.get(
    "/assignments/{assignment_id}/statistics",
    summary="Get Assignment Statistics",
    response_model=APIResponse[AssignmentStatisticsResponse],
)
async def get_assignment_statistics(
    assignment_id: UUID,
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_assignment_statistics(assignment_id=assignment_id)
    return APIResponse.ok(data=result, message="Assignment statistics retrieved")
