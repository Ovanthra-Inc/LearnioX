"""
Payment Service — Razorpay integration endpoints.

Flow:
  1. POST /payments/orders     → create Razorpay order, store Payment row (CREATED)
  2. Frontend completes payment via Razorpay SDK
  3. POST /payments/verify     → verify signature, capture payment, activate enrollment
  4. Webhooks from Razorpay    → POST /payments/webhooks/razorpay
"""
import uuid
import hmac
import hashlib
import logging
import httpx
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import get_settings
from app.models.payment import Payment, Refund, Payout, PaymentStatus
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

# Lazy import razorpay to avoid import error if key not set during tests
import razorpay

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

try:
    _rzp = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
except Exception:
    _rzp = None


def get_db():
    from app.db.session import AsyncSessionLocal
    from contextlib import asynccontextmanager
    raise NotImplementedError("Use Depends(get_db) from dependencies")


from app.dependencies.db import get_db  # noqa: E402


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    user_id: uuid.UUID
    amount: float                    # in INR (full rupees, not paise)
    currency: str = "INR"
    course_id: uuid.UUID | None = None
    institution_id: uuid.UUID | None = None
    enrollment_id: uuid.UUID | None = None
    membership_id: uuid.UUID | None = None
    description: str | None = None


class VerifyPaymentRequest(BaseModel):
    payment_id: uuid.UUID            # our internal payment row ID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RefundRequest(BaseModel):
    amount: float | None = None      # None = full refund
    reason: str | None = None


class PaymentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    razorpay_order_id: str | None
    razorpay_payment_id: str | None
    amount: float
    currency: str
    status: str
    course_id: uuid.UUID | None = None
    enrollment_id: uuid.UUID | None = None
    failure_reason: str | None = None
    created_at: datetime


class OrderResponse(BaseModel):
    payment_id: uuid.UUID
    razorpay_order_id: str
    amount_paise: int
    currency: str
    key_id: str


def _pr(p) -> PaymentResponse:
    return PaymentResponse(
        id=p.id, user_id=p.user_id,
        razorpay_order_id=p.razorpay_order_id,
        razorpay_payment_id=p.razorpay_payment_id,
        amount=float(p.amount), currency=p.currency,
        status=p.status.value, course_id=p.course_id,
        enrollment_id=p.enrollment_id,
        failure_reason=p.failure_reason, created_at=p.created_at,
    )


# ── Order Creation ────────────────────────────────────────────────────────────

