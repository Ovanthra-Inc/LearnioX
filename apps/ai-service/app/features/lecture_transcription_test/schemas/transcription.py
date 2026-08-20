import enum
from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptionJobStatus(str, enum.Enum):
    QUEUED = "queued"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptSegment(BaseModel):
    start: float = Field(..., description="Start timestamp in seconds (e.g. 0.0, 5.2)")
    end: float = Field(..., description="End timestamp in seconds (e.g. 5.2, 12.8)")
    text: str = Field(..., description="Transcribed spoken sentence or segment text")
    speaker: Optional[str] = Field(None, description="Optional speaker identifier")


class TranscriptionUploadResponse(BaseModel):
    job_id: str
    filename: str
    status: TranscriptionJobStatus
    message: str
    file_size_bytes: int


class TranscriptionStatusResponse(BaseModel):
    job_id: str
    status: TranscriptionJobStatus
    progress: int = Field(default=0, ge=0, le=100, description="Estimated progress percentage")
    stage: str = Field(default="queued", description="Human-readable stage description")
    error: Optional[str] = None


class TranscriptionResultResponse(BaseModel):
    job_id: str
    status: TranscriptionJobStatus
    filename: str
    duration: float = Field(default=0.0, description="Total media duration in seconds")
    language: str = Field(default="en", description="Detected or configured spoken language")
    segments: List[TranscriptSegment] = Field(default_factory=list, description="Timestamped transcript segments")
    full_text: str = Field(default="", description="Aggregated full transcript text")
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
