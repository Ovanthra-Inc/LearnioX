import uuid
from sqlalchemy import String, Text, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import enum

from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class UserType(str, enum.Enum):
    LEARNER = "learner"
    CREATOR = "creator"
    PLATFORM_ADMIN = "platform_admin"


class UserProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_profiles"

    auth_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True, nullable=False)

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    username: Mapped[str | None] = mapped_column(String(80), unique=True, index=True, nullable=True)

    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    user_type: Mapped[UserType] = mapped_column(Enum(UserType), default=UserType.LEARNER)

    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str | None] = mapped_column(String(80), nullable=True)

    interests: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)
