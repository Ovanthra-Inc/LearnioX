import uuid
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, Optional


class PaymentProvider(ABC):
    @abstractmethod
    async def create_payment_session(
        self, amount: Decimal, currency: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        pass


class MockPaymentProvider(PaymentProvider):
    async def create_payment_session(
        self, amount: Decimal, currency: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        provider_id = f"pay_mock_{uuid.uuid4().hex[:12]}"
        return {
            "provider": "MOCK",
            "provider_payment_id": provider_id,
            "status": "SUCCESS",
            "amount": float(amount),
            "currency": currency,
            "metadata": metadata or {},
        }
