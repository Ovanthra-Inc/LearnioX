import json
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.models.course import CourseAccessType
from app.models.enrollment import EnrollmentAccessType, EnrollmentStatus
from app.models.payment import PaymentStatus
from app.schemas.payment import PaymentVerifyRequest, PurchaseCourseRequest
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
    service.repo.confirm_payment = AsyncMock()
    service.repo.create_payment = AsyncMock()
    service.repo.create_course_purchase = AsyncMock()
    service.repo.refund_payment = AsyncMock()
    service.repo.update_purchase_status_by_payment = AsyncMock()
    service.course_repo = MagicMock()
    service.enrollment_repo = MagicMock()
    service.enrollment_repo.cancel_enrollment = AsyncMock()
    service.enrollment_repo.create_enrollment = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_full_course_purchase_and_refund_lifecycle(payment_service):
    """
    Test the full end-to-end lifecycle:
    1. Student initiates course purchase -> creates order and pending payment
    2. Student verifies payment with valid signature -> creates purchase & activates enrollment
    3. Admin initiates refund -> calls provider refund, marks purchase REFUNDED, revokes enrollment
    """
    user_id = uuid.uuid4()
    admin_id = uuid.uuid4()
    institution_id = uuid.uuid4()
    course_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    purchase_id = uuid.uuid4()

    # Setup Course
    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.institution_id = institution_id
    fake_course.price = Decimal("99.99")
    fake_course.currency = "USD"
    fake_course.access_type = CourseAccessType.PAID
    payment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)

    # Initial state: user has not purchased or enrolled
    payment_service.repo.get_payment_by_idempotency_key = AsyncMock(return_value=None)
    payment_service.repo.find_course_purchase = AsyncMock(return_value=None)
    payment_service.enrollment_repo.find_enrollment = AsyncMock(return_value=None)

    # 1. Initiate purchase (with mock provider configured)
    fake_pending_payment = MagicMock()
    fake_pending_payment.id = payment_id
    fake_pending_payment.amount = Decimal("99.99")
    fake_pending_payment.currency = "USD"
    fake_pending_payment.provider = "MOCK"
    fake_pending_payment.provider_order_id = "order_mock_123"
    fake_pending_payment.status = PaymentStatus.PENDING
    payment_service.repo.create_payment = AsyncMock(return_value=fake_pending_payment)
    payment_service.repo.create_course_purchase = AsyncMock()
    payment_service.enrollment_repo.create_enrollment = AsyncMock()

    order_response = await payment_service.initiate_course_purchase(
        course_id=course_id,
        user_id=user_id,
        payload=PurchaseCourseRequest(coupon_code=None),
    )

    assert order_response.amount == Decimal("99.99")
    assert order_response.currency == "USD"
    assert order_response.payment_id == payment_id
    payment_service.repo.create_payment.assert_called_once()

    # 2. Verify Payment Completion
    fake_payment_record = MagicMock()
    fake_payment_record.id = payment_id
    fake_payment_record.status = PaymentStatus.PENDING
    fake_payment_record.provider = "MOCK"
    fake_payment_record.provider_order_id = "order_mock_123"
    fake_payment_record.provider_payment_id = "pay_mock_123"
    fake_payment_record.amount = Decimal("99.99")
    fake_payment_record.currency = "USD"
    fake_payment_record.metadata_json = json.dumps({
        "course_id": str(course_id),
        "user_id": str(user_id),
        "institution_id": str(institution_id),
    })
    payment_service.repo.get_payment_by_id = AsyncMock(return_value=fake_payment_record)
    payment_service.repo.confirm_payment = AsyncMock()

    verify_response = await payment_service.verify_course_payment(
        user_id=user_id,
        payload=PaymentVerifyRequest(
            payment_id=payment_id,
            provider_payment_id="pay_mock_123",
            signature="mock_valid_signature",
        ),
    )

    assert verify_response.success is True
    assert verify_response.payment_id == payment_id
    payment_service.repo.confirm_payment.assert_called_with(payment_id, provider_payment_id="pay_mock_123")
    payment_service.repo.create_course_purchase.assert_called()
    payment_service.enrollment_repo.create_enrollment.assert_called_with(
        user_id=user_id,
        course_id=course_id,
        institution_id=institution_id,
        access_type=EnrollmentAccessType.PURCHASED,
    )

    # 3. Admin Initiates Refund
    from datetime import datetime, timezone

    fake_purchase = MagicMock()
    fake_purchase.id = purchase_id
    fake_purchase.user_id = user_id
    fake_purchase.course_id = course_id
    fake_purchase.payment_id = payment_id
    fake_purchase.amount = Decimal("99.99")
    fake_purchase.currency = "USD"
    fake_purchase.status = PaymentStatus.SUCCESS
    fake_purchase.created_at = datetime.now(timezone.utc)

    payment_service.repo.get_course_purchase_by_id = AsyncMock(return_value=fake_purchase)
    payment_service.repo.refund_payment = AsyncMock()
    payment_service.repo.update_purchase_status_by_payment = AsyncMock()
    payment_service.enrollment_repo.cancel_enrollment = AsyncMock()

    # Mock admin verification passes
    payment_service._verify_institution_admin = AsyncMock()

    refund_response = await payment_service.refund_course_purchase(
        purchase_id=purchase_id,
        user_id=admin_id,
        reason="Requested by customer within 14 days",
    )

    assert refund_response.purchase_id == purchase_id
    assert refund_response.status == PaymentStatus.REFUNDED.value
    payment_service.repo.refund_payment.assert_called_with(payment_id)
    payment_service.repo.update_purchase_status_by_payment.assert_called_with(payment_id, PaymentStatus.REFUNDED)
    payment_service.enrollment_repo.cancel_enrollment.assert_called_with(user_id, course_id)
