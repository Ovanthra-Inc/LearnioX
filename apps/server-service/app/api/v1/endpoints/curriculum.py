from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.deps import get_curriculum_service
from app.core.response import APIResponse
from app.schemas.curriculum import ContentStatisticsResponse, CourseStructureResponse
from app.services.curriculum_service import CurriculumService

router = APIRouter(prefix="/courses/{course_id}", tags=["Course Curriculum Tree & Statistics"])


@router.get(
    "/structure",
    summary="Get Complete Nested Course Curriculum Tree",
    response_model=APIResponse[CourseStructureResponse],
)
async def get_course_structure(
    course_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.get_course_structure(course_id=course_id)
    return APIResponse.ok(data=result, message="Course curriculum structure compiled successfully")


@router.get(
    "/content-statistics",
    summary="Get Course Content Summary Statistics",
    response_model=APIResponse[ContentStatisticsResponse],
)
async def get_content_statistics(
    course_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.get_content_statistics(course_id=course_id)
    return APIResponse.ok(data=result, message="Content statistics retrieved successfully")
