from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_course_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.course import CategoryRequest, CategoryResponse
from app.services.course_service import CourseService

router = APIRouter(prefix="/categories", tags=["Course Categories"])


@router.get(
    "",
    summary="List Course Categories",
    response_model=APIResponse[List[CategoryResponse]],
)
async def list_categories(
    service: CourseService = Depends(get_course_service),
):
    result = await service.list_categories()
    return APIResponse.ok(data=result, message="Course categories retrieved successfully")


@router.post(
    "",
    summary="Create Course Category",
    response_model=APIResponse[CategoryResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    body: CategoryRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.create_category(payload=body)
    return APIResponse.ok(data=result, message="Category created successfully")


@router.patch(
    "/{id}",
    summary="Update Course Category",
    response_model=APIResponse[CategoryResponse],
)
async def update_category(
    id: UUID,
    body: CategoryRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.update_category(category_id=id, payload=body)
    return APIResponse.ok(data=result, message="Category updated successfully")


@router.delete(
    "/{id}",
    summary="Delete Course Category",
    response_model=APIResponse[None],
)
async def delete_category(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    await service.delete_category(category_id=id)
    return APIResponse.ok(message="Category deleted successfully")
