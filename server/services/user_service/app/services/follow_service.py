import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.followed_institution import FollowedInstitution
from app.repositories.followed_institution_repository import FollowedInstitutionRepository


class FollowService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = FollowedInstitutionRepository(db)

    async def follow_institution(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> FollowedInstitution:
        existing = await self.repo.get_by_user_and_institution(user_id, institution_id)
        if existing:
            return existing
        return await self.repo.follow(user_id, institution_id)

    async def unfollow_institution(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> bool:
        return await self.repo.unfollow(user_id, institution_id)

    async def get_followed_institutions(self, user_id: uuid.UUID) -> list[FollowedInstitution]:
        return await self.repo.get_all_for_user(user_id)
