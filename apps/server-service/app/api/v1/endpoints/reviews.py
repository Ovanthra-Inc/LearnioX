from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_review_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.review import CreateReviewRequest, ReviewListResponse, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(tags=["Course Reviews"])


@router.post(
    "/courses/{course_id}/reviews",
    response_model=APIResponse[ReviewResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit or Update Course Review (Enrolled Students Only)",
)
async def create_course_review(
    course_id: UUID,
    body: CreateReviewRequest,
    current_user: User = Depends(get_current_active_user),
    service: ReviewService = Depends(get_review_service),
):
    result = await service.create_review(
        course_id=course_id,
        user_id=current_user.id,
        payload=body,
    )
    return APIResponse.ok(data=result, message="Review submitted successfully")


@router.get(
    "/courses/{course_id}/reviews",
    response_model=APIResponse[ReviewListResponse],
    summary="List Course Reviews with Rating Breakdown",
)
async def list_course_reviews(
    course_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: ReviewService = Depends(get_review_service),
):
    result = await service.list_course_reviews(
        course_id=course_id,
        page=page,
        limit=limit,
    )
    return APIResponse.ok(data=result, message="Reviews retrieved")
