from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.refresh_token import RefreshToken


class TokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_refresh_token(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
        device_name: Optional[str] = None,
        device_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> RefreshToken:
        token_record = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_name=device_name,
            device_ip=device_ip,
            user_agent=user_agent,
        )
        self.db.add(token_record)
        await self.db.flush()
        await self.db.refresh(token_record)
        return token_record

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalars().first()

    async def revoke_token(self, token_id: UUID) -> None:
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def revoke_all_user_tokens(self, user_id: UUID) -> None:
        await self.db.execute(
            update(RefreshToken)
            .where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked_at.is_(None),
                )
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )

    async def get_active_sessions_for_user(self, user_id: UUID) -> List[RefreshToken]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked_at.is_(None),
                    RefreshToken.expires_at > now,
                )
            ).order_by(RefreshToken.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete_session(self, session_id: UUID, user_id: UUID) -> bool:
        session = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.id == session_id,
                    RefreshToken.user_id == user_id,
                )
            )
        )
        record = session.scalars().first()
        if not record:
            return False

        record.revoked_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True
