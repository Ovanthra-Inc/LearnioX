from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_assessment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.assessment import (
    GradeSubmissionRequest,
    SubmissionResponse,
    SubmitAssignmentRequest,
)
from app.services.assessment_service import AssessmentService

router = APIRouter(tags=["Assignment Submissions & Grading"])


@router.post(
    "/assignments/{assignment_id}/submit",
    summary="Submit Assignment File & Remarks",
    response_model=APIResponse[SubmissionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def submit_assignment(
    assignment_id: UUID,
    body: SubmitAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.submit_assignment(
        assignment_id=assignment_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Assignment submitted successfully")


@router.get(
    "/assignments/{assignment_id}/submissions",
    summary="List Student Submissions for Assignment (Instructor)",
    response_model=APIResponse[List[SubmissionResponse]],
)
async def list_assignment_submissions(
    assignment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.list_assignment_submissions(
        assignment_id=assignment_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Submissions listed")


@router.get(
    "/submissions/{submission_id}",
    summary="Get Submission Details",
    response_model=APIResponse[SubmissionResponse],
)
async def get_submission_by_id(
    submission_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.repo.get_submission_by_id(submission_id)
    if not result:
        return APIResponse.fail(message="Submission not found", code="NOT_FOUND")

    resp = SubmissionResponse(
        id=result.id,
        assignment_id=result.assignment_id,
        student_id=result.student_id,
        file_id=result.file_id,
        file_url=service._resolve_file_url(result.file_id),
        remarks=result.remarks,
        marks=result.marks,
        feedback=result.feedback,
        status=result.status.value if hasattr(result.status, "value") else str(result.status),
        submitted_at=result.submitted_at,
        graded_at=result.graded_at,
    )
    return APIResponse.ok(data=resp, message="Submission details retrieved")


@router.patch(
    "/submissions/{submission_id}/grade",
    summary="Grade Submission with Marks & Feedback (Instructor)",
    response_model=APIResponse[SubmissionResponse],
)
async def grade_submission(
    submission_id: UUID,
    body: GradeSubmissionRequest,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.grade_submission(
        submission_id=submission_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Submission graded successfully")


@router.patch(
    "/submissions/{submission_id}/review",
    summary="Mark Submission Under Review (Instructor)",
    response_model=APIResponse[SubmissionResponse],
)
async def review_submission(
    submission_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.review_submission(
        submission_id=submission_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Submission marked under review")


@router.get(
    "/users/me/assignments",
    summary="Get Learner Assignment Submissions History",
    response_model=APIResponse[List[SubmissionResponse]],
)
async def get_user_assignments(
    current_user: User = Depends(get_current_active_user),
    service: AssessmentService = Depends(get_assessment_service),
):
    result = await service.get_user_assignments(user_id=current_user.id)
    return APIResponse.ok(data=result, message="User assignments retrieved")
