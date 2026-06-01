"""
Shared HTTP client for the API Gateway.
Uses httpx with timeout and internal auth header injection.
"""
import httpx
from app.core.config import get_settings

settings = get_settings()


def _headers() -> dict:
    return {"x-internal-api-key": settings.INTERNAL_API_KEY}


async def proxy_get(url: str, headers: dict = None, params: dict = None) -> httpx.Response:
    merged = {**_headers(), **(headers or {})}
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
        return await client.get(url, headers=merged, params=params)


async def proxy_post(url: str, json: dict = None, headers: dict = None) -> httpx.Response:
    merged = {**_headers(), **(headers or {})}
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
        return await client.post(url, json=json, headers=merged)


async def proxy_patch(url: str, json: dict = None, headers: dict = None) -> httpx.Response:
    merged = {**_headers(), **(headers or {})}
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
        return await client.patch(url, json=json, headers=merged)


async def proxy_delete(url: str, headers: dict = None) -> httpx.Response:
    merged = {**_headers(), **(headers or {})}
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
        return await client.delete(url, headers=merged)
