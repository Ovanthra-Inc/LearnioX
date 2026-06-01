import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.permission_repository import PermissionRepository


class PermissionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PermissionRepository(db)

    async def check_permission(self, user_id: uuid.UUID, institution_id: uuid.UUID, permission: str) -> bool:
        user_perms = await self.repo.get_user_permissions(user_id, institution_id)
        return "*" in user_perms or permission in user_perms

    async def check_bulk_permissions(self, user_id: uuid.UUID, institution_id: uuid.UUID, permissions: list[str]) -> dict[str, bool]:
        user_perms = await self.repo.get_user_permissions(user_id, institution_id)
        has_wildcard = "*" in user_perms
        return {perm: (has_wildcard or perm in user_perms) for perm in permissions}
