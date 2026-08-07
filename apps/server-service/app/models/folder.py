import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin


class FolderRecord(Base, TimestampMixin):
    __tablename__ = "file_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    parent_id = Column(
        UUID(as_uuid=True), ForeignKey("file_folders.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_by = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    creator = relationship("User")
    parent = relationship("FolderRecord", remote_side=[id])