@router.post("/payments/orders", response_model=APIResponse[OrderResponse], status_code=201)
async def create_order(request: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    """Create a Razorpay order and return it to the frontend for checkout."""
    if not _rzp:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    amount_paise = int(request.amount * 100)

    try:
        rzp_order = _rzp.order.create({
            "amount": amount_paise,
            "currency": request.currency,
            "payment_capture": 1,
            "notes": {
                "course_id": str(request.course_id) if request.course_id else "",
                "institution_id": str(request.institution_id) if request.institution_id else "",
            }
        })
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")

    payment = Payment(
        user_id=request.user_id,
        institution_id=request.institution_id,
        course_id=request.course_id,
        enrollment_id=request.enrollment_id,
        membership_id=request.membership_id,
        razorpay_order_id=rzp_order["id"],
        amount=Decimal(str(request.amount)),
        currency=request.currency,
        description=request.description,
        status=PaymentStatus.CREATED,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    return APIResponse(
        success=True, message="Order created",
        data=OrderResponse(
            payment_id=payment.id,
            razorpay_order_id=rzp_order["id"],
            amount_paise=amount_paise,
            currency=request.currency,
            key_id=settings.RAZORPAY_KEY_ID,
        ),
    )


# ── Payment Verification ──────────────────────────────────────────────────────

@router.post("/payments/verify", response_model=APIResponse[PaymentResponse])
async def verify_payment(request: VerifyPaymentRequest, db: AsyncSession = Depends(get_db)):
    """Verify Razorpay signature and capture payment."""
    result = await db.execute(select(Payment).where(Payment.id == request.payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Signature verification
    expected_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{request.razorpay_order_id}|{request.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, request.razorpay_signature):
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = "Signature verification failed"
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Mark as captured
    payment.razorpay_payment_id = request.razorpay_payment_id
    payment.razorpay_signature = request.razorpay_signature
    payment.status = PaymentStatus.CAPTURED
    payment.captured_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(payment)

    # Notify enrollment service to activate enrollment
    if payment.enrollment_id and settings.ENROLLMENT_SERVICE_URL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{settings.ENROLLMENT_SERVICE_URL}/api/v1/enrollments/{payment.enrollment_id}/reactivate",
                    headers={"x-api-key": settings.INTERNAL_API_KEY},
                )
        except Exception as e:
            logger.warning(f"Failed to activate enrollment after payment: {e}")

    return APIResponse(success=True, message="Payment verified and captured", data=_pr(payment))


# ── Razorpay Webhook ──────────────────────────────────────────────────────────

@router.post("/payments/webhooks/razorpay", response_model=APIResponse[dict])
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Razorpay webhook events."""
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    if settings.RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})

    if event == "payment.captured":
        rzp_payment_id = entity.get("id", "")
        rzp_order_id = entity.get("order_id", "")
        result = await db.execute(
            select(Payment).where(Payment.razorpay_order_id == rzp_order_id)
        )
        payment = result.scalar_one_or_none()
        if payment and payment.status != PaymentStatus.CAPTURED:
            payment.razorpay_payment_id = rzp_payment_id
            payment.status = PaymentStatus.CAPTURED
            payment.captured_at = datetime.now(timezone.utc)
            await db.commit()

    elif event == "payment.failed":
        rzp_order_id = entity.get("order_id", "")
        result = await db.execute(
            select(Payment).where(Payment.razorpay_order_id == rzp_order_id)
        )
        payment = result.scalar_one_or_none()
        if payment:
            payment.status = PaymentStatus.FAILED
            payment.failure_reason = entity.get("error_description", "Unknown")
            await db.commit()

    return APIResponse(success=True, message="Webhook processed", data={"event": event})


# ── Refunds ───────────────────────────────────────────────────────────────────

@router.post("/payments/{payment_id}/refund", response_model=APIResponse[dict])
async def refund_payment(
    payment_id: uuid.UUID, request: RefundRequest, db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status != PaymentStatus.CAPTURED:
        raise HTTPException(status_code=400, detail="Only captured payments can be refunded")
    if not payment.razorpay_payment_id:
        raise HTTPException(status_code=400, detail="No Razorpay payment ID on record")

    refund_amount_paise = int((request.amount or float(payment.amount)) * 100)

    try:
        rzp_refund = _rzp.payment.refund(payment.razorpay_payment_id, {"amount": refund_amount_paise})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Refund failed: {str(e)}")

    refund = Refund(
        payment_id=payment.id,
        razorpay_refund_id=rzp_refund.get("id"),
        amount=Decimal(str(request.amount or float(payment.amount))),
        reason=request.reason,
        status="processed",
    )
    db.add(refund)
    payment.status = PaymentStatus.REFUNDED
    await db.commit()

    return APIResponse(success=True, message="Refund initiated", data={
        "razorpay_refund_id": rzp_refund.get("id"),
        "amount": request.amount or float(payment.amount),
    })


# ── History / Lists ───────────────────────────────────────────────────────────

@router.get("/payments/{payment_id}", response_model=APIResponse[PaymentResponse])
async def get_payment(payment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return APIResponse(success=True, message="Payment retrieved", data=_pr(p))


@router.get("/users/{user_id}/payments", response_model=PaginatedResponse[PaymentResponse])
async def list_user_payments(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_res = await db.execute(select(func.count(Payment.id)).where(Payment.user_id == user_id))
    total = total_res.scalar_one()
    result = await db.execute(
        select(Payment).where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Payments retrieved",
        data=[_pr(p) for p in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/institutions/{institution_id}/payments", response_model=PaginatedResponse[PaymentResponse])
async def list_institution_payments(
    institution_id: uuid.UUID,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_res = await db.execute(
        select(func.count(Payment.id)).where(Payment.institution_id == institution_id)
    )
    total = total_res.scalar_one()
    result = await db.execute(
        select(Payment).where(Payment.institution_id == institution_id)
        .order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Institution payments retrieved",
        data=[_pr(p) for p in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


# ── Payouts ───────────────────────────────────────────────────────────────────

@router.get("/institutions/{institution_id}/payouts", response_model=APIResponse[list[dict]])
async def list_payouts(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payout).where(Payout.institution_id == institution_id).order_by(Payout.created_at.desc())
    )
    payouts = result.scalars().all()
    return APIResponse(success=True, message="Payouts retrieved", data=[
        {"id": str(p.id), "amount": float(p.amount), "status": p.status, "created_at": str(p.created_at)}
        for p in payouts
    ])


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy", "gateway": "razorpay"})
