import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def auth_headers():
    return {
        "x-user-id": "test-ai-user-123",
        "x-user-email": "ai-tester@learniox.com",
    }


@pytest.fixture(autouse=True)
def default_mock_ai_env(monkeypatch):
    """Enforces mock AI provider by default during unit tests to prevent quota consumption and network latency."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "AI_PROVIDER", "mock")


@pytest_asyncio.fixture
async def async_client(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", headers=auth_headers) as client:
        yield client

