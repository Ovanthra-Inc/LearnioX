from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_db
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.discussion import (
    CreateDiscussionRequest,
    DiscussionListResponse,
    DiscussionResponse,
)
from app.services.discussion_service import DiscussionService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/discussions", tags=["Discussions & Doubts"])


def get_discussion_service(db: AsyncSession = Depends(get_db)) -> DiscussionService:
    return DiscussionService(db)


@router.post(
    "",
    response_model=APIResponse[DiscussionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Post Discussion Question or Reply in Lesson",
)
async def post_discussion(
    body: CreateDiscussionRequest,
    current_user: User = Depends(get_current_active_user),
    service: DiscussionService = Depends(get_discussion_service),
):
    result = await service.create_discussion(
        user_id=current_user.id,
        payload=body,
    )
    return APIResponse.ok(data=result, message="Discussion posted successfully")


@router.get(
    "/lessons/{lesson_id}",
    response_model=APIResponse[DiscussionListResponse],
    summary="List Discussion Threads for a Lesson (Enrolled Students Only)",
)
async def list_discussions(
    lesson_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    # Discussions are private enrolled-student Q&A — must be authenticated.
    current_user: User = Depends(get_current_active_user),
    service: DiscussionService = Depends(get_discussion_service),
):
    result = await service.list_lesson_discussions(
        lesson_id=lesson_id,
        page=page,
        limit=limit,
    )
    return APIResponse.ok(data=result, message="Discussions retrieved")


@router.post(
    "/{discussion_id}/upvote",
    response_model=APIResponse[dict],
    summary="Upvote Discussion Post",
)
async def upvote_discussion(
    discussion_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: DiscussionService = Depends(get_discussion_service),
):
    upvotes = await service.upvote(discussion_id=discussion_id)
    return APIResponse.ok(data={"upvotes": upvotes}, message="Upvoted successfully")


@router.post(
    "/{discussion_id}/resolve",
    response_model=APIResponse[dict],
    summary="Mark Discussion as Resolved",
)
async def resolve_discussion(
    discussion_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: DiscussionService = Depends(get_discussion_service),
):
    await service.resolve(discussion_id=discussion_id, user_id=current_user.id)
    return APIResponse.ok(data={"resolved": True}, message="Marked as resolved")
