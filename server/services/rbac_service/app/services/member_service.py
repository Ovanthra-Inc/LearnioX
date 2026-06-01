import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.institution_member import InstitutionMember, MemberStatus
from app.repositories.member_repository import MemberRepository
from app.repositories.role_repository import RoleRepository


class MemberService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.member_repo = MemberRepository(db)
        self.role_repo = RoleRepository(db)

    async def add_initial_owner(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> InstitutionMember:
        owner_role = await self.role_repo.get_by_code_and_institution("owner", None)
        if not owner_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Owner role not seeded"
            )

        member = InstitutionMember(
            institution_id=institution_id,
            user_id=user_id,
            role_id=owner_role.id,
            status=MemberStatus.ACTIVE,
            is_owner=True
        )
        return await self.member_repo.create(member)
