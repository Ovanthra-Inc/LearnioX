import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Column, DateTime, String, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.refresh_token import RefreshToken


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    picture = Column(Text, nullable=True)
    avatar_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    provider = Column(String(50), default="google", nullable=False)
    provider_id = Column(String(255), nullable=True)
    signup_method = Column(String(50), default="email_password", nullable=False)
    last_login_method = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True, index=True)
    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    language = Column(String(10), default="en", nullable=False)
    theme = Column(String(20), default="light", nullable=False)

    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    auth_audits = relationship(
        "UserAuthAudit", back_populates="user", cascade="all, delete-orphan"
    )


class UserAuthAudit(Base, TimestampMixin):
    __tablename__ = "user_auth_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # SIGNUP, LOGIN_SUCCESS, LOGIN_FAILED, EMAIL_VERIFIED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_SUCCESS, LOGOUT
    method = Column(String(50), nullable=False)  # email_password, google_oauth, refresh_token
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, FAILED
    details = Column(JSON, nullable=True)

    user = relationship("User", back_populates="auth_audits")
