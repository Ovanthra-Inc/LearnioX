import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Enum, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class AssetType(str, enum.Enum):
    VIDEO = "video"
    IMAGE = "image"
    DOCUMENT = "document"
    AUDIO = "audio"
    SUBTITLE = "subtitle"
    ATTACHMENT = "attachment"


class MediaStatus(str, enum.Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"


class MediaAsset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "media_assets"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)

    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    status: Mapped[MediaStatus] = mapped_column(Enum(MediaStatus), default=MediaStatus.UPLOADING)

    original_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Cloudflare Stream fields (video)
    cf_stream_uid: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    cf_stream_url: Mapped[str | None] = mapped_column(Text, nullable=True)       # HLS playback URL
    cf_thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # R2 fields (non-video assets)
    r2_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    public_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
