"""
LearnioX Payment Provider Abstraction
--------------------------------------
Implements a pluggable payment provider system.
Supports Stripe (Global/USD), Razorpay (India/INR), and Mock (isolated tests).

Provider Contract:
    create_order()           -- Creates a payment order/intent on the provider with idempotency
    verify_signature()       -- Verifies webhook/callback signature (HMAC or SDK)
    create_refund()          -- Issues a full or partial refund with idempotency
    retrieve_payment()       -- Fetches payment status from provider
"""
import hashlib
import hmac
import logging
import uuid
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, Optional

logger = logging.getLogger("server-service.payment")


class PaymentProvider(ABC):
    """Abstract base class for all payment providers."""

    @abstractmethod
    async def create_order(
        self,
        amount: Decimal,
        currency: str,
        receipt: str,
        notes: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a payment order/intent. Returns dict with provider_order_id, amount, currency, key."""

    @abstractmethod
    async def verify_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        """Verify a webhook or callback signature."""

    @abstractmethod
    async def create_refund(
        self,
        provider_payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a refund. Amount=None means full refund."""

    @abstractmethod
    async def retrieve_payment(self, provider_payment_id: str) -> Dict[str, Any]:
        """Retrieve current payment status from the provider."""

    def verify_payment_signature(self, provider_order_id: str, provider_payment_id: str, signature: str) -> bool:
        """Verify checkout redirect/callback signature. Default returns True."""
        return True


class RazorpayProvider(PaymentProvider):
    """Razorpay payment provider (India-first)."""

    def __init__(self, key_id: str, key_secret: str):
        try:
            import razorpay
            self.client = razorpay.Client(auth=(key_id, key_secret))
            self.key_id = key_id
            self.key_secret = key_secret
        except ImportError:
            raise RuntimeError("razorpay package not installed. Run: pip install razorpay")

    async def create_order(
        self,
        amount: Decimal,
        currency: str = "INR",
        receipt: str = "",
        notes: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        amount_paise = int(amount * 100)
        import asyncio
        loop = asyncio.get_event_loop()
        order_params = {
            "amount": amount_paise,
            "currency": currency.upper(),
            "receipt": receipt or f"rcpt_{uuid.uuid4().hex[:10]}",
            "notes": notes or {},
        }
        order = await loop.run_in_executor(None, lambda: self.client.order.create(order_params))
        return {
            "provider": "RAZORPAY",
            "provider_order_id": order["id"],
            "amount": float(amount),
            "currency": currency.upper(),
            "key_id": self.key_id,
            "status": order["status"],
        }

    async def verify_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        expected = hmac.new(webhook_secret.encode("utf-8"), payload, digestmod=hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def verify_payment_signature(self, provider_order_id: str, provider_payment_id: str, signature: str) -> bool:
        msg = f"{provider_order_id}|{provider_payment_id}".encode("utf-8")
        expected = hmac.new(self.key_secret.encode("utf-8"), msg, digestmod=hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def create_refund(
        self,
        provider_payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        import asyncio
        loop = asyncio.get_event_loop()
        params = {}
        if amount is not None:
            params["amount"] = int(amount * 100)
        if reason:
            params["notes"] = {"reason": reason}
        refund = await loop.run_in_executor(None, lambda: self.client.payment.refund(provider_payment_id, params))
        return {
            "refund_id": refund["id"],
            "provider_payment_id": provider_payment_id,
            "amount": float(refund.get("amount", 0)) / 100,
            "status": refund["status"],
        }

    async def retrieve_payment(self, provider_payment_id: str) -> Dict[str, Any]:
        import asyncio
        loop = asyncio.get_event_loop()
        payment = await loop.run_in_executor(None, lambda: self.client.payment.fetch(provider_payment_id))
        return {
            "provider_payment_id": provider_payment_id,
            "status": payment["status"],
            "amount": float(payment.get("amount", 0)) / 100,
            "currency": payment.get("currency", "INR"),
        }


class StripeProvider(PaymentProvider):
    """Stripe payment provider (global / USD)."""

    def __init__(self, secret_key: str, publishable_key: str = ""):
        try:
            import stripe
            stripe.api_key = secret_key
            self._stripe = stripe
            self.publishable_key = publishable_key
        except ImportError:
            raise RuntimeError("stripe package not installed. Run: pip install stripe")

    async def create_order(
        self,
        amount: Decimal,
        currency: str = "usd",
        receipt: str = "",
        notes: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        import asyncio
        amount_cents = int(amount * 100)
        loop = asyncio.get_event_loop()
        kwargs: Dict[str, Any] = {
            "amount": amount_cents,
            "currency": currency.lower(),
            "metadata": notes or {},
            "description": receipt or f"LearnioX purchase {uuid.uuid4().hex[:8]}",
        }
        if idempotency_key:
            kwargs["idempotency_key"] = idempotency_key

        intent = await loop.run_in_executor(
            None, lambda: self._stripe.PaymentIntent.create(**kwargs)
        )
        return {
            "provider": "STRIPE",
            "provider_order_id": intent["id"],
            "client_secret": intent.get("client_secret"),
            "key_id": self.publishable_key,
            "amount": float(amount),
            "currency": currency.lower(),
            "status": intent["status"],
        }

    async def verify_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None, lambda: self._stripe.Webhook.construct_event(payload, signature, webhook_secret)
            )
            return True
        except Exception as e:
            logger.warning(f"Stripe signature verification failed: {e}")
            return False

    async def create_refund(
        self,
        provider_payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        import asyncio
        loop = asyncio.get_event_loop()
        params: Dict[str, Any] = {"payment_intent": provider_payment_id}
        if amount is not None:
            params["amount"] = int(amount * 100)
        if reason:
            params["reason"] = "requested_by_customer"
        if idempotency_key:
            params["idempotency_key"] = idempotency_key

        refund = await loop.run_in_executor(None, lambda: self._stripe.Refund.create(**params))
        return {
            "refund_id": refund["id"],
            "provider_payment_id": provider_payment_id,
            "amount": float(refund.get("amount", 0)) / 100,
            "status": refund["status"],
        }

    async def retrieve_payment(self, provider_payment_id: str) -> Dict[str, Any]:
        import asyncio
        loop = asyncio.get_event_loop()
        intent = await loop.run_in_executor(None, lambda: self._stripe.PaymentIntent.retrieve(provider_payment_id))
        return {
            "provider_payment_id": provider_payment_id,
            "status": intent["status"],
            "amount": float(intent.get("amount", 0)) / 100,
            "currency": intent.get("currency", "usd"),
        }


class MockPaymentProvider(PaymentProvider):
    """Mock provider for isolated automated testing only. Forbidden in production."""

    async def create_order(
        self,
        amount: Decimal,
        currency: str = "USD",
        receipt: str = "",
        notes: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        provider_id = f"pay_mock_{uuid.uuid4().hex[:12]}"
        return {
            "provider": "MOCK",
            "order_id": provider_id,
            "provider_order_id": provider_id,
            "client_secret": f"mock_secret_{provider_id}",
            "amount": float(amount),
            "currency": currency,
            "key_id": "pk_test_mock_key",
            "status": "requires_payment_method",
            "notes": {**(notes or {}), "idempotency_key": idempotency_key or ""},
        }

    async def verify_signature(self, payload: bytes, signature: str, webhook_secret: str) -> bool:
        return True

    async def create_refund(
        self,
        provider_payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "refund_id": f"rfnd_mock_{uuid.uuid4().hex[:10]}",
            "provider_payment_id": provider_payment_id,
            "amount": float(amount or 0),
            "status": "succeeded",
            "reason": reason,
        }

    async def retrieve_payment(self, provider_payment_id: str) -> Dict[str, Any]:
        return {
            "provider_payment_id": provider_payment_id,
            "status": "succeeded",
            "amount": 0,
            "currency": "USD",
        }

    async def create_payment_session(self, amount: Decimal, currency: str, metadata=None) -> Dict[str, Any]:
        return await self.create_order(amount, currency, notes=metadata)


def get_payment_provider(provider_name: Optional[str] = None) -> PaymentProvider:
    """
    Factory resolving the PaymentProvider instance.
    If provider_name is provided, resolves that specific provider (e.g. for webhooks).
    Otherwise uses settings.PAYMENT_PROVIDER.
    """
    from app.core.config import settings

    target = (provider_name or settings.PAYMENT_PROVIDER).lower()

    if target == "razorpay":
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise ValueError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured for Razorpay")
        return RazorpayProvider(key_id=settings.RAZORPAY_KEY_ID, key_secret=settings.RAZORPAY_KEY_SECRET)

    if target == "stripe":
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY must be configured for Stripe")
        return StripeProvider(
            secret_key=settings.STRIPE_SECRET_KEY,
            publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
        )

    if target == "mock":
        if settings.is_production:
            raise ValueError("FATAL: MockPaymentProvider is strictly forbidden in production environment!")
        return MockPaymentProvider()

    raise ValueError(f"Unknown payment provider: '{target}'")


# Backward-compatible aliases
RazorpayPaymentProvider = RazorpayProvider
StripePaymentProvider = StripeProvider
