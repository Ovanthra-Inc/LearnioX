import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.role_permission import RolePermission


class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, role_id: uuid.UUID) -> Role | None:
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def get_by_code_and_institution(self, code: str, institution_id: uuid.UUID | None) -> Role | None:
        result = await self.db.execute(
            select(Role).where(
                Role.code == code,
                Role.institution_id == institution_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, role: Role) -> Role:
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def assign_permissions(self, role_id: uuid.UUID, permission_ids: list[uuid.UUID]) -> None:
        # For simplicity, we just add new mappings
        for perm_id in permission_ids:
            rp = RolePermission(role_id=role_id, permission_id=perm_id)
            self.db.add(rp)
        await self.db.commit()
