import uuid
from sqlalchemy import String, Text, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class LandingPage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "landing_pages"
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="draft")
    theme_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    seo_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class LandingPageSection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "landing_page_sections"
    landing_page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    section_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
