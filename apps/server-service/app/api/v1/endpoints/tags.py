from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_course_service, require_platform_admin
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.course import TagCreateRequest, TagResponse
from app.services.course_service import CourseService

router = APIRouter(prefix="/tags", tags=["Course Tags"])


@router.get(
    "",
    summary="List Course Tags",
    response_model=APIResponse[List[TagResponse]],
)
async def list_tags(
    service: CourseService = Depends(get_course_service),
):
    result = await service.list_tags()
    return APIResponse.ok(data=result, message="Tags retrieved successfully")


@router.post(
    "",
    summary="Create Course Tag (Platform Admin Only)",
    response_model=APIResponse[TagResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_tag(
    body: TagCreateRequest,
    # Global tags are platform-level data — only superusers may create them.
    _: User = Depends(require_platform_admin),
    service: CourseService = Depends(get_course_service),
):
    result = await service.create_tag(payload=body)
    return APIResponse.ok(data=result, message="Tag created successfully")


@router.patch(
    "/{id}",
    summary="Update Course Tag (Platform Admin Only)",
    response_model=APIResponse[TagResponse],
)
async def update_tag(
    id: UUID,
    body: TagCreateRequest,
    _: User = Depends(require_platform_admin),
    service: CourseService = Depends(get_course_service),
):
    result = await service.update_tag(tag_id=id, payload=body)
    return APIResponse.ok(data=result, message="Tag updated successfully")


@router.delete(
    "/{id}",
    summary="Delete Course Tag (Platform Admin Only)",
    response_model=APIResponse[None],
)
async def delete_tag(
    id: UUID,
    _: User = Depends(require_platform_admin),
    service: CourseService = Depends(get_course_service),
):
    await service.delete_tag(tag_id=id)
    return APIResponse.ok(message="Tag deleted successfully")
