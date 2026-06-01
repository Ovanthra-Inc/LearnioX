import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import UserSession


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def create(self, user_id: uuid.UUID, token: str, expires_at: datetime, user_agent: str | None = None, ip_address: str | None = None) -> UserSession:
        session = UserSession(
            user_id=user_id,
            refresh_token_hash=self._hash_token(token),
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
            is_active=True
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_active_by_token(self, token: str) -> UserSession | None:
        token_hash = self._hash_token(token)
        result = await self.db.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == token_hash,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc)
            )
        )
        return result.scalar_one_or_none()

    async def revoke_session(self, session_id: uuid.UUID) -> None:
        await self.db.execute(
            update(UserSession)
            .where(UserSession.id == session_id)
            .values(is_active=False, revoked_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_active == True)
            .values(is_active=False, revoked_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    # Alias used by auth_service after password reset
    async def revoke_all_sessions(self, user_id: uuid.UUID) -> None:
        await self.revoke_all_for_user(user_id)

    async def list_active_sessions(self, user_id: uuid.UUID) -> list[UserSession]:
        result = await self.db.execute(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc)
            ).order_by(UserSession.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, session_id: uuid.UUID) -> UserSession | None:
        result = await self.db.execute(
            select(UserSession).where(UserSession.id == session_id)
        )
        return result.scalar_one_or_none()

