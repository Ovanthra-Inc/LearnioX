import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_identity import UserIdentity


class UserIdentityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> UserIdentity | None:
        result = await self.db.execute(select(UserIdentity).where(UserIdentity.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> UserIdentity | None:
        result = await self.db.execute(select(UserIdentity).where(UserIdentity.email == email))
        return result.scalar_one_or_none()

    async def create(self, user_identity: UserIdentity) -> UserIdentity:
        self.db.add(user_identity)
        await self.db.commit()
        await self.db.refresh(user_identity)
        return user_identity

    async def update_last_login(self, user_id: uuid.UUID) -> None:
        user = await self.get_by_id(user_id)
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            await self.db.commit()
