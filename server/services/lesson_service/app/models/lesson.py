import uuid
import enum
from sqlalchemy import String, Text, Integer, Boolean, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class LessonType(str, enum.Enum):
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    LIVE_CLASS = "live_class"
    EXTERNAL_LINK = "external_link"


class LessonAccessType(str, enum.Enum):
    FREE_PREVIEW = "free_preview"
    ENROLLED_ONLY = "enrolled_only"
    MEMBERSHIP_ONLY = "membership_only"
    PRIVATE = "private"


class Lesson(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "lessons"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    module_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    lesson_type: Mapped[LessonType] = mapped_column(Enum(LessonType), default=LessonType.VIDEO)
    access_type: Mapped[LessonAccessType] = mapped_column(Enum(LessonAccessType), default=LessonAccessType.ENROLLED_ONLY)

    order_index: Mapped[int] = mapped_column(Integer, default=0)

    video_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
