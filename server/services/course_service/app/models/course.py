import uuid
import enum
from sqlalchemy import String, Text, Enum, Boolean, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseAccessType(str, enum.Enum):
    FREE = "free"
    PAID = "paid"
    MEMBERSHIP = "membership"
    PRIVATE = "private"


class CourseLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Course(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "courses"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(220), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    promo_video_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)

    language: Mapped[str | None] = mapped_column(String(40), nullable=True)
    level: Mapped[CourseLevel] = mapped_column(Enum(CourseLevel), default=CourseLevel.BEGINNER)

    status: Mapped[CourseStatus] = mapped_column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    access_type: Mapped[CourseAccessType] = mapped_column(Enum(CourseAccessType), default=CourseAccessType.FREE)

    price_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    learning_outcomes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    prerequisites: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    seo: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
