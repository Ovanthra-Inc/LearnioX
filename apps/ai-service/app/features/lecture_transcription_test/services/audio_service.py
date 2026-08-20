import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Tuple
from app.core.config import settings

logger = logging.getLogger("learniox.audio_service")

ALLOWED_EXTENSIONS = {".mp4", ".mp3", ".wav", ".m4a", ".webm", ".mov", ".mkv", ".aac"}
AUDIO_ONLY_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac"}


class AudioProcessingService:
    """
    Isolated audio service for validating media files and extracting audio tracks using FFmpeg.
    """

    def __init__(self):
        self.upload_dir = Path(settings.TRANSCRIPTION_STORAGE_DIR) / "test_uploads"
        self.results_dir = Path(settings.TRANSCRIPTION_STORAGE_DIR) / "test_results"
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, content_length: int) -> Tuple[bool, str]:
        """
        Validates extension and file size against configurable limit.
        """
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"

        max_bytes = settings.MAX_TRANSCRIPTION_FILE_SIZE_MB * 1024 * 1024
        if content_length > max_bytes:
            return False, f"File exceeds maximum allowed size of {settings.MAX_TRANSCRIPTION_FILE_SIZE_MB}MB."

        return True, "Valid"

    def probe_media_duration(self, file_path: str) -> float:
        """
        Probes the media duration in seconds using ffprobe or ffmpeg stdout.
        """
        if not os.path.exists(file_path):
            return 0.0

        # Try ffprobe if available
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path,
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if result.returncode == 0 and result.stdout.strip():
                return float(result.stdout.strip())
        except Exception as e:
            logger.debug(f"ffprobe duration probe notice: {e}")

        # Fallback estimation using file size heuristics (approx 128kbps = 16KB/s)
        try:
            size_bytes = os.path.getsize(file_path)
            return max(5.0, round(size_bytes / (32 * 1024), 2))
        except Exception:
            return 30.0

    def extract_audio_if_needed(self, media_path: str, job_id: str) -> str:
        """
        If the file is video or container format, extracts mono 16kHz audio via FFmpeg.
        Returns the path to the ready-to-transcribe audio file.
        """
        path = Path(media_path)
        ext = path.suffix.lower()

        # If already audio format and ffmpeg is not mandatory, check if conversion needed
        output_audio_path = self.upload_dir / f"{job_id}_extracted.mp3"

        # Check if FFmpeg binary exists
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            logger.warning("FFmpeg binary not found on PATH. Using original media file directly.")
            return str(media_path)

        try:
            logger.info(f"[TRANSCRIPTION] job={job_id} audio extraction started: {media_path} -> {output_audio_path}")
            cmd = [
                "ffmpeg",
                "-y",  # Overwrite
                "-i", str(media_path),
                "-vn",  # No video
                "-acodec", "libmp3lame",
                "-ar", "16000",  # 16kHz optimal for Whisper
                "-ac", "1",  # Mono
                "-b:a", "64k",
                str(output_audio_path),
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
            if res.returncode == 0 and output_audio_path.exists():
                logger.info(f"[TRANSCRIPTION] job={job_id} audio extraction completed successfully.")
                return str(output_audio_path)
            else:
                logger.warning(f"[TRANSCRIPTION] job={job_id} FFmpeg extraction warning: {res.stderr.decode('utf-8', errors='ignore')}. Using source file.")
                return str(media_path)
        except Exception as exc:
            logger.error(f"[TRANSCRIPTION] job={job_id} FFmpeg failed with error: {exc}. Using source file.")
            return str(media_path)


audio_service = AudioProcessingService()
