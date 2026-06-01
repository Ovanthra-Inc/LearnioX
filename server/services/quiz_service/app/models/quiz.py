import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Enum, Integer, Numeric, Boolean, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class QuizStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AttemptStatus(str, enum.Enum):
    STARTED = "started"
    SUBMITTED = "submitted"
    GRADED = "graded"


class Quiz(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quizzes"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[QuizStatus] = mapped_column(Enum(QuizStatus), default=QuizStatus.DRAFT)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passing_score: Mapped[float] = mapped_column(Numeric(5, 2), default=60.0)


class Question(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "questions"

    quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    question_type: Mapped[str] = mapped_column(String(40), nullable=False, default="mcq")
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    correct_answer_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    marks: Mapped[int] = mapped_column(Integer, default=1)


class QuizAttempt(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "quiz_attempts"

    quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    status: Mapped[AttemptStatus] = mapped_column(Enum(AttemptStatus), default=AttemptStatus.STARTED)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    answers_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
