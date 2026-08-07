from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, get_enrollment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.enrollment import BookmarkRequest, BookmarkResponse
from app.services.enrollment_service import EnrollmentService

router = APIRouter(tags=["Lesson Timestamp Bookmarks"])


@router.post(
    "/lessons/{lesson_id}/bookmarks",
    summary="Create Video Timestamp Bookmark",
    response_model=APIResponse[BookmarkResponse],
    status_code=201,
)
async def create_bookmark(
    lesson_id: UUID,
    body: BookmarkRequest,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.create_bookmark(user_id=current_user.id, lesson_id=lesson_id, payload=body)
    return APIResponse.ok(data=result, message="Bookmark created successfully")


@router.get(
    "/lessons/{lesson_id}/bookmarks",
    summary="List Bookmarks for Lesson",
    response_model=APIResponse[List[BookmarkResponse]],
)
async def list_bookmarks(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.list_bookmarks(user_id=current_user.id, lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson bookmarks retrieved")


@router.patch(
    "/bookmarks/{bookmark_id}",
    summary="Update Bookmark Note",
    response_model=APIResponse[BookmarkResponse],
)
async def update_bookmark(
    bookmark_id: UUID,
    body: BookmarkRequest,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.update_bookmark(bookmark_id=bookmark_id, user_id=current_user.id, note=body.note)
    return APIResponse.ok(data=result, message="Bookmark updated successfully")


@router.delete(
    "/bookmarks/{bookmark_id}",
    summary="Delete Bookmark",
    response_model=APIResponse[None],
)
async def delete_bookmark(
    bookmark_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    await service.delete_bookmark(bookmark_id=bookmark_id, user_id=current_user.id)
    return APIResponse.ok(message="Bookmark deleted successfully")
