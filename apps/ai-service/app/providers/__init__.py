from app.core.config import settings
from app.providers.base import BaseLLMProvider, BaseTranscriptionProvider
from app.providers.azure_foundry import AzureAIFoundryProvider
from app.providers.gemini import GeminiLLMProvider
from app.providers.whisper import WhisperTranscriptionProvider
from app.providers.mock import MockLLMProvider, MockTranscriptionProvider

__all__ = [
    "BaseLLMProvider",
    "BaseTranscriptionProvider",
    "AzureAIFoundryProvider",
    "GeminiLLMProvider",
    "WhisperTranscriptionProvider",
    "MockLLMProvider",
    "MockTranscriptionProvider",
    "get_llm_provider",
    "get_transcription_provider",
]


def get_llm_provider() -> BaseLLMProvider:
    """
    Factory function returning the active LLM provider.
    1. If AI_PROVIDER == 'mock' -> MockLLMProvider
    2. If AI_PROVIDER == 'azure' and credentials configured -> AzureAIFoundryProvider
    3. If AI_PROVIDER == 'gemini' and credentials configured -> GeminiLLMProvider
    4. Falls back cleanly to whichever is configured or deterministic MockLLMProvider.
    """
    provider_pref = settings.AI_PROVIDER.lower()
    if provider_pref == "mock":
        return MockLLMProvider()

    azure_configured = bool(settings.effective_azure_api_key and settings.effective_azure_endpoint)
    if provider_pref == "azure" and azure_configured:
        return AzureAIFoundryProvider()
    if provider_pref == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider()

    if azure_configured:
        return AzureAIFoundryProvider()
    if settings.GEMINI_API_KEY:
        return GeminiLLMProvider()

    return MockLLMProvider()


def get_transcription_provider() -> BaseTranscriptionProvider:
    """
    Factory function returning the active speech-to-text transcription provider.
    Defaults to Whisper if OPENAI_API_KEY is configured, else falls back to MockTranscriptionProvider.
    """
    if settings.OPENAI_API_KEY:
        return WhisperTranscriptionProvider()
    return MockTranscriptionProvider()
