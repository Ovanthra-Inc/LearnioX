import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("learniox.ai.services.tavily_search")


class TavilySearchService:
    """
    Tavily AI Search Service.
    Powers real-time educational research, contextual RAG, and AI agent web grounding.
    """

    API_URL = "https://api.tavily.com/search"

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = settings.TAVILY_API_KEY if api_key is None else api_key
        self._configured = bool(self._api_key)

    @property
    def is_configured(self) -> bool:
        return self._configured

    async def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_raw_content: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Executes a web search query via Tavily API.
        Returns a list of structured search result items: title, url, content, score.
        """
        if not self._configured:
            logger.debug("Tavily API key is unconfigured. Returning empty search results.")
            return []

        payload = {
            "api_key": self._api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_raw_content": include_raw_content,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(self.API_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("results", [])
                else:
                    logger.warning(
                        f"Tavily search API returned status {response.status_code}: {response.text}"
                    )
                    return []
        except Exception as exc:
            logger.error(f"Error during Tavily search execution: {exc}", exc_info=True)
            return []


# Global singleton instance
tavily_search_service = TavilySearchService()
