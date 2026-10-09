import asyncio
import json
import logging
from typing import Any, Dict, Optional

try:
    from openai import AsyncAzureOpenAI, AsyncOpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    AsyncAzureOpenAI = None
    AsyncOpenAI = None
    _OPENAI_AVAILABLE = False

from app.core.config import settings
from app.core.exceptions import AIProviderException
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.providers.azure_foundry")


class AzureAIFoundryProvider(BaseLLMProvider):
    """
    Azure AI Foundry / Azure OpenAI Service Provider.
    Implements enterprise-grade LLM generation and structured evaluation
    using Azure-hosted models (GPT-5-mini, GPT-4o, GPT-4o-mini, Mistral, Llama, etc.).
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment_name: Optional[str] = None,
        api_version: Optional[str] = None,
    ):
        raw_endpoint = settings.effective_azure_endpoint if endpoint is None else endpoint
        self._api_key = settings.effective_azure_api_key if api_key is None else api_key
        self._deployment_name = settings.effective_azure_deployment if deployment_name is None else deployment_name
        self._api_version = settings.AZURE_AI_API_VERSION if api_version is None else api_version

        self._endpoint = self._normalize_endpoint(raw_endpoint)
        self._configured = bool(self._endpoint and self._api_key and _OPENAI_AVAILABLE)

        if self._configured and _OPENAI_AVAILABLE:
            if "services.ai.azure.com" in self._endpoint and AsyncOpenAI:
                # Direct Azure AI Foundry Services endpoint
                self._client = AsyncOpenAI(
                    base_url=self._endpoint,
                    api_key=self._api_key,
                )
            elif AsyncAzureOpenAI:
                # Standard Azure OpenAI resource endpoint
                clean_azure = self._endpoint
                if clean_azure.endswith("/openai/v1"):
                    clean_azure = clean_azure[:-len("/openai/v1")]
                self._client = AsyncAzureOpenAI(
                    azure_endpoint=clean_azure,
                    api_key=self._api_key,
                    api_version=self._api_version,
                )
            else:
                self._client = None
        else:
            self._client = None

    @staticmethod
    def _normalize_endpoint(endpoint: Optional[str]) -> Optional[str]:
        if not endpoint:
            return None
        return endpoint.strip().rstrip("/")

    @property
    def provider_name(self) -> str:
        return "azure"

    @property
    def is_configured(self) -> bool:
        return self._configured

    async def _execute_completion(
        self,
        messages: list,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[dict] = None,
    ) -> str:
        """Internal execution helper with resilient parameter negotiation for reasoning models."""
        if not self.is_configured or not self._client:
            raise AIProviderException(
                message="Azure AI Foundry is unconfigured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env.",
                provider="azure",
            )

        token_limit = max_tokens if max_tokens is not None else settings.AI_MAX_OUTPUT_TOKENS
        kwargs: Dict[str, Any] = {
            "model": self._deployment_name,
            "messages": messages,
            "max_completion_tokens": token_limit,
        }
        if response_format:
            kwargs["response_format"] = response_format

        temp = temperature if temperature is not None else settings.AI_TEMPERATURE
        if temp is not None and temp != 1.0:
            kwargs["temperature"] = temp

        try:
            response = await self._client.chat.completions.create(**kwargs)
            return response.choices[0].message.content or ""
        except Exception as exc:
            err_msg = str(exc)

            # If model is a reasoning model (like gpt-5-mini / o1 / o3) that rejects non-default temperature
            if "temperature" in err_msg and "temperature" in kwargs:
                logger.info("Retrying Azure completion without temperature parameter for reasoning model...")
                kwargs.pop("temperature", None)
                try:
                    response = await self._client.chat.completions.create(**kwargs)
                    return response.choices[0].message.content or ""
                except Exception as retry_exc:
                    err_msg = str(retry_exc)

            # If model is older and rejects max_completion_tokens, fallback to max_tokens
            if "max_completion_tokens" in err_msg and "max_completion_tokens" in kwargs:
                logger.info("Falling back from max_completion_tokens to max_tokens...")
                kwargs.pop("max_completion_tokens", None)
                kwargs["max_tokens"] = token_limit
                try:
                    response = await self._client.chat.completions.create(**kwargs)
                    return response.choices[0].message.content or ""
                except Exception as retry_exc:
                    err_msg = str(retry_exc)

            logger.error(f"Azure AI Foundry request failed: {err_msg}", exc_info=True)
            raise AIProviderException(
                message=f"Azure AI Foundry request failed: {err_msg}",
                provider="azure",
            )

    async def generate_text(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generates natural language text using Azure AI Foundry model."""
        messages = [
            {"role": "system", "content": "You are LearnioX AI, an elite educational intelligence assistant."},
            {"role": "user", "content": prompt},
        ]
        return await self._execute_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generates strict JSON schema output for assessments and rubrics."""
        messages = [
            {
                "role": "system",
                "content": "You are LearnioX AI. You MUST reply ONLY with valid JSON conforming to the requested schema. Do not include markdown code block wrappers (no ```json).",
            },
            {"role": "user", "content": prompt},
        ]
        raw_text = await self._execute_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as jde:
            logger.error(f"Azure AI Foundry returned invalid JSON: {jde}. Raw: {raw_text[:200]}")
            raise AIProviderException(
                message="Failed to parse structured JSON from Azure AI Foundry response.",
                provider="azure",
            )
