import pytest
from decimal import Decimal
from unittest.mock import patch

from app.services.payment_provider import (
    MockPaymentProvider,
    RazorpayPaymentProvider,
    StripePaymentProvider,
    get_payment_provider,
)


@pytest.mark.asyncio
async def test_mock_payment_provider_create_order():
    provider = MockPaymentProvider()
    order = await provider.create_order(
        amount=Decimal("49.99"),
        currency="USD",
        receipt="rcpt_123",
        notes={"course_id": "c1"},
        idempotency_key="idem_123",
    )
    assert order["provider"] == "MOCK"
    assert "order_id" in order
    assert order["amount"] == 49.99
    assert order["currency"] == "USD"
    assert order["notes"]["idempotency_key"] == "idem_123"


@pytest.mark.asyncio
async def test_mock_payment_provider_verify_signature():
    provider = MockPaymentProvider()
    assert provider.verify_payment_signature("order_1", "pay_1", "sig_1") is True
    assert await provider.verify_signature(b'{"test": 1}', "sig_1", "secret") is True


@pytest.mark.asyncio
async def test_mock_payment_provider_refund():
    provider = MockPaymentProvider()
    refund = await provider.create_refund(
        provider_payment_id="pay_123",
        amount=Decimal("49.99"),
        reason="student_request",
        idempotency_key="ref_idem_123",
    )
    assert refund["status"] in ("succeeded", "processed")
    assert refund["amount"] == 49.99


def test_get_payment_provider_factory():
    import sys
    from unittest.mock import MagicMock
    from app.core.config import settings

    # Test resolving by argument
    mock_prov = get_payment_provider("mock")
    assert isinstance(mock_prov, MockPaymentProvider)

    mock_razorpay = MagicMock()
    with patch.dict(sys.modules, {"razorpay": mock_razorpay}):
        with patch.object(settings, "RAZORPAY_KEY_ID", "rzp_key_test"):
            with patch.object(settings, "RAZORPAY_KEY_SECRET", "rzp_sec_test"):
                rzp_prov = get_payment_provider("razorpay")
                assert isinstance(rzp_prov, RazorpayPaymentProvider)

    mock_stripe = MagicMock()
    with patch.dict(sys.modules, {"stripe": mock_stripe}):
        with patch.object(settings, "STRIPE_SECRET_KEY", "sk_test_key_123"):
            stripe_prov = get_payment_provider("stripe")
            assert isinstance(stripe_prov, StripePaymentProvider)


def test_production_guard_forbids_mock_provider():
    from app.core.config import settings
    with patch.object(settings, "ENVIRONMENT", "production"):
        with pytest.raises(ValueError, match="MockPaymentProvider is strictly forbidden"):
            get_payment_provider("mock")
