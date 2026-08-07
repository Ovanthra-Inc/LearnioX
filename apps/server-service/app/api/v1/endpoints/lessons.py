from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_optional_user, get_curriculum_service
from app.core.exceptions import ForbiddenException
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.curriculum import (
    AttachContentRequest,
    CreateLessonRequest,
    DurationRequest,
    LessonContentResponse,
    LessonResponse,
    LessonVisibilityRequest,
    PreviewRequest,
    ReorderLessonsRequest,
    ResourceRequest,
    ResourceResponse,
    ScheduleLessonRequest,
    UpdateLessonRequest,
)
from app.services.access_service import AccessService
from app.services.curriculum_service import CurriculumService

router = APIRouter(tags=["Course Lessons"])


@router.post(
    "/modules/{module_id}/lessons",
    summary="Create Lesson in Module",
    response_model=APIResponse[LessonResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    module_id: UUID,
    body: CreateLessonRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.create_lesson(
        module_id=module_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Lesson created successfully")


@router.get(
    "/modules/{module_id}/lessons",
    summary="List Lessons in Module",
    response_model=APIResponse[List[LessonResponse]],
)
async def list_lessons(
    module_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.list_lessons(module_id=module_id)
    return APIResponse.ok(data=result, message="Module lessons listed successfully")


@router.get(
    "/lessons/search",
    summary="Search Lessons across Modules",
    response_model=APIResponse[List[LessonResponse]],
)
async def search_lessons(
    keyword: Optional[str] = Query(None),
    course: Optional[UUID] = Query(None),
    module: Optional[UUID] = Query(None),
    lesson_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.search_lessons(
        keyword=keyword,
        course_id=course,
        module_id=module,
        lesson_type=lesson_type,
        status=status,
    )
    return APIResponse.ok(data=result, message="Lesson search results")


@router.get(
    "/lessons/{lesson_id}",
    summary="Get Complete Lesson Details",
    response_model=APIResponse[LessonResponse],
)
async def get_lesson_by_id(
    lesson_id: UUID,
    # FIX #24: Use optional user — public/preview lessons still work without auth
    current_user: Optional[User] = Depends(get_optional_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    # Enforce content access gate before returning lesson data
    access_svc = AccessService(db)
    access = await access_svc.can_access_lesson(
        lesson_id=lesson_id,
        user_id=current_user.id if current_user else None,
    )
    if not access.allowed:
        raise ForbiddenException(
            message=f"Access denied: {access.reason}",
            error_code="LESSON_ACCESS_DENIED",
        )
    result = await service.get_lesson(lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson details retrieved")


@router.patch(
    "/lessons/{lesson_id}",
    summary="Update Lesson Metadata",
    response_model=APIResponse[LessonResponse],
)
async def update_lesson(
    lesson_id: UUID,
    body: UpdateLessonRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.update_lesson(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Lesson updated successfully")


@router.delete(
    "/lessons/{lesson_id}",
    summary="Delete Lesson",
    response_model=APIResponse[None],
)
async def delete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.delete_lesson(lesson_id=lesson_id, user_id=current_user.id)
    return APIResponse.ok(message="Lesson deleted successfully")


@router.patch(
    "/modules/{module_id}/lessons/reorder",
    summary="Reorder Lessons in Module",
    response_model=APIResponse[None],
)
async def reorder_lessons(
    module_id: UUID,
    body: ReorderLessonsRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.reorder_lessons(
        module_id=module_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(message="Lessons reordered successfully")


# Content Endpoints
@router.post(
    "/lessons/{lesson_id}/content",
    summary="Attach Content to Lesson",
    response_model=APIResponse[LessonContentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def attach_content(
    lesson_id: UUID,
    body: AttachContentRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.attach_content(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Content attached to lesson successfully")


@router.get(
    "/lessons/{lesson_id}/content",
    summary="Get Lesson Content",
    response_model=APIResponse[LessonContentResponse],
)
async def get_lesson_content(
    lesson_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.get_content(lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson content retrieved")


@router.patch(
    "/lessons/{lesson_id}/content",
    summary="Update Lesson Content",
    response_model=APIResponse[LessonContentResponse],
)
async def update_lesson_content(
    lesson_id: UUID,
    body: AttachContentRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.attach_content(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Lesson content updated successfully")


@router.delete(
    "/lessons/{lesson_id}/content",
    summary="Remove Content from Lesson",
    response_model=APIResponse[None],
)
async def remove_lesson_content(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.remove_content(lesson_id=lesson_id, user_id=current_user.id)
    return APIResponse.ok(message="Lesson content removed successfully")


# Resource Endpoints
@router.post(
    "/lessons/{lesson_id}/resources",
    summary="Add Resource File to Lesson",
    response_model=APIResponse[ResourceResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_resource(
    lesson_id: UUID,
    body: ResourceRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.add_resource(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Resource added successfully")


@router.get(
    "/lessons/{lesson_id}/resources",
    summary="List Lesson Resources",
    response_model=APIResponse[List[ResourceResponse]],
)
async def list_resources(
    lesson_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.list_resources(lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson resources listed successfully")


@router.delete(
    "/lessons/{lesson_id}/resources/{resource_id}",
    summary="Delete Resource File from Lesson",
    response_model=APIResponse[None],
)
async def remove_resource(
    lesson_id: UUID,
    resource_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.remove_resource(
        resource_id=resource_id, lesson_id=lesson_id, user_id=current_user.id
    )
    return APIResponse.ok(message="Resource deleted successfully")


# Publishing & Controls
@router.patch(
    "/lessons/{lesson_id}/publish",
    summary="Publish Lesson",
    response_model=APIResponse[LessonResponse],
)
async def publish_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.publish_lesson(lesson_id=lesson_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Lesson published successfully")


@router.patch(
    "/lessons/{lesson_id}/draft",
    summary="Revert Lesson to Draft",
    response_model=APIResponse[LessonResponse],
)
async def draft_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.draft_lesson(lesson_id=lesson_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Lesson reverted to draft")


@router.patch(
    "/lessons/{lesson_id}/schedule",
    summary="Schedule Lesson Publication",
    response_model=APIResponse[LessonResponse],
)
async def schedule_lesson(
    lesson_id: UUID,
    body: ScheduleLessonRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.schedule_lesson(
        lesson_id=lesson_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Lesson publication scheduled")


@router.patch(
    "/lessons/{lesson_id}/visibility",
    summary="Update Lesson Visibility",
    response_model=APIResponse[LessonResponse],
)
async def update_lesson_visibility(
    lesson_id: UUID,
    body: LessonVisibilityRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.update_visibility(
        lesson_id=lesson_id, user_id=current_user.id, visibility=body.visibility
    )
    return APIResponse.ok(data=result, message="Lesson visibility updated")


@router.patch(
    "/lessons/{lesson_id}/preview",
    summary="Set Free Preview Flag",
    response_model=APIResponse[LessonResponse],
)
async def update_preview(
    lesson_id: UUID,
    body: PreviewRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.update_preview(
        lesson_id=lesson_id, user_id=current_user.id, is_preview=body.is_preview
    )
    return APIResponse.ok(data=result, message="Preview setting updated")


@router.patch(
    "/lessons/{lesson_id}/duration",
    summary="Update Lesson Duration (in Seconds)",
    response_model=APIResponse[LessonResponse],
)
async def update_duration(
    lesson_id: UUID,
    body: DurationRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.update_duration(
        lesson_id=lesson_id, user_id=current_user.id, duration=body.duration
    )
    return APIResponse.ok(data=result, message="Lesson duration updated")
