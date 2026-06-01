import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution_member import InstitutionMember, MemberStatus


class MemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, member_id: uuid.UUID) -> InstitutionMember | None:
        result = await self.db.execute(select(InstitutionMember).where(InstitutionMember.id == member_id))
        return result.scalar_one_or_none()

    async def get_by_user_and_institution(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> InstitutionMember | None:
        result = await self.db.execute(
            select(InstitutionMember).where(
                InstitutionMember.user_id == user_id,
                InstitutionMember.institution_id == institution_id,
                InstitutionMember.status == MemberStatus.ACTIVE
            )
        )
        return result.scalar_one_or_none()

    async def create(self, member: InstitutionMember) -> InstitutionMember:
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update(self, member: InstitutionMember) -> InstitutionMember:
        await self.db.commit()
        await self.db.refresh(member)
        return member
