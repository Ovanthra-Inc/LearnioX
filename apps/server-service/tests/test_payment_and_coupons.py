import json
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.core.exceptions import ConflictException, ForbiddenException
from app.models.payment import DiscountType, PaymentStatus
from app.schemas.payment import PurchaseCourseRequest, ValidateCouponRequest
from app.services.payment_service import PaymentService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def payment_service(mock_db):
    service = PaymentService(db=mock_db, redis=None)
    service.repo = MagicMock()
    service.course_repo = MagicMock()
    service.enrollment_repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_coupon_discount_calculation_percentage_and_fixed(payment_service):
    """Test coupon validation accurately computes percentage and fixed amount discounts."""
    course_id = uuid.uuid4()
    coupon_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.price = Decimal("100.00")
    payment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)

    # 1. Percentage discount: 20% off $100 -> $80
    fake_coupon_pct = MagicMock()
    fake_coupon_pct.id = coupon_id
    fake_coupon_pct.code = "PROMO20"
    fake_coupon_pct.discount_type = DiscountType.PERCENTAGE
    fake_coupon_pct.discount_value = Decimal("20.00")
    fake_coupon_pct.max_usage = 100
    fake_coupon_pct.used_count = 10
    fake_coupon_pct.expires_at = None
    fake_coupon_pct.is_active = True
    fake_coupon_pct.course_id = None  # Valid for all courses

    payment_service.repo.get_coupon_by_code = AsyncMock(return_value=fake_coupon_pct)

    res_pct = await payment_service.validate_coupon(ValidateCouponRequest(code="PROMO20", course_id=course_id))
    assert res_pct.valid is True
    assert res_pct.final_amount == Decimal("80.00")
    assert res_pct.discount == Decimal("20.00")

    # 2. Fixed amount discount: $30 off $100 -> $70
    fake_coupon_fixed = MagicMock()
    fake_coupon_fixed.id = coupon_id
    fake_coupon_fixed.code = "FLAT30"
    fake_coupon_fixed.discount_type = DiscountType.FIXED
    fake_coupon_fixed.discount_value = Decimal("30.00")
    fake_coupon_fixed.max_usage = 50
    fake_coupon_fixed.used_count = 5
    fake_coupon_fixed.expires_at = None
    fake_coupon_fixed.is_active = True
    fake_coupon_fixed.course_id = course_id

    payment_service.repo.get_coupon_by_code = AsyncMock(return_value=fake_coupon_fixed)

    res_fixed = await payment_service.validate_coupon(ValidateCouponRequest(code="FLAT30", course_id=course_id))
    assert res_fixed.valid is True
    assert res_fixed.final_amount == Decimal("70.00")
    assert res_fixed.discount == Decimal("30.00")


@pytest.mark.asyncio
async def test_concurrent_coupon_usage_limit_rejection(payment_service):
    """Test concurrent coupon usage raises ConflictException when max_usage limit is reached."""
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    coupon_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.price = Decimal("100.00")
    fake_course.currency = "USD"
    fake_course.institution_id = uuid.uuid4()

    fake_coupon = MagicMock()
    fake_coupon.id = coupon_id
    fake_coupon.code = "LIMITED1"
    fake_coupon.discount_type = DiscountType.PERCENTAGE
    fake_coupon.discount_value = Decimal("50.00")
    fake_coupon.max_usage = 1
    fake_coupon.used_count = 0
    fake_coupon.expires_at = None
    fake_coupon.is_active = True
    fake_coupon.course_id = None

    payment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    payment_service.repo.get_payment_by_idempotency_key = AsyncMock(return_value=None)
    payment_service.repo.find_course_purchase = AsyncMock(return_value=None)
    payment_service.enrollment_repo.find_enrollment = AsyncMock(return_value=None)
    payment_service.repo.get_coupon_by_code = AsyncMock(return_value=fake_coupon)

    # Simulate race condition: increment_coupon_usage fails because another transaction claimed the last use
    payment_service.repo.increment_coupon_usage = AsyncMock(return_value=False)

    payload = PurchaseCourseRequest(coupon_code="LIMITED1")

    with pytest.raises(ConflictException) as exc_info:
        await payment_service.purchase_course(user_id=user_id, course_id=course_id, payload=payload)

    assert exc_info.value.error_code == "COUPON_LIMIT_REACHED"


@pytest.mark.asyncio
async def test_webhook_invalid_signature_rejection(payment_service):
    """Test webhook processing raises ForbiddenException on HMAC signature verification failure."""
    with patch("app.services.payment_service.get_payment_provider") as mock_get_prov:
        mock_prov = MagicMock()
        mock_prov.verify_signature = AsyncMock(return_value=False)
        mock_get_prov.return_value = mock_prov

        with pytest.raises(ForbiddenException) as exc_info:
            await payment_service.process_webhook(
                provider="razorpay",
                payload_bytes=b'{"event": "order.paid"}',
                signature="invalid_signature_hash",
            )

        assert exc_info.value.error_code == "INVALID_WEBHOOK_SIGNATURE"


@pytest.mark.asyncio
async def test_webhook_refund_revokes_enrollment(payment_service):
    """Test refund webhook marks payment and purchase refunded and cancels enrollment."""
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    fake_payment = MagicMock()
    fake_payment.id = payment_id
    fake_payment.user_id = user_id
    fake_payment.status = PaymentStatus.SUCCESS
    fake_payment.metadata_json = json.dumps({
        "user_id": str(user_id),
        "course_id": str(course_id),
    })

    payment_service.repo.get_payment_by_provider_payment_id = AsyncMock(return_value=fake_payment)
    payment_service.repo.refund_payment = AsyncMock()
    payment_service.repo.update_purchase_status_by_payment = AsyncMock()
    payment_service.enrollment_repo.cancel_enrollment = AsyncMock(return_value=True)

    payload_dict = {
        "event": "refund.processed",
        "payload": {
            "refund": {
                "entity": {
                    "payment_id": "pay_test_refund_xyz",
                }
            }
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")

    with patch("app.services.payment_service.get_payment_provider") as mock_get_prov:
        mock_prov = MagicMock()
        mock_prov.verify_signature = AsyncMock(return_value=True)
        mock_get_prov.return_value = mock_prov

        res = await payment_service.process_webhook(
            provider="razorpay",
            payload_bytes=payload_bytes,
            signature="valid_signature",
        )

        assert res["status"] == "ok"
        payment_service.repo.refund_payment.assert_called_once_with(payment_id)
        payment_service.repo.update_purchase_status_by_payment.assert_called_once_with(
            payment_id, PaymentStatus.REFUNDED
        )
        payment_service.enrollment_repo.cancel_enrollment.assert_called_once_with(user_id, course_id)
