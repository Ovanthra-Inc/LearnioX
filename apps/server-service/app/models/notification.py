import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class NotificationType(str, enum.Enum):
    COURSE_UPDATE = "COURSE_UPDATE"
    ENROLLMENT = "ENROLLMENT"
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS"
    ASSIGNMENT_GRADED = "ASSIGNMENT_GRADED"
    CERTIFICATE_ISSUED = "CERTIFICATE_ISSUED"
    SYSTEM = "SYSTEM"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(
        Enum(NotificationType, native_enum=False),
        default=NotificationType.SYSTEM,
        nullable=False,
    )
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = relationship("User")
