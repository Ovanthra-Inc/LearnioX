import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.tavily_search import TavilySearchService


@pytest.mark.asyncio
async def test_tavily_search_unconfigured():
    """Verifies that unconfigured TavilySearchService returns empty list gracefully."""
    service = TavilySearchService(api_key="")
    assert service.is_configured is False
    results = await service.search("Quantum Computing")
    assert results == []


@pytest.mark.asyncio
async def test_tavily_search_mocked_results():
    """Verifies TavilySearchService parses structured web search results correctly."""
    service = TavilySearchService(api_key="tvly-test-key-123")
    assert service.is_configured is True

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {
                "title": "Introduction to Algorithms",
                "url": "https://example.com/algo",
                "content": "Graph theory and tree structures",
                "score": 0.98,
            }
        ]
    }

    mock_client = AsyncMock()
    mock_client.post.return_value = mock_response

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        results = await service.search("Algorithms")
        assert len(results) == 1
        assert results[0]["title"] == "Introduction to Algorithms"
        assert results[0]["score"] == 0.98
