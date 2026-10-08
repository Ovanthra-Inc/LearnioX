from typing import List, Dict, Any
from fastapi import APIRouter, status
from app.schemas.response import APIResponse
from app.modules.assessments.schemas import (
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    GradeAssessmentRequest,
    GradeAssessmentResponse,
)
from app.modules.assessments.service import assessment_module_service

router = APIRouter(prefix="/assessments", tags=["Assessments AI"])


@router.get(
    "/types",
    summary="Get All 14 Supported Assessment Types",
    response_model=APIResponse[List[Dict[str, Any]]],
)
async def get_supported_assessment_types():
    """
    Returns the list of 14 creator-selectable assessment types with descriptive metadata.
    """
    types_meta = assessment_module_service.get_supported_types()
    return APIResponse.ok(
        data=types_meta,
        message="Supported assessment types retrieved successfully",
    )


@router.post(
    "/generate",
    summary="Synthesize & Generate Assessments with AI (All 14 Types)",
    response_model=APIResponse[GenerateAssessmentResponse],
    status_code=status.HTTP_200_OK,
)
async def generate_assessments(request: GenerateAssessmentRequest):
    """
    Synthesizes complete, ready-to-use assessment items (problem statement, starter code,
    test cases, options, matching pairs, rubrics) across any of the 14 assessment types.
    """
    result = await assessment_module_service.generate_assessments(request)
    return APIResponse.ok(
        data=result,
        message=f"Generated {result.count} {request.assessment_type.value} assessment item(s) for topic '{request.topic}'",
    )


@router.post(
    "/grade",
    summary="Evaluate & Grade Student Assessment Submission",
    response_model=APIResponse[GradeAssessmentResponse],
    status_code=status.HTTP_200_OK,
)
async def grade_assessment(request: GradeAssessmentRequest):
    """
    Evaluates a student's submission across any of the 14 assessment types using
    specialized AI rubrics and returns an objective score, rubric breakdown, and constructive feedback.
    """
    result = await assessment_module_service.grade_assessment(request)
    return APIResponse.ok(
        data=result,
        message=f"Assessment evaluated successfully as {request.assessment_type.value}",
    )


@router.get(
    "/tasks/{task_id}",
    summary="Poll Async Assessment Task Status",
    response_model=APIResponse[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
)
async def get_assessment_task(task_id: str):
    """
    Polls task state for asynchronous assessment generation or evaluation.
    """
    from redis.asyncio import Redis
    from app.core.config import settings

    key = f"assessment:task:{task_id}"
    data = None
    try:
        redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        raw = await redis_client.get(key)
        await redis_client.aclose()
        if raw:
            import json
            data = json.loads(raw)
    except Exception:
        pass

    if not data:
        return APIResponse.fail(message="Task not found", code="TASK_NOT_FOUND")

    return APIResponse.ok(data=data, message=f"Task is {data.get('status')}")

