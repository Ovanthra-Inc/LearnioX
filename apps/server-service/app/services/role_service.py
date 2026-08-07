from typing import List, Optional, Set
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.member import InstitutionMember
from app.models.role import Permission, Role, member_roles

from app.repositories.institution_repository import InstitutionRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.role import (
    CreateRoleRequest,
    PermissionResponse,
    RoleDetailResponse,
    RoleListResponse,
    RoleResponse,
    RoleStatisticsResponse,
    UpdateRolePermissionsRequest,
    UpdateRoleRequest,
)


class RoleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RoleRepository(db)
        self.inst_repo = InstitutionRepository(db)
        self.member_repo = MemberRepository(db)

    async def _to_role_response(self, role: Role) -> RoleResponse:
        total_perms = len(role.permissions) if role.permissions else 0
        return RoleResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            is_system=role.is_system,
            total_permissions=total_perms,
            created_at=role.created_at,
        )

    async def _to_role_detail_response(self, role: Role) -> RoleDetailResponse:
        mem_count_res = await self.db.execute(
            select(func.count(member_roles.c.member_id)).where(
                member_roles.c.role_id == role.id
            )
        )
        mem_count = mem_count_res.scalar_one()

        perms = [
            PermissionResponse(
                id=p.id,
                name=p.name,
                code=p.code,
                category=p.category,
                description=p.description,
            )
            for p in (role.permissions or [])
        ]

        return RoleDetailResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            is_system=role.is_system,
            permissions=perms,
            member_count=mem_count,
            created_at=role.created_at,
        )

    async def create_role(
        self, institution_id: UUID, user_id: UUID, payload: CreateRoleRequest
    ) -> RoleResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        existing = await self.repo.get_role_by_name(institution_id, payload.name)
        if existing:
            raise ConflictException(
                message=f"Role with name '{payload.name}' already exists",
                error_code="ROLE_ALREADY_EXISTS",
            )

        role = await self.repo.create_role(
            institution_id=institution_id,
            name=payload.name,
            description=payload.description,
            created_by=user_id,
            permission_ids=payload.permission_ids,
        )
        return await self._to_role_response(role)

    async def get_role_details(self, role_id: UUID, institution_id: UUID) -> RoleDetailResponse:
        role = await self.repo.get_role_by_id(role_id, institution_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")
        return await self._to_role_detail_response(role)

    async def list_roles(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> RoleListResponse:
        roles, total = await self.repo.list_roles(
            institution_id=institution_id, page=page, limit=limit, search=search, sort=sort
        )
        responses = [await self._to_role_response(r) for r in roles]
        return RoleListResponse(total=total, page=page, limit=limit, items=responses)

    async def update_role(
        self, role_id: UUID, institution_id: UUID, user_id: UUID, payload: UpdateRoleRequest
    ) -> RoleResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        role = await self.repo.get_role_by_id(role_id, institution_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")
        if role.is_system and payload.name and payload.name != role.name:
            raise ValidationException(
                message="System roles cannot be renamed", error_code="SYSTEM_ROLE_PROTECTED"
            )

        update_dict = payload.model_dump(exclude_unset=True)
        updated = await self.repo.update_role(role, update_dict)
        return await self._to_role_response(updated)

    async def delete_role(self, role_id: UUID, institution_id: UUID, user_id: UUID) -> None:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        role = await self.repo.get_role_by_id(role_id, institution_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")
        if role.is_system:
            raise ValidationException(
                message="System default roles cannot be deleted",
                error_code="SYSTEM_ROLE_PROTECTED",
            )

        success = await self.repo.delete_role(role_id, institution_id)
        if not success:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")

    async def clone_role(
        self, role_id: UUID, institution_id: UUID, user_id: UUID
    ) -> RoleResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        role = await self.repo.get_role_by_id(role_id, institution_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")

        new_name = f"Copy of {role.name}"
        perm_ids = [p.id for p in (role.permissions or [])]

        cloned = await self.repo.create_role(
            institution_id=institution_id,
            name=new_name,
            description=f"Cloned from {role.name}",
            is_system=False,
            created_by=user_id,
            permission_ids=perm_ids,
        )
        return await self._to_role_response(cloned)

    async def reset_roles(self, institution_id: UUID, user_id: UUID) -> List[RoleResponse]:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        roles = await self.repo.seed_system_roles_for_institution(
            institution_id=institution_id, created_by=user_id
        )
        return [await self._to_role_response(r) for r in roles]

    async def replace_role_permissions(
        self, role_id: UUID, user_id: UUID, payload: UpdateRolePermissionsRequest
    ) -> RoleDetailResponse:
        role = await self.repo.get_role_by_id(role_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")

        updated = await self.repo.replace_role_permissions(role, payload.permission_ids)
        return await self._to_role_detail_response(updated)

    async def list_permissions(self) -> List[PermissionResponse]:
        perms = await self.repo.list_all_permissions()
        return [
            PermissionResponse(
                id=p.id,
                name=p.name,
                code=p.code,
                category=p.category,
                description=p.description,
            )
            for p in perms
        ]

    async def list_permission_categories(self) -> List[str]:
        return await self.repo.list_permission_categories()

    async def assign_role_to_member(
        self, member_id: UUID, role_id: UUID, user_id: UUID
    ) -> None:
        role = await self.repo.get_role_by_id(role_id)
        if not role:
            raise NotFoundException(message="Role not found", error_code="ROLE_NOT_FOUND")

        member = await self.member_repo.get_member_by_id(member_id)
        if not member:
            raise NotFoundException(message="Member not found", error_code="MEMBER_NOT_FOUND")

        await self.repo.assign_member_role(member_id=member_id, role_id=role_id)

    async def remove_role_from_member(
        self, member_id: UUID, role_id: UUID, user_id: UUID
    ) -> None:
        await self.repo.remove_member_role(member_id=member_id, role_id=role_id)

    async def get_member_roles(self, member_id: UUID) -> List[RoleResponse]:
        roles = await self.repo.get_member_roles(member_id)
        return [await self._to_role_response(r) for r in roles]

    async def get_member_effective_permissions(
        self, member_id: UUID, user_id: UUID, institution_id: UUID
    ) -> List[str]:
        effective_set = await self.repo.get_member_effective_permissions(
            member_id=member_id, user_id=user_id, institution_id=institution_id
        )
        return sorted(list(effective_set))

    async def get_role_statistics(self, institution_id: UUID) -> RoleStatisticsResponse:
        stats = await self.repo.get_role_statistics(institution_id)
        return RoleStatisticsResponse(**stats)
