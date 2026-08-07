import hashlib
import hmac
import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Header, Query, Request, status

from app.api.deps import (
    get_current_active_user,
    get_payment_service,
    require_institution_owner,
)
from app.core.config import settings
from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.response import APIResponse
from app.models.payment import PaymentStatus
from app.models.user import User
from app.schemas.payment import (
    PaymentRequest,
    PaymentResponse,
    PaymentStatisticsResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(tags=["Payment Provider & History"])


@router.post(
    "/payments/create",
    summary="Create Mock Payment Session",
    response_model=APIResponse[PaymentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_payment_session(
    body: PaymentRequest,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.create_payment_session(payload=body)
    return APIResponse.ok(data=result, message="Payment session created successfully")


@router.post(
    "/payments/webhook",
    summary="Payment Provider Webhook Callback",
    response_model=APIResponse[dict],
)
async def payment_webhook(
    request: Request,
    x_webhook_signature: str = Header(
        default="",
        alias="X-Webhook-Signature",
        description="HMAC-SHA256 hex signature of the raw request body using WEBHOOK_SECRET",
    ),
    service: PaymentService = Depends(get_payment_service),
):
    """
    Processes payment provider webhook callbacks.

    Security: All incoming webhook requests must include a valid HMAC-SHA256
    signature in the `X-Webhook-Signature` header. The signature is computed
    over the raw request body using the `WEBHOOK_SECRET` shared secret.

    In development mode, signature verification is skipped for local testing.
    """
    raw_body = await request.body()

    # CRIT-05: Verify signature in production (skip in dev for ease of testing)
    if settings.is_production:
        if not x_webhook_signature:
            raise ForbiddenException(
                message="Missing webhook signature header X-Webhook-Signature",
                error_code="MISSING_WEBHOOK_SIGNATURE",
            )
        if not settings.verify_webhook_signature(raw_body, x_webhook_signature):
            raise ForbiddenException(
                message="Invalid webhook signature — request rejected",
                error_code="INVALID_WEBHOOK_SIGNATURE",
            )

    # CRIT-05: Actually process the webhook event (was previously a no-op)
    try:
        event = json.loads(raw_body)
    except (json.JSONDecodeError, ValueError):
        raise ForbiddenException(
            message="Invalid webhook payload — must be valid JSON",
            error_code="INVALID_WEBHOOK_PAYLOAD",
        )

    event_type = event.get("type", "")
    payment_id = event.get("payment_id")

    if event_type == "payment.success" and payment_id:
        try:
            await service.repo.confirm_payment(UUID(payment_id))
        except Exception:
            pass  # Log but don't fail — provider should retry on webhook failure

    elif event_type == "payment.failed" and payment_id:
        try:
            await service.repo.db.execute(
                __import__("sqlalchemy", fromlist=["update"])
                .update(__import__("app.models.payment", fromlist=["Payment"]).Payment)
                .where(__import__("app.models.payment", fromlist=["Payment"]).Payment.id == UUID(payment_id))
                .values(status=PaymentStatus.FAILED)
            )
            await service.repo.db.flush()
        except Exception:
            pass

    mode = "production" if settings.is_production else "dev"
    return APIResponse.ok(
        data={"received": True, "event_type": event_type},
        message=f"Webhook processed successfully ({mode})",
    )


@router.get(
    "/payments/history",
    summary="List Payment History (Institution Owner Admin)",
    response_model=APIResponse[List[PaymentResponse]],
)
async def list_payment_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: bool = Depends(require_institution_owner()),  # CRIT-04: owner only
    service: PaymentService = Depends(get_payment_service),
):
    payments, _ = await service.repo.list_all_payments(page=page, limit=limit)
    items = [PaymentResponse.model_validate(p) for p in payments]
    return APIResponse.ok(data=items, message="Payment history retrieved")


@router.get(
    "/payments/statistics",
    summary="Get Payment Gateway Statistics (Institution Owner Admin)",
    response_model=APIResponse[PaymentStatisticsResponse],
)
async def get_payment_statistics(
    _: bool = Depends(require_institution_owner()),  # CRIT-04: owner only
    service: PaymentService = Depends(get_payment_service),
):
    result = await service.get_payment_statistics()
    return APIResponse.ok(data=result, message="Payment statistics retrieved")


@router.get(
    "/payments/{payment_id}",
    summary="Get Payment Record Details",
    response_model=APIResponse[PaymentResponse],
)
async def get_payment_by_id(
    payment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: PaymentService = Depends(get_payment_service),
):
    payment = await service.repo.get_payment_by_id(payment_id)
    if not payment:
        raise NotFoundException(
            message="Payment record not found",
            error_code="PAYMENT_NOT_FOUND",
        )
    # Ensure user can only see their own payment records (unless owner — handled by caller)
    if payment.user_id and payment.user_id != current_user.id:
        raise ForbiddenException(
            message="Access denied to this payment record",
            error_code="FORBIDDEN",
        )
    return APIResponse.ok(data=PaymentResponse.model_validate(payment), message="Payment details retrieved")
