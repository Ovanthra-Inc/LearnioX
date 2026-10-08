import pytest
from httpx import AsyncClient
from app.modules.transcription.audio_utils import audio_utils
from app.modules.transcription.service import transcription_module_service
from app.modules.transcription.schemas import TranscriptionJobStatus
from app.providers import get_transcription_provider
from app.providers.mock import MockTranscriptionProvider


@pytest.mark.asyncio
async def test_mock_transcription_provider(monkeypatch):
    """Ensures deterministic MockTranscriptionProvider produces valid timestamped segments."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
    provider = get_transcription_provider()
    assert isinstance(provider, MockTranscriptionProvider)
    assert provider.provider_name == "mock"
    assert provider.is_configured is True

    result = await provider.transcribe_audio("sample_lecture.mp4")
    assert "text" in result
    assert "segments" in result
    assert len(result["segments"]) > 0
    seg = result["segments"][0]
    assert "start" in seg
    assert "end" in seg
    assert "text" in seg
    assert seg["end"] > seg["start"]


def test_audio_utils_file_validation():
    """Tests file extension and size validation for lecture uploads."""
    # Valid formats
    valid_mp4, err = audio_utils.validate_file("lecture.mp4", 1024 * 1024)
    assert valid_mp4 is True
    assert err == "Valid"

    valid_wav, err = audio_utils.validate_file("audio.wav", 500 * 1024)
    assert valid_wav is True

    # Invalid extension
    invalid_ext, err = audio_utils.validate_file("script.py", 1024)
    assert invalid_ext is False
    assert "Unsupported file format" in err

    # Oversized file (> 500MB)
    too_large, err = audio_utils.validate_file("huge.mp4", 600 * 1024 * 1024)
    assert too_large is False
    assert "exceeds maximum allowed size" in err


@pytest.mark.asyncio
async def test_transcription_job_status_and_not_found(async_client: AsyncClient):
    """Tests polling status of a registered transcription job vs nonexistent job."""
    test_job_id = "test-job-uuid-12345"
    transcription_module_service.register_job(test_job_id)

    status = transcription_module_service.get_job_status(test_job_id)
    assert status is not None
    assert status.job_id == test_job_id
    assert status.status == TranscriptionJobStatus.QUEUED

    # Endpoint polling for existing job
    resp = await async_client.get(f"/api/v1/ai/transcription/status/{test_job_id}")
    assert resp.status_code == 200
    res_json = resp.json()
    assert res_json["success"] is True
    assert res_json["data"]["job_id"] == test_job_id

    # Nonexistent job
    resp_404 = await async_client.get("/api/v1/ai/transcription/status/nonexistent-job-999")
    assert resp_404.status_code in [200, 404]
