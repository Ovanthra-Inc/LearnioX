import json
import uuid
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.exceptions import ForbiddenException, ValidationException
from app.models.payment import PaymentStatus
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
async def test_process_webhook_razorpay_paid_activates_enrollment(payment_service):
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    fake_payment = MagicMock()
    fake_payment.id = payment_id
    fake_payment.amount = Decimal("99.00")
    fake_payment.currency = "INR"
    fake_payment.status = PaymentStatus.PENDING
    fake_payment.metadata_json = json.dumps({
        "user_id": str(user_id),
        "course_id": str(course_id),
    })

    fake_course = MagicMock()
    fake_course.institution_id = inst_id

    payment_service.repo.get_payment_by_provider_order_id = AsyncMock(return_value=fake_payment)
    payment_service.repo.confirm_payment = AsyncMock()
    payment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    payment_service.repo.create_course_purchase = AsyncMock()
    payment_service.enrollment_repo.find_enrollment = AsyncMock(return_value=None)
    payment_service.enrollment_repo.create_enrollment = AsyncMock()

    payload_dict = {
        "event": "order.paid",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_123",
                    "order_id": "order_test_123",
                }
            }
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")

    with patch("app.services.payment_service.settings.RAZORPAY_WEBHOOK_SECRET", "test_secret"):
        with patch("app.services.payment_service.get_payment_provider") as mock_get_prov:
            mock_prov = MagicMock()
            mock_prov.verify_signature = AsyncMock(return_value=True)
            mock_get_prov.return_value = mock_prov

            res = await payment_service.process_webhook("razorpay", payload_bytes, "valid_sig")
            assert res["status"] == "ok"
            payment_service.repo.confirm_payment.assert_called_once_with(payment_id, provider_payment_id="pay_test_123")
            payment_service.enrollment_repo.create_enrollment.assert_called_once()


@pytest.mark.asyncio
async def test_process_webhook_refund_cancels_enrollment(payment_service):
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    payment_id = uuid.uuid4()

    fake_payment = MagicMock()
    fake_payment.id = payment_id
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
                    "payment_id": "pay_test_refund_123",
                }
            }
        }
    }
    payload_bytes = json.dumps(payload_dict).encode("utf-8")

    with patch("app.services.payment_service.settings.RAZORPAY_WEBHOOK_SECRET", "test_secret"):
        with patch("app.services.payment_service.get_payment_provider") as mock_get_prov:
            mock_prov = MagicMock()
            mock_prov.verify_signature = AsyncMock(return_value=True)
            mock_get_prov.return_value = mock_prov

            res = await payment_service.process_webhook("razorpay", payload_bytes, "valid_sig")
            assert res["status"] == "ok"
            payment_service.repo.refund_payment.assert_called_once_with(payment_id)
            payment_service.repo.update_purchase_status_by_payment.assert_called_once_with(payment_id, PaymentStatus.REFUNDED)
            payment_service.enrollment_repo.cancel_enrollment.assert_called_once_with(user_id, course_id)


@pytest.mark.asyncio
async def test_process_webhook_invalid_signature_raises_forbidden(payment_service):
    payload_bytes = b'{"event": "order.paid"}'
    with patch("app.services.payment_service.settings.RAZORPAY_WEBHOOK_SECRET", "test_secret"):
        with patch("app.services.payment_service.get_payment_provider") as mock_get_prov:
            mock_prov = MagicMock()
            mock_prov.verify_signature = AsyncMock(return_value=False)
            mock_get_prov.return_value = mock_prov

            with pytest.raises(ForbiddenException):
                await payment_service.process_webhook("razorpay", payload_bytes, "bad_signature")
