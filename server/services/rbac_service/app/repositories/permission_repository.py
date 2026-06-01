import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.institution_member import InstitutionMember


class PermissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_code(self, code: str) -> Permission | None:
        result = await self.db.execute(select(Permission).where(Permission.code == code))
        return result.scalar_one_or_none()

    async def get_user_permissions(self, user_id: uuid.UUID, institution_id: uuid.UUID) -> set[str]:
        query = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(InstitutionMember, InstitutionMember.role_id == RolePermission.role_id)
            .where(
                InstitutionMember.user_id == user_id,
                InstitutionMember.institution_id == institution_id,
                InstitutionMember.status == "active"
            )
        )
        result = await self.db.execute(query)
        return set(result.scalars().all())

    async def seed_permission(self, code: str, name: str, description: str, module: str) -> Permission:
        existing = await self.get_by_code(code)
        if existing:
            return existing
        perm = Permission(code=code, name=name, description=description, module=module)
        self.db.add(perm)
        await self.db.commit()
        await self.db.refresh(perm)
        return perm
