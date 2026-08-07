import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base


class LessonType(str, enum.Enum):
    VIDEO = "VIDEO"
    PDF = "PDF"
    QUIZ = "QUIZ"
    ASSIGNMENT = "ASSIGNMENT"
    LIVE = "LIVE"
    LINK = "LINK"


class LessonVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    ENROLLED = "ENROLLED"
    MEMBERSHIP = "MEMBERSHIP"
    PRIVATE = "PRIVATE"


class LessonStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    SCHEDULED = "SCHEDULED"


class ContentType(str, enum.Enum):
    VIDEO = "VIDEO"
    PDF = "PDF"
    FILE = "FILE"
    LINK = "LINK"
    TEXT = "TEXT"


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(Integer, default=1, nullable=False, index=True)
    is_free = Column(Boolean, default=False, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    course = relationship("Course")
    creator = relationship("User")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.position", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("course_modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lesson_type = Column(
        Enum(LessonType, native_enum=False), default=LessonType.VIDEO, nullable=False
    )
    duration = Column(Integer, default=0, nullable=False)
    position = Column(Integer, default=1, nullable=False, index=True)
    visibility = Column(
        Enum(LessonVisibility, native_enum=False), default=LessonVisibility.ENROLLED, nullable=False
    )
    status = Column(
        Enum(LessonStatus, native_enum=False), default=LessonStatus.DRAFT, nullable=False
    )
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    is_preview = Column(Boolean, default=False, nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    module = relationship("CourseModule", back_populates="lessons")
    creator = relationship("User")
    content = relationship("LessonContent", uselist=False, back_populates="lesson", cascade="all, delete-orphan")
    resources = relationship("LessonResource", back_populates="lesson", cascade="all, delete-orphan")


class LessonContent(Base):
    __tablename__ = "lesson_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
    )
    external_url = Column(Text, nullable=True)
    text_content = Column(Text, nullable=True)
    content_type = Column(
        Enum(ContentType, native_enum=False), default=ContentType.VIDEO, nullable=False
    )
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    lesson = relationship("Lesson", back_populates="content")
    file_record = relationship("FileRecord")


class LessonResource(Base):
    __tablename__ = "lesson_resources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    lesson = relationship("Lesson", back_populates="resources")
    file_record = relationship("FileRecord")
