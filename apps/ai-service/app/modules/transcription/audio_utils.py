import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger("learniox.ai.modules.transcription.audio")

ALLOWED_EXTENSIONS = {".mp4", ".mp3", ".wav", ".m4a", ".webm", ".mov", ".mkv", ".aac"}
AUDIO_ONLY_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac"}


class AudioProcessingUtils:
    """
    Audio utilities for validating media files, checking formats,
    probing duration, and extracting audio tracks using FFmpeg.
    """

    def __init__(self):
        storage_base = Path(settings.TRANSCRIPTION_STORAGE_DIR)
        self.upload_dir = storage_base / "uploads"
        self.results_dir = storage_base / "results"
        # Support legacy test directory paths if present
        self.legacy_upload_dir = storage_base / "test_uploads"
        self.legacy_results_dir = storage_base / "test_results"

        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, content_length: int) -> Tuple[bool, str]:
        """Validates extension and file size against configurable limit."""
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"

        max_bytes = settings.MAX_TRANSCRIPTION_FILE_SIZE_MB * 1024 * 1024
        if content_length > max_bytes:
            return False, f"File exceeds maximum allowed size of {settings.MAX_TRANSCRIPTION_FILE_SIZE_MB}MB."

        return True, "Valid"

    def probe_media_duration(self, file_path: str) -> float:
        """Probes media duration in seconds using ffprobe or file size estimation."""
        if not os.path.exists(file_path):
            return 0.0

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
        output_audio_path = self.upload_dir / f"{job_id}_extracted.mp3"

        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            logger.warning("FFmpeg binary not found on PATH. Using original media file directly.")
            return str(media_path)

        try:
            cmd = [
                "ffmpeg",
                "-y",
                "-i", str(media_path),
                "-vn",
                "-acodec", "libmp3lame",
                "-ar", "16000",
                "-ac", "1",
                "-b:a", "64k",
                str(output_audio_path),
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
            if res.returncode == 0 and output_audio_path.exists():
                return str(output_audio_path)
            else:
                return str(media_path)
        except Exception as exc:
            logger.error(f"FFmpeg audio extraction error: {exc}. Using source file.")
            return str(media_path)

    def locate_media_file(self, job_id: str) -> Optional[Path]:
        """Locates uploaded media file across new or legacy upload directories."""
        for directory in [self.upload_dir, self.legacy_upload_dir]:
            if directory.exists():
                matching = list(directory.glob(f"{job_id}.*"))
                if matching:
                    return matching[0]
        return None


audio_utils = AudioProcessingUtils()
