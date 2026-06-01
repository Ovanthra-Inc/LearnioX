import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.followed_institution import FollowedInstitution


class FollowedInstitutionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_and_institution(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> FollowedInstitution | None:
        result = await self.db.execute(
            select(FollowedInstitution).where(
                FollowedInstitution.user_id == user_id,
                FollowedInstitution.institution_id == institution_id
            )
        )
        return result.scalar_one_or_none()

    async def get_all_for_user(self, user_id: uuid.UUID) -> list[FollowedInstitution]:
        result = await self.db.execute(select(FollowedInstitution).where(FollowedInstitution.user_id == user_id))
        return list(result.scalars().all())

    async def follow(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> FollowedInstitution:
        followed = FollowedInstitution(user_id=user_id, institution_id=institution_id)
        self.db.add(followed)
        await self.db.commit()
        await self.db.refresh(followed)
        return followed

    async def unfollow(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            delete(FollowedInstitution).where(
                FollowedInstitution.user_id == user_id,
                FollowedInstitution.institution_id == institution_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0
