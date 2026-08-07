from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_course_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.course import (
    CourseDetailResponse,
    CourseListResponse,
    CourseResponse,
    CourseStatisticsResponse,
    CreateCourseRequest,
    IntroVideoRequest,
    PricingRequest,
    TagRequest,
    ThumbnailRequest,
    UpdateCourseRequest,
    VisibilityRequest,
)
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post(
    "",
    summary="Create New Course",
    response_model=APIResponse[CourseResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_course(
    body: CreateCourseRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.create_course(user_id=current_user.id, payload=body)
    return APIResponse.ok(data=result, message="Course created successfully")


@router.get(
    "/search",
    summary="Search & Filter Courses",
    response_model=APIResponse[CourseListResponse],
)
async def search_courses(
    keyword: Optional[str] = Query(None),
    institution: Optional[UUID] = Query(None),
    category: Optional[UUID] = Query(None),
    level: Optional[str] = Query(None),
    status: Optional[str] = Query("PUBLISHED"),
    visibility: Optional[str] = Query("PUBLIC"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    service: CourseService = Depends(get_course_service),
):
    result = await service.list_courses(
        page=page,
        limit=limit,
        institution_id=institution,
        category_id=category,
        level=level,
        status=status,
        visibility=visibility,
        search=keyword,
        sort=sort,
    )
    return APIResponse.ok(data=result, message="Course search results")


@router.get(
    "/trending",
    summary="List Trending Public Courses",
    response_model=APIResponse[CourseListResponse],
)
async def get_trending_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_public_courses(page=page, limit=limit)
    return APIResponse.ok(data=result, message="Trending courses retrieved")


@router.get(
    "/latest",
    summary="List Latest Public Courses",
    response_model=APIResponse[CourseListResponse],
)
async def get_latest_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_public_courses(page=page, limit=limit, sort="desc")
    return APIResponse.ok(data=result, message="Latest courses retrieved")


@router.get(
    "/free",
    summary="List Free Public Courses",
    response_model=APIResponse[CourseListResponse],
)
async def get_free_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_public_courses(page=page, limit=limit, access_type="FREE")
    return APIResponse.ok(data=result, message="Free courses retrieved")


@router.get(
    "/paid",
    summary="List Paid Public Courses",
    response_model=APIResponse[CourseListResponse],
)
async def get_paid_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_public_courses(page=page, limit=limit, access_type="PAID")
    return APIResponse.ok(data=result, message="Paid courses retrieved")


@router.get(
    "/recommended",
    summary="List Recommended Public Courses",
    response_model=APIResponse[CourseListResponse],
)
async def get_recommended_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_public_courses(page=page, limit=limit)
    return APIResponse.ok(data=result, message="Recommended courses retrieved")


@router.get(
    "",
    summary="List Courses (Admin / Discovery)",
    response_model=APIResponse[CourseListResponse],
)
async def list_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    institution: Optional[UUID] = Query(None),
    category: Optional[UUID] = Query(None),
    level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    service: CourseService = Depends(get_course_service),
):
    result = await service.list_courses(
        page=page,
        limit=limit,
        institution_id=institution,
        category_id=category,
        level=level,
        status=status,
        visibility=visibility,
        search=search,
        sort=sort,
    )
    return APIResponse.ok(data=result, message="Courses listed successfully")


@router.get(
    "/{course_id}",
    summary="Get Complete Course Details",
    response_model=APIResponse[CourseDetailResponse],
)
async def get_course_by_id(
    course_id: UUID,
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_course(course_id=course_id)
    return APIResponse.ok(data=result, message="Course details retrieved")


@router.patch(
    "/{course_id}",
    summary="Update Course Metadata",
    response_model=APIResponse[CourseDetailResponse],
)
async def update_course(
    course_id: UUID,
    body: UpdateCourseRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.update_course(
        course_id=course_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Course updated successfully")


@router.delete(
    "/{course_id}",
    summary="Soft Delete Course",
    response_model=APIResponse[None],
)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    await service.soft_delete_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(message="Course deleted successfully")


@router.patch(
    "/{course_id}/publish",
    summary="Publish Course",
    response_model=APIResponse[CourseDetailResponse],
)
async def publish_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.publish_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Course published successfully")


@router.patch(
    "/{course_id}/draft",
    summary="Revert Course to Draft",
    response_model=APIResponse[CourseDetailResponse],
)
async def draft_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.draft_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Course reverted to draft")


@router.patch(
    "/{course_id}/archive",
    summary="Archive Course",
    response_model=APIResponse[CourseDetailResponse],
)
async def archive_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.archive_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Course archived successfully")


@router.patch(
    "/{course_id}/restore",
    summary="Restore Course",
    response_model=APIResponse[CourseDetailResponse],
)
async def restore_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.restore_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Course restored successfully")


@router.post(
    "/{course_id}/duplicate",
    summary="Duplicate Course",
    response_model=APIResponse[CourseDetailResponse],
)
async def duplicate_course(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.duplicate_course(course_id=course_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Course duplicated successfully")


@router.patch(
    "/{course_id}/thumbnail",
    summary="Update Course Thumbnail",
    response_model=APIResponse[CourseDetailResponse],
)
async def update_thumbnail(
    course_id: UUID,
    body: ThumbnailRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.set_thumbnail(
        course_id=course_id, file_id=body.file_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Thumbnail updated successfully")


@router.delete(
    "/{course_id}/thumbnail",
    summary="Remove Course Thumbnail",
    response_model=APIResponse[CourseDetailResponse],
)
async def delete_thumbnail(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.set_thumbnail(
        course_id=course_id, file_id=None, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Thumbnail removed successfully")


@router.patch(
    "/{course_id}/intro-video",
    summary="Update Course Intro Video",
    response_model=APIResponse[CourseDetailResponse],
)
async def update_intro_video(
    course_id: UUID,
    body: IntroVideoRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.set_intro_video(
        course_id=course_id, file_id=body.file_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Intro video updated successfully")


@router.patch(
    "/{course_id}/pricing",
    summary="Update Course Pricing & Access Type",
    response_model=APIResponse[CourseDetailResponse],
)
async def update_pricing(
    course_id: UUID,
    body: PricingRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.update_pricing(
        course_id=course_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Pricing updated successfully")


@router.patch(
    "/{course_id}/visibility",
    summary="Update Course Visibility",
    response_model=APIResponse[CourseDetailResponse],
)
async def update_visibility(
    course_id: UUID,
    body: VisibilityRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.update_visibility(
        course_id=course_id, user_id=current_user.id, visibility=body.visibility
    )
    return APIResponse.ok(data=result, message="Visibility updated successfully")


@router.post(
    "/{course_id}/tags",
    summary="Attach Tags to Course",
    response_model=APIResponse[CourseDetailResponse],
)
async def assign_course_tags(
    course_id: UUID,
    body: TagRequest,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    result = await service.assign_course_tags(
        course_id=course_id, tag_ids=body.tag_ids, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Tags assigned successfully")


@router.delete(
    "/{course_id}/tags/{tag_id}",
    summary="Remove Tag from Course",
    response_model=APIResponse[None],
)
async def remove_course_tag(
    course_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CourseService = Depends(get_course_service),
):
    await service.remove_course_tag(course_id=course_id, tag_id=tag_id, user_id=current_user.id)
    return APIResponse.ok(message="Tag removed successfully")


@router.get(
    "/{course_id}/statistics",
    summary="Get Course Statistics",
    response_model=APIResponse[CourseStatisticsResponse],
)
async def get_course_statistics(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),  # FIX #5: auth guard added
    service: CourseService = Depends(get_course_service),
):
    result = await service.get_course_statistics(course_id=course_id)
    return APIResponse.ok(data=result, message="Course statistics retrieved")
