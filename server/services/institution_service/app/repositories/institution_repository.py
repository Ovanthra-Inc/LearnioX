import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution


class InstitutionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, institution_id: uuid.UUID) -> Institution | None:
        result = await self.db.execute(select(Institution).where(Institution.id == institution_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Institution | None:
        result = await self.db.execute(select(Institution).where(Institution.slug == slug))
        return result.scalar_one_or_none()

    async def list_all(self, page: int, limit: int, owner_user_id: uuid.UUID | None = None) -> tuple[list[Institution], int]:
        query = select(Institution)
        count_query = select(func.count(Institution.id))
        if owner_user_id:
            query = query.where(Institution.owner_user_id == str(owner_user_id))
            count_query = count_query.where(Institution.owner_user_id == str(owner_user_id))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        result = await self.db.execute(
            query.order_by(Institution.created_at.desc()).offset((page - 1) * limit).limit(limit)
        )
        return list(result.scalars().all()), total

    async def create(self, institution: Institution) -> Institution:
        self.db.add(institution)
        await self.db.commit()
        await self.db.refresh(institution)
        return institution

    async def update(self, institution: Institution) -> Institution:
        await self.db.commit()
        await self.db.refresh(institution)
        return institution

    async def delete(self, institution: Institution) -> None:
        await self.db.delete(institution)
        await self.db.commit()

