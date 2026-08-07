import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Table,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base


class CourseLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class CourseVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNLISTED = "UNLISTED"


class CourseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class CourseAccessType(str, enum.Enum):
    FREE = "FREE"
    PAID = "PAID"
    MEMBERSHIP = "MEMBERSHIP"
    INVITE_ONLY = "INVITE_ONLY"


# Association table for Course <-> Tag
course_tag_map = Table(
    "course_tag_map",
    Base.metadata,
    Column(
        "course_id",
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("course_tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class CourseCategory(Base):
    __tablename__ = "course_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    parent_id = Column(
        UUID(as_uuid=True),
        ForeignKey("course_categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    parent = relationship("CourseCategory", remote_side=[id])


class CourseTag(Base):
    __tablename__ = "course_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, index=True, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    subtitle = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)

    thumbnail_file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
    )
    intro_video_file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="SET NULL"),
        nullable=True,
    )

    language = Column(String(30), default="en", nullable=False)
    level = Column(
        Enum(CourseLevel, native_enum=False), default=CourseLevel.BEGINNER, nullable=False
    )
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("course_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    visibility = Column(
        Enum(CourseVisibility, native_enum=False), default=CourseVisibility.PUBLIC, nullable=False
    )
    status = Column(
        Enum(CourseStatus, native_enum=False), default=CourseStatus.DRAFT, nullable=False
    )
    access_type = Column(
        Enum(CourseAccessType, native_enum=False), default=CourseAccessType.FREE, nullable=False
    )

    price = Column(Numeric(10, 2), default=0.00, nullable=False)
    discount_price = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="INR", nullable=False)

    estimated_duration = Column(Numeric(10, 2), default=0, nullable=False)
    certificate_enabled = Column(Boolean, default=True, nullable=False)
    allow_reviews = Column(Boolean, default=True, nullable=False)
    allow_download = Column(Boolean, default=False, nullable=False)

    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    institution = relationship("Institution")
    creator = relationship("User")
    category = relationship("CourseCategory")
    thumbnail_file = relationship("FileRecord", foreign_keys=[thumbnail_file_id])
    intro_video_file = relationship("FileRecord", foreign_keys=[intro_video_file_id])
    tags = relationship("CourseTag", secondary=course_tag_map, lazy="selectin")
