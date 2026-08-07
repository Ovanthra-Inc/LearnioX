import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    and_,
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin


class InstitutionVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNLISTED = "UNLISTED"


class InstitutionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    ARCHIVED = "ARCHIVED"


class Institution(Base, TimestampMixin):
    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    website = Column(String(255), nullable=True)

    logo_file_id = Column(
        UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True
    )
    banner_file_id = Column(
        UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True
    )
    favicon_file_id = Column(
        UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True
    )

    country = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)

    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    language = Column(String(50), default="en", nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    visibility = Column(
        Enum(InstitutionVisibility, native_enum=False), default=InstitutionVisibility.PUBLIC, nullable=False
    )
    status = Column(
        Enum(InstitutionStatus, native_enum=False), default=InstitutionStatus.DRAFT, nullable=False
    )
    is_verified = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", foreign_keys=[owner_id])
    logo_file = relationship("FileRecord", foreign_keys=[logo_file_id])
    banner_file = relationship("FileRecord", foreign_keys=[banner_file_id])
    favicon_file = relationship("FileRecord", foreign_keys=[favicon_file_id])

    settings = relationship(
        "InstitutionSettings", back_populates="institution", uselist=False, cascade="all, delete-orphan"
    )
    social_links = relationship(
        "InstitutionSocialLink", back_populates="institution", cascade="all, delete-orphan"
    )


class InstitutionSettings(Base, TimestampMixin):
    __tablename__ = "institution_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    allow_comments = Column(Boolean, default=True, nullable=False)
    allow_reviews = Column(Boolean, default=True, nullable=False)
    allow_public_courses = Column(Boolean, default=True, nullable=False)
    allow_memberships = Column(Boolean, default=True, nullable=False)
    allow_certificates = Column(Boolean, default=True, nullable=False)
    enable_ai = Column(Boolean, default=True, nullable=False)

    institution = relationship("Institution", back_populates="settings")


class InstitutionSocialLink(Base):
    __tablename__ = "institution_social_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(
        UUID(as_uuid=True),
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform = Column(String(50), nullable=False)
    url = Column(Text, nullable=False)

    institution = relationship("Institution", back_populates="social_links")
