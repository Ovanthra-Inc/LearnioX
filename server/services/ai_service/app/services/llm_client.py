"""
OpenRouter LLM client — unified interface for GPT-4o, Claude, Gemini, Llama.
"""
import httpx
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an expert AI assistant for LearnioX, an online learning platform. "
    "You help institutions, instructors, and learners create high-quality educational content. "
    "Always respond in JSON format unless instructed otherwise."
)


async def call_llm(
    prompt: str,
    model: str | None = None,
    system_prompt: str = SYSTEM_PROMPT,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    """Call OpenRouter API and return the assistant message text."""
    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    chosen_model = model or settings.DEFAULT_LLM_MODEL

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            f"{settings.OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://learniox.com",
                "X-Title": "LearnioX AI Service",
                "Content-Type": "application/json",
            },
            json={
                "model": chosen_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
