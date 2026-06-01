import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile


class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, profile_id: uuid.UUID) -> UserProfile | None:
        result = await self.db.execute(select(UserProfile).where(UserProfile.id == profile_id))
        return result.scalar_one_or_none()

    async def get_by_auth_user_id(self, auth_user_id: uuid.UUID) -> UserProfile | None:
        result = await self.db.execute(select(UserProfile).where(UserProfile.auth_user_id == auth_user_id))
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> UserProfile | None:
        result = await self.db.execute(select(UserProfile).where(UserProfile.username == username))
        return result.scalar_one_or_none()

    async def create(self, profile: UserProfile) -> UserProfile:
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def update(self, profile: UserProfile) -> UserProfile:
        await self.db.commit()
        await self.db.refresh(profile)
        return profile
