import asyncio
import json
import logging
from typing import Any, Dict, Optional
try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    genai = None
    _GENAI_AVAILABLE = False

from app.core.config import settings
from app.core.exceptions import AIProviderException
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.providers.gemini")


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini Foundation Model Provider.
    Implements structured JSON generation and prompt execution using Gemini 1.5 Flash/Pro.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model_name = model_name or settings.AI_MODEL_NAME
        self._configured = bool(self._api_key) and _GENAI_AVAILABLE

        if self._configured and genai:
            genai.configure(api_key=self._api_key)
            self._json_model = genai.GenerativeModel(
                model_name=self._model_name,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": settings.AI_TEMPERATURE,
                    "max_output_tokens": settings.AI_MAX_OUTPUT_TOKENS,
                },
            )
            self._text_model = genai.GenerativeModel(
                model_name=self._model_name,
                generation_config={
                    "temperature": settings.AI_TEMPERATURE,
                    "max_output_tokens": settings.AI_MAX_OUTPUT_TOKENS,
                },
            )
        else:
            self._json_model = None
            self._text_model = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def is_configured(self) -> bool:
        return self._configured

    async def generate_text(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        timeout_seconds: float = 30.0,
    ) -> str:
        if not self.is_configured or not self._text_model:
            raise AIProviderException(
                message="Gemini API Key is not configured",
                provider=self.provider_name,
            )

        call_config = {}
        if temperature is not None:
            call_config["temperature"] = temperature
        if max_tokens is not None:
            call_config["max_output_tokens"] = max_tokens

        last_error = None
        for attempt in range(1, 4):
            try:
                response = await asyncio.wait_for(
                    self._text_model.generate_content_async(
                        prompt,
                        generation_config=call_config if call_config else None,
                    ),
                    timeout=timeout_seconds,
                )
                return response.text.strip()
            except asyncio.TimeoutError:
                last_error = f"Gemini request timed out after {timeout_seconds}s (attempt {attempt}/3)"
                logger.warning(last_error)
            except Exception as exc:
                last_error = str(exc)
                logger.warning(f"Gemini text attempt {attempt}/3 failed: {exc}")
            
            if attempt < 3:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        logger.error(f"Gemini text generation failed after 3 attempts: {last_error}")
        raise AIProviderException(
            message=f"Gemini text generation failed: {last_error}",
            provider=self.provider_name,
        )

    async def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        timeout_seconds: float = 30.0,
    ) -> Dict[str, Any]:
        if not self.is_configured or not self._json_model:
            raise AIProviderException(
                message="Gemini API Key is not configured",
                provider=self.provider_name,
            )

        call_config = {"response_mime_type": "application/json"}
        if temperature is not None:
            call_config["temperature"] = temperature
        if max_tokens is not None:
            call_config["max_output_tokens"] = max_tokens

        last_error = None
        for attempt in range(1, 4):
            try:
                response = await asyncio.wait_for(
                    self._json_model.generate_content_async(
                        prompt,
                        generation_config=call_config,
                    ),
                    timeout=timeout_seconds,
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]

                return json.loads(raw_text.strip())
            except json.JSONDecodeError as jde:
                logger.error(f"Failed to parse Gemini JSON output: {jde}")
                raise AIProviderException(
                    message=f"Model did not return valid JSON: {jde}",
                    provider=self.provider_name,
                )
            except asyncio.TimeoutError:
                last_error = f"Gemini request timed out after {timeout_seconds}s (attempt {attempt}/3)"
                logger.warning(last_error)
            except Exception as exc:
                last_error = str(exc)
                logger.warning(f"Gemini JSON attempt {attempt}/3 failed: {exc}")

            if attempt < 3:
                await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        logger.error(f"Gemini JSON generation failed after 3 attempts: {last_error}")
        raise AIProviderException(
            message=f"Gemini JSON generation failed: {last_error}",
            provider=self.provider_name,
        )
