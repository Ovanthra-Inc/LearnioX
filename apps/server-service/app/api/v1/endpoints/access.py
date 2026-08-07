from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.deps import get_access_service, get_current_active_user, get_optional_user, get_payment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.payment import (
    CourseAccessResponse,
    LessonAccessResponse,
    UserAccessSummaryResponse,
)
from app.services.access_service import AccessService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/access", tags=["Core Access Control Engine"])


@router.get(
    "/course/{course_id}",
    summary="Check User Access for Course",
    response_model=APIResponse[CourseAccessResponse],
)
async def check_course_access(
    course_id: UUID,
    current_user: Optional[User] = Depends(get_optional_user),
    service: AccessService = Depends(get_access_service),
):
    user_id = current_user.id if current_user else None
    result = await service.can_access_course(course_id=course_id, user_id=user_id)
    return APIResponse.ok(data=result, message="Course access checked")


@router.get(
    "/lesson/{lesson_id}",
    summary="Check User Access for Specific Lesson",
    response_model=APIResponse[LessonAccessResponse],
)
async def check_lesson_access(
    lesson_id: UUID,
    current_user: Optional[User] = Depends(get_optional_user),
    service: AccessService = Depends(get_access_service),
):
    user_id = current_user.id if current_user else None
    result = await service.can_access_lesson(lesson_id=lesson_id, user_id=user_id)
    return APIResponse.ok(data=result, message="Lesson access checked")


@router.get(
    "/users/me/access",
    summary="Get Current User's Active Subscriptions & Course Purchases Summary",
    response_model=APIResponse[UserAccessSummaryResponse],
)
async def get_my_access_summary(
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    subs = await service.list_user_subscriptions(user_id=current_user.id)
    purchases = await service.list_user_purchases(user_id=current_user.id)
    resp = UserAccessSummaryResponse(subscriptions=subs, purchases=purchases)
    return APIResponse.ok(data=resp, message="User access summary retrieved")
