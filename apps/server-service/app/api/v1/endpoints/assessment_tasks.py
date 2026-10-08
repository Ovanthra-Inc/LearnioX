from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_assessment_service
from app.core.exceptions import NotFoundException
from app.core.response import APIResponse
from app.schemas.assessment import AssessmentTaskStatusResponse
from app.services.assessment_service import AssessmentService

router = APIRouter(prefix="/assessments", tags=["Assessment Async Tasks"])


@router.get(
    "/tasks/{task_id}",
    summary="Poll Async Assessment Task Status",
    response_model=APIResponse[AssessmentTaskStatusResponse],
    status_code=status.HTTP_200_OK,
)
async def get_assessment_task_status(
    task_id: str,
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Polls the Redis status of an async AI assessment grading or generation task.
    Returns status (QUEUED | PROCESSING | COMPLETED | FAILED), progress percentage, and final evaluated rubric.
    """
    task = await service.get_assessment_task(task_id)
    if not task:
        raise NotFoundException(
            message=f"Assessment task '{task_id}' not found",
            error_code="TASK_NOT_FOUND",
        )
    return APIResponse.ok(
        data=task,
        message=f"Assessment task is {task.status}",
    )
