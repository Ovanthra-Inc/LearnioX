import logging
from pathlib import Path
from typing import Any, Dict, Optional
try:
    from openai import AsyncOpenAI
    _OPENAI_AVAILABLE = True
except ImportError:
    AsyncOpenAI = None
    _OPENAI_AVAILABLE = False

from app.core.config import settings
from app.core.exceptions import AIProviderException
from app.providers.base import BaseTranscriptionProvider

logger = logging.getLogger("learniox.ai.providers.whisper")


class WhisperTranscriptionProvider(BaseTranscriptionProvider):
    """
    OpenAI Whisper API Speech-to-Text provider.
    Transcribes audio files and formats timestamped segments.
    """

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or settings.OPENAI_API_KEY
        self._configured = bool(self._api_key) and _OPENAI_AVAILABLE
        self._client: Optional[Any] = None
        if self._configured and AsyncOpenAI:
            self._client = AsyncOpenAI(api_key=self._api_key)

    @property
    def provider_name(self) -> str:
        return "whisper"

    @property
    def is_configured(self) -> bool:
        return self._configured

    async def transcribe_audio(
        self,
        file_path: str,
        language: Optional[str] = "en",
    ) -> Dict[str, Any]:
        if not self.is_configured or not self._client:
            raise AIProviderException(
                message="OpenAI API Key is not configured for Whisper transcription",
                provider=self.provider_name,
            )

        path = Path(file_path)
        if not path.exists():
            raise AIProviderException(
                message=f"Audio file not found at: {file_path}",
                provider=self.provider_name,
            )

        try:
            with open(path, "rb") as audio_file:
                transcript_obj = await self._client.audio.transcriptions.create(
                    model=settings.WHISPER_MODEL,
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                    language=language if language != "auto" else None,
                )

            segments = []
            for i, seg in enumerate(getattr(transcript_obj, "segments", [])):
                segments.append(
                    {
                        "id": i,
                        "start": float(getattr(seg, "start", 0.0)),
                        "end": float(getattr(seg, "end", 0.0)),
                        "text": str(getattr(seg, "text", "")).strip(),
                    }
                )

            return {
                "text": getattr(transcript_obj, "text", "").strip(),
                "language": getattr(transcript_obj, "language", language),
                "duration": float(getattr(transcript_obj, "duration", 0.0)),
                "segments": segments,
            }
        except Exception as exc:
            logger.error(f"Whisper transcription failed: {exc}", exc_info=True)
            raise AIProviderException(
                message=str(exc),
                provider=self.provider_name,
            )
