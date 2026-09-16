from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseLLMProvider(ABC):
    """
    Abstract contract for Language Model generation engines.
    Decouples business feature modules from vendor-specific LLM SDKs.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the provider name (e.g. 'gemini', 'openai', 'mock')."""
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Indicates whether the provider has valid credentials to call the upstream API."""
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generate raw text response from the model."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON response parsed into a Python dictionary."""
        pass


class BaseTranscriptionProvider(ABC):
    """
    Abstract contract for Speech-to-Text audio/video transcription engines.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Returns the provider name (e.g. 'whisper', 'gemini-audio', 'mock')."""
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Indicates whether the provider has valid credentials."""
        pass

    @abstractmethod
    async def transcribe_audio(
        self,
        file_path: str,
        language: Optional[str] = "en",
    ) -> Dict[str, Any]:
        """
        Transcribe an audio file into timestamped segments and full text.
        Must return a dict with format:
        {
            "text": "full transcript...",
            "language": "en",
            "duration": 120.5,
            "segments": [
                {"id": 0, "start": 0.0, "end": 4.5, "text": "Sentence..."},
                ...
            ]
        }
        """
        pass
