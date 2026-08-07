from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import (
    get_current_active_user,
    get_payment_service,
    require_permission,
)
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.payment import (
    AssignCoursesRequest,
    CreateMembershipPlanRequest,
    MembershipPlanResponse,
    MembershipStatisticsResponse,
    SubscribeRequest,
    SubscriptionResponse,
    UpdateMembershipPlanRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Membership Plans & Subscriptions"])


@router.post(
    "/institutions/{institution_id}/membership-plans",
    summary="Create Membership Plan",
    response_model=APIResponse[MembershipPlanResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_membership_plan(
    institution_id: UUID,
    body: CreateMembershipPlanRequest,
    _: bool = Depends(require_permission("membership.manage")),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.create_membership_plan(
        institution_id=institution_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Membership plan created successfully")


@router.get(
    "/institutions/{institution_id}/membership-plans",
    summary="List Membership Plans in Institution",
    response_model=APIResponse[List[MembershipPlanResponse]],
)
async def list_membership_plans(
    institution_id: UUID,
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.list_membership_plans(institution_id=institution_id)
    return APIResponse.ok(data=result, message="Membership plans listed successfully")


@router.get(
    "/membership-plans/{plan_id}",
    summary="Get Membership Plan Details",
    response_model=APIResponse[MembershipPlanResponse],
)
async def get_membership_plan_by_id(
    plan_id: UUID,
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.get_membership_plan(plan_id=plan_id)
    return APIResponse.ok(data=result, message="Membership plan details retrieved")


@router.patch(
    "/membership-plans/{plan_id}",
    summary="Update Membership Plan",
    response_model=APIResponse[MembershipPlanResponse],
)
async def update_membership_plan(
    plan_id: UUID,
    body: UpdateMembershipPlanRequest,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.update_membership_plan(
        plan_id=plan_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Membership plan updated successfully")


@router.delete(
    "/membership-plans/{plan_id}",
    summary="Delete Membership Plan",
    response_model=APIResponse[None],
)
async def delete_membership_plan(
    plan_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    await service.delete_membership_plan(plan_id=plan_id, user_id=current_user.id)
    return APIResponse.ok(message="Membership plan deleted successfully")


@router.post(
    "/membership-plans/{plan_id}/courses",
    summary="Assign Courses to Membership Plan",
    response_model=APIResponse[MembershipPlanResponse],
)
async def assign_courses_to_plan(
    plan_id: UUID,
    body: AssignCoursesRequest,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.assign_courses_to_plan(
        plan_id=plan_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Courses assigned to plan successfully")


@router.delete(
    "/membership-plans/{plan_id}/courses/{course_id}",
    summary="Remove Course from Membership Plan",
    response_model=APIResponse[MembershipPlanResponse],
)
async def remove_course_from_plan(
    plan_id: UUID,
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.remove_course_from_plan(
        plan_id=plan_id, course_id=course_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Course removed from plan successfully")


# Subscription Endpoints
@router.post(
    "/membership-plans/{plan_id}/subscribe",
    summary="Subscribe User to Membership Plan",
    response_model=APIResponse[SubscriptionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def subscribe_plan(
    plan_id: UUID,
    body: SubscribeRequest = SubscribeRequest(),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.subscribe_plan(
        plan_id=plan_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Subscribed to membership plan successfully")


@router.delete(
    "/subscriptions/{subscription_id}",
    summary="Cancel Active Subscription",
    response_model=APIResponse[None],
)
async def cancel_subscription(
    subscription_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    await service.cancel_subscription(subscription_id=subscription_id, user_id=current_user.id)
    return APIResponse.ok(message="Subscription cancelled successfully")


@router.get(
    "/users/me/subscriptions",
    summary="List Logged-in User's Active Subscriptions",
    response_model=APIResponse[List[SubscriptionResponse]],
)
async def get_my_subscriptions(
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.list_user_subscriptions(user_id=current_user.id)
    return APIResponse.ok(data=result, message="User subscriptions retrieved")


@router.get(
    "/membership/statistics",
    summary="Get Membership Revenue Statistics (Admin)",
    response_model=APIResponse[MembershipStatisticsResponse],
)
async def get_membership_statistics(
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.get_membership_statistics()
    return APIResponse.ok(data=result, message="Membership statistics retrieved")
