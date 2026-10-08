from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Header, status

from app.api.deps import get_current_active_user, get_payment_service
from app.core.exceptions import NotFoundException
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.payment import (
    CoursePurchaseResponse,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PurchaseCourseRequest,
    RefundPurchaseRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Course Purchases"])


@router.post(
    "/courses/{course_id}/checkout",
    summary="Initiate Course Purchase Order (Razorpay / Stripe / Mock)",
    response_model=APIResponse[PaymentOrderResponse],
    status_code=status.HTTP_200_OK,
)
async def checkout_course(
    course_id: UUID,
    body: PurchaseCourseRequest = PurchaseCourseRequest(),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.initiate_course_purchase(
        course_id=course_id,
        user_id=current_user.id,
        payload=body,
        idempotency_key=idempotency_key,
    )
    return APIResponse.ok(data=result, message="Order initiated successfully")


@router.post(
    "/purchases/verify",
    summary="Verify Client Payment Signature & Activate Enrollment",
    response_model=APIResponse[PaymentVerifyResponse],
    status_code=status.HTTP_200_OK,
)
async def verify_payment(
    body: PaymentVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.verify_course_payment(
        user_id=current_user.id,
        payload=body,
    )
    return APIResponse.ok(data=result, message=result.message)


@router.post(
    "/courses/{course_id}/purchase",
    summary="One-Time Course Purchase Checkout (Direct / Legacy)",
    response_model=APIResponse[CoursePurchaseResponse],
    status_code=status.HTTP_201_CREATED,
)
async def purchase_course(
    course_id: UUID,
    body: PurchaseCourseRequest = PurchaseCourseRequest(),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.purchase_course(
        course_id=course_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Course purchased successfully")


@router.get(
    "/users/me/purchases",
    summary="List Logged-in User's Course Purchases",
    response_model=APIResponse[List[CoursePurchaseResponse]],
)
async def get_my_purchases(
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.list_user_purchases(user_id=current_user.id)
    return APIResponse.ok(data=result, message="User purchases retrieved")


@router.get(
    "/purchases/{purchase_id}",
    summary="Get Course Purchase Details",
    response_model=APIResponse[CoursePurchaseResponse],
)
async def get_purchase_by_id(
    purchase_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    purchase = await service.repo.get_course_purchase_by_id(purchase_id)
    if not purchase:
        raise NotFoundException(message="Purchase not found", error_code="PURCHASE_NOT_FOUND")

    resp = CoursePurchaseResponse(
        purchase_id=purchase.id,
        user_id=purchase.user_id,
        course_id=purchase.course_id,
        payment_id=purchase.payment_id,
        amount=purchase.amount,
        currency=purchase.currency,
        status=purchase.status.value if hasattr(purchase.status, "value") else str(purchase.status),
        created_at=purchase.created_at,
    )
    return APIResponse.ok(data=resp, message="Purchase details retrieved")


@router.post(
    "/purchases/{purchase_id}/refund",
    summary="Refund Course Purchase & Revoke Enrollment (Admin Only)",
    response_model=APIResponse[CoursePurchaseResponse],
)
async def refund_purchase(
    purchase_id: UUID,
    body: RefundPurchaseRequest = RefundPurchaseRequest(),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.refund_course_purchase(
        purchase_id=purchase_id,
        user_id=current_user.id,
        reason=body.reason,
    )
    return APIResponse.ok(data=result, message="Purchase successfully refunded and enrollment revoked")
