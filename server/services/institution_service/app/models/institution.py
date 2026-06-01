import enum
from sqlalchemy import String, Text, Enum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class InstitutionStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class InstitutionType(str, enum.Enum):
    SOLO_CREATOR = "solo_creator"
    COACHING_INSTITUTE = "coaching_institute"
    SCHOOL = "school"
    COMPANY = "company"


class Institution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "institutions"

    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)

    institution_type: Mapped[InstitutionType] = mapped_column(Enum(InstitutionType), default=InstitutionType.SOLO_CREATOR)
    status: Mapped[InstitutionStatus] = mapped_column(Enum(InstitutionStatus), default=InstitutionStatus.DRAFT)

    owner_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    branding: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
