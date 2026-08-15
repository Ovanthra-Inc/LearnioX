from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserAuthAudit


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email.strip().lower()))
        return result.scalars().first()

    async def get_by_verification_token(self, token: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.verification_token == token))
        return result.scalars().first()

    async def get_by_reset_token(self, token: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.reset_password_token == token))
        return result.scalars().first()

    async def create_oauth_user(
        self,
        email: str,
        name: str,
        picture: Optional[str] = None,
        provider: str = "google",
        provider_id: Optional[str] = None,
    ) -> User:
        user = User(
            email=email.strip().lower(),
            name=name,
            picture=picture,
            provider=provider,
            provider_id=provider_id,
            signup_method=f"{provider}_oauth",
            last_login_method=f"{provider}_oauth",
            is_active=True,
            is_verified=True,
            last_login=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def create(
        self,
        email: str,
        name: str,
        picture: Optional[str] = None,
        provider: str = "google",
        provider_id: Optional[str] = None,
    ) -> User:
        return await self.create_oauth_user(email, name, picture, provider, provider_id)

    async def create_email_user(
        self,
        email: str,
        name: str,
        hashed_password: str,
        verification_token: Optional[str] = None,
        verification_expires_at: Optional[datetime] = None,
    ) -> User:
        user = User(
            email=email.strip().lower(),
            name=name,
            hashed_password=hashed_password,
            provider="email",
            signup_method="email_password",
            last_login_method="email_password",
            is_active=True,
            is_verified=False,
            verification_token=verification_token,
            verification_token_expires_at=verification_expires_at,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def set_email_verified(self, user_id: UUID) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                is_verified=True,
                verification_token=None,
                verification_token_expires_at=None,
            )
        )

    async def set_verification_token(
        self, user_id: UUID, token: str, expires_at: datetime
    ) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                verification_token=token,
                verification_token_expires_at=expires_at,
            )
        )

    async def set_reset_password_token(
        self, user_id: UUID, token: str, expires_at: datetime
    ) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                reset_password_token=token,
                reset_password_token_expires_at=expires_at,
            )
        )

    async def update_password(self, user_id: UUID, hashed_password: str) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                hashed_password=hashed_password,
                reset_password_token=None,
                reset_password_token_expires_at=None,
            )
        )

    async def update_last_login(self, user_id: UUID, method: str = "email_password") -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                last_login=datetime.now(timezone.utc),
                last_login_method=method,
            )
        )

    async def log_auth_audit(
        self,
        user_id: UUID,
        event_type: str,
        method: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None,
    ) -> UserAuthAudit:
        audit = UserAuthAudit(
            user_id=user_id,
            event_type=event_type,
            method=method,
            ip_address=ip_address,
            user_agent=(user_agent or "")[:512] if user_agent else None,
            status=status,
            details=details or {},
        )
        self.db.add(audit)
        await self.db.flush()
        return audit

    async def update_user(self, user: User, update_data: dict) -> User:
        _PROTECTED_FIELDS = {
            "is_superuser", "is_active", "provider", "provider_id", "email", "id",
            "hashed_password", "verification_token", "reset_password_token"
        }
        for key, value in update_data.items():
            if key in _PROTECTED_FIELDS:
                continue
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user
