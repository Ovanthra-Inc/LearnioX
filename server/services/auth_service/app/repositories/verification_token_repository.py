import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.verification_token import VerificationToken, VerificationPurpose


class VerificationTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def create(self, user_id: uuid.UUID, token: str, purpose: VerificationPurpose, expires_at: datetime) -> VerificationToken:
        token_obj = VerificationToken(
            user_id=user_id,
            token_hash=self._hash_token(token),
            purpose=purpose,
            expires_at=expires_at,
            is_used=False
        )
        self.db.add(token_obj)
        await self.db.commit()
        await self.db.refresh(token_obj)
        return token_obj

    async def get_active_by_token(self, token: str, purpose: VerificationPurpose) -> VerificationToken | None:
        token_hash = self._hash_token(token)
        result = await self.db.execute(
            select(VerificationToken).where(
                VerificationToken.token_hash == token_hash,
                VerificationToken.purpose == purpose,
                VerificationToken.is_used == False,
                VerificationToken.expires_at > datetime.now(timezone.utc)
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, token_id: uuid.UUID) -> None:
        await self.db.execute(
            update(VerificationToken)
            .where(VerificationToken.id == token_id)
            .values(is_used=True, used_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
