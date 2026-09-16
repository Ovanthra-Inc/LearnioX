from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.api.deps import get_payment_service
from app.core.response import APIResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/webhooks", tags=["Payment Webhooks"])


@router.post("/razorpay", summary="Razorpay Webhook Handler")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(..., alias="X-Razorpay-Signature"),
    service: PaymentService = Depends(get_payment_service),
):
    body = await request.body()
    result = await service.process_webhook(
        provider="razorpay",
        payload_bytes=body,
        signature=x_razorpay_signature,
    )
    return APIResponse.ok(data=result, message="Razorpay webhook processed")


@router.post("/stripe", summary="Stripe Webhook Handler")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    service: PaymentService = Depends(get_payment_service),
):
    body = await request.body()
    result = await service.process_webhook(
        provider="stripe",
        payload_bytes=body,
        signature=stripe_signature,
    )
    return APIResponse.ok(data=result, message="Stripe webhook processed")
