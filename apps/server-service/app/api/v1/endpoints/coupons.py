from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_current_active_user,
    get_payment_service,
    require_permission,
)
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.payment import (
    CouponRequest,
    CouponResponse,
    CouponValidationResponse,
    ValidateCouponRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Coupons"])


@router.post(
    "/coupons",
    summary="Create Discount Coupon",
    response_model=APIResponse[CouponResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_coupon(
    institution_id: UUID,
    body: CouponRequest,
    _: bool = Depends(require_permission("payment.manage")),
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.create_coupon(
        institution_id=institution_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Coupon created successfully")


@router.get(
    "/coupons",
    summary="List Institution Coupons",
    response_model=APIResponse[List[CouponResponse]],
)
async def list_coupons(
    institution_id: Optional[UUID] = Query(None),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.list_coupons(institution_id=institution_id)
    return APIResponse.ok(data=result, message="Coupons listed successfully")


@router.patch(
    "/coupons/{coupon_id}",
    summary="Update Coupon Details",
    response_model=APIResponse[CouponResponse],
)
async def update_coupon(
    coupon_id: UUID,
    body: CouponRequest,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.update_coupon(
        coupon_id=coupon_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Coupon updated successfully")


@router.delete(
    "/coupons/{coupon_id}",
    summary="Delete Coupon",
    response_model=APIResponse[None],
)
async def delete_coupon(
    coupon_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    await service.delete_coupon(coupon_id=coupon_id, user_id=current_user.id)
    return APIResponse.ok(message="Coupon deleted successfully")


@router.post(
    "/coupons/validate",
    summary="Validate Coupon Code for Checkout",
    response_model=APIResponse[CouponValidationResponse],
)
async def validate_coupon(
    body: ValidateCouponRequest,
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.validate_coupon(payload=body)
    return APIResponse.ok(data=result, message="Coupon validation completed")
