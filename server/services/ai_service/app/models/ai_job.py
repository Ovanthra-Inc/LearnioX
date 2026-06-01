import uuid
import enum
from sqlalchemy import String, Text, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class AIJobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AIJobType(str, enum.Enum):
    COURSE_OUTLINE = "course_outline"
    LESSON_PLAN = "lesson_plan"
    VIDEO_SUMMARY = "video_summary"
    VIDEO_CHAPTERS = "video_chapters"
    QUIZ_GENERATION = "quiz_generation"
    DOUBT_DRAFT_ANSWER = "doubt_draft_answer"
    MARKETING_COPY = "marketing_copy"


class AIJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ai_jobs"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    requested_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    job_type: Mapped[AIJobType] = mapped_column(Enum(AIJobType), nullable=False)
    status: Mapped[AIJobStatus] = mapped_column(Enum(AIJobStatus), default=AIJobStatus.QUEUED)
    input_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    output_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
