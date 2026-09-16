from app.core.config import settings
from app.providers.base import BaseLLMProvider, BaseTranscriptionProvider
from app.providers.gemini import GeminiLLMProvider
from app.providers.whisper import WhisperTranscriptionProvider
from app.providers.mock import MockLLMProvider, MockTranscriptionProvider

__all__ = [
    "BaseLLMProvider",
    "BaseTranscriptionProvider",
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
    Defaults to Gemini if GEMINI_API_KEY is configured, else falls back to MockLLMProvider.
    """
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
