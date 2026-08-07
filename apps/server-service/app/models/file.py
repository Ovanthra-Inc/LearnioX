import uuid
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin


class FileRecord(Base, TimestampMixin):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), unique=True, index=True, nullable=False)
    extension = Column(String(50), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(BigInteger, nullable=False)
    storage_type = Column(String(50), default="local", nullable=False)
    path = Column(Text, nullable=False)
    folder = Column(Text, default="files", nullable=False)
    checksum = Column(String(255), nullable=True)
    uploaded_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    is_public = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    uploader = relationship("User", foreign_keys=[uploaded_by])
