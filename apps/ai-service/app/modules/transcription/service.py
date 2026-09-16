import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from app.core.config import settings
from app.modules.transcription.schemas import (
    TranscriptSegment,
    TranscriptionJobStatus,
    TranscriptionResultResponse,
    TranscriptionStatusResponse,
)
from app.modules.transcription.audio_utils import audio_utils
from app.providers import get_transcription_provider
from app.providers.base import BaseTranscriptionProvider

logger = logging.getLogger("learniox.ai.modules.transcription.service")

# In-memory registry for job status tracking
_ACTIVE_JOBS: Dict[str, TranscriptionStatusResponse] = {}


class TranscriptionModuleService:
    """
    Isolated speech-to-text transcription service supporting OpenAI Whisper,
    Google Gemini multimodal audio, and offline deterministic segment generation.
    """

    def __init__(self, provider: Optional[BaseTranscriptionProvider] = None):
        self._provider = provider or get_transcription_provider()
        self.results_dir = audio_utils.results_dir
        self.upload_dir = audio_utils.upload_dir

    def register_job(self, job_id: str):
        """Initializes a new job entry in the registry."""
        _ACTIVE_JOBS[job_id] = TranscriptionStatusResponse(
            job_id=job_id,
            status=TranscriptionJobStatus.QUEUED,
            progress=5,
            stage="Job queued for processing",
        )

    def get_job_status(self, job_id: str) -> Optional[TranscriptionStatusResponse]:
        """Returns the current processing status and progress."""
        if job_id in _ACTIVE_JOBS:
            return _ACTIVE_JOBS[job_id]

        # Check if result JSON file exists on disk
        for directory in [self.results_dir, audio_utils.legacy_results_dir]:
            result_file = directory / f"{job_id}.json"
            if result_file.exists():
                return TranscriptionStatusResponse(
                    job_id=job_id,
                    status=TranscriptionJobStatus.COMPLETED,
                    progress=100,
                    stage="Completed",
                )
        return None

    def get_job_result(self, job_id: str) -> Optional[TranscriptionResultResponse]:
        """Retrieves completed transcript output."""
        for directory in [self.results_dir, audio_utils.legacy_results_dir]:
            result_file = directory / f"{job_id}.json"
            if result_file.exists():
                try:
                    with open(result_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        return TranscriptionResultResponse.model_validate(data)
                except Exception as e:
                    logger.error(f"Failed to read result file for job {job_id}: {e}")
        return None

    async def process_transcription_async(
        self, job_id: str, media_path: str, original_filename: str
    ):
        """
        Background task executing audio extraction and speech-to-text.
        """
        try:
            logger.info(f"[TRANSCRIPTION] job={job_id} started processing for '{original_filename}'")
            _ACTIVE_JOBS[job_id] = TranscriptionStatusResponse(
                job_id=job_id,
                status=TranscriptionJobStatus.EXTRACTING_AUDIO,
                progress=20,
                stage="Extracting audio track from media",
            )

            # Step 1: Probe duration and extract audio via FFmpeg
            duration = audio_utils.probe_media_duration(media_path)
            audio_path = audio_utils.extract_audio_if_needed(media_path, job_id)

            _ACTIVE_JOBS[job_id] = TranscriptionStatusResponse(
                job_id=job_id,
                status=TranscriptionJobStatus.TRANSCRIBING,
                progress=45,
                stage=f"Transcribing audio with {self._provider.provider_name}",
            )
            logger.info(f"[TRANSCRIPTION] job={job_id} audio ready, running Speech-to-Text via {self._provider.provider_name}...")

            # Step 2: Run Transcription Engine via Provider
            transcription_output = await self._provider.transcribe_audio(audio_path)

            segments = []
            for seg in transcription_output.get("segments", []):
                segments.append(
                    TranscriptSegment(
                        id=seg.get("id"),
                        start=float(seg.get("start", 0.0)),
                        end=float(seg.get("end", 0.0)),
                        text=str(seg.get("text", "")).strip(),
                    )
                )

            full_text = transcription_output.get("text", " ".join(s.text for s in segments))
            detected_lang = transcription_output.get("language", "en")
            if duration <= 0.0:
                duration = float(transcription_output.get("duration", 60.0))

            logger.info(f"[TRANSCRIPTION] job={job_id} generated {len(segments)} timestamped segments.")

            # Step 3: Package and persist completed transcript
            now_iso = datetime.now(timezone.utc).isoformat()
            result = TranscriptionResultResponse(
                job_id=job_id,
                status=TranscriptionJobStatus.COMPLETED,
                filename=original_filename,
                duration=duration,
                language=detected_lang,
                segments=segments,
                full_text=full_text,
                created_at=now_iso,
                completed_at=now_iso,
            )

            result_file = self.results_dir / f"{job_id}.json"
            with open(result_file, "w", encoding="utf-8") as f:
                json.dump(result.model_dump(), f, indent=2)

            _ACTIVE_JOBS[job_id] = TranscriptionStatusResponse(
                job_id=job_id,
                status=TranscriptionJobStatus.COMPLETED,
                progress=100,
                stage="Transcription completed successfully",
            )
            logger.info(f"[TRANSCRIPTION] job={job_id} completed successfully.")

        except Exception as exc:
            logger.error(f"[TRANSCRIPTION] job={job_id} failed: {exc}", exc_info=True)
            _ACTIVE_JOBS[job_id] = TranscriptionStatusResponse(
                job_id=job_id,
                status=TranscriptionJobStatus.FAILED,
                progress=0,
                stage="Transcription failed",
                error=str(exc),
            )


# Default singleton
transcription_module_service = TranscriptionModuleService()
