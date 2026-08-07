from typing import List, Optional, Tuple, Set
from uuid import UUID
from sqlalchemy import func, select, and_, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac_catalog import DEFAULT_SYSTEM_ROLES, PERMISSIONS_CATALOG
from app.models.institution import Institution
from app.models.member import InstitutionMember
from app.models.role import Permission, Role, member_roles, role_permissions


class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_permissions_seeded(self) -> List[Permission]:
        existing_res = await self.db.execute(select(Permission))
        existing = {p.code: p for p in existing_res.scalars().all()}

        seeded = []
        for item in PERMISSIONS_CATALOG:
            code = item["code"]
            if code not in existing:
                perm = Permission(
                    name=item["name"],
                    code=code,
                    category=item["category"],
                    description=item["description"],
                )
                self.db.add(perm)
                seeded.append(perm)
            else:
                seeded.append(existing[code])

        if seeded:
            await self.db.flush()

        res_all = await self.db.execute(select(Permission))
        return list(res_all.scalars().all())

    async def seed_system_roles_for_institution(
        self, institution_id: UUID, created_by: Optional[UUID] = None
    ) -> List[Role]:
        permissions = await self.ensure_permissions_seeded()
        perm_map = {p.code: p for p in permissions}

        created_roles = []
        for role_name, config in DEFAULT_SYSTEM_ROLES.items():
            res = await self.db.execute(
                select(Role).where(
                    and_(
                        Role.institution_id == institution_id,
                        Role.name == role_name,
                    )
                )
            )
            existing_role = res.scalars().first()
            if not existing_role:
                role = Role(
                    institution_id=institution_id,
                    name=role_name,
                    description=config["description"],
                    is_system=True,
                    created_by=created_by,
                )
                role_perms = [
                    perm_map[code]
                    for code in config["permission_codes"]
                    if code in perm_map
                ]
                role.permissions = role_perms
                self.db.add(role)
                created_roles.append(role)
            else:
                created_roles.append(existing_role)

        await self.db.flush()
        return created_roles

    # Permission Methods
    async def list_all_permissions(self) -> List[Permission]:
        await self.ensure_permissions_seeded()
        res = await self.db.execute(select(Permission).order_by(Permission.category, Permission.name))
        return list(res.scalars().all())

    async def list_permission_categories(self) -> List[str]:
        await self.ensure_permissions_seeded()
        res = await self.db.execute(
            select(Permission.category).distinct().order_by(Permission.category)
        )
        return list(res.scalars().all())

    async def get_permissions_by_ids(self, permission_ids: List[UUID]) -> List[Permission]:
        if not permission_ids:
            return []
        res = await self.db.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        return list(res.scalars().all())

    # Role Methods
    async def create_role(
        self,
        institution_id: UUID,
        name: str,
        description: Optional[str] = None,
        is_system: bool = False,
        created_by: Optional[UUID] = None,
        permission_ids: Optional[List[UUID]] = None,
    ) -> Role:
        role = Role(
            institution_id=institution_id,
            name=name.strip(),
            description=description,
            is_system=is_system,
            created_by=created_by,
        )
        if permission_ids:
            perms = await self.get_permissions_by_ids(permission_ids)
            role.permissions = perms

        self.db.add(role)
        await self.db.flush()
        await self.db.refresh(role)
        return role

    async def get_role_by_id(
        self, role_id: UUID, institution_id: Optional[UUID] = None
    ) -> Optional[Role]:
        query = select(Role).where(Role.id == role_id)
        if institution_id:
            query = query.where(
                (Role.institution_id == institution_id) | (Role.institution_id.is_(None))
            )
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_role_by_name(self, institution_id: UUID, name: str) -> Optional[Role]:
        res = await self.db.execute(
            select(Role).where(
                and_(
                    Role.institution_id == institution_id,
                    Role.name.ilike(name.strip()),
                )
            )
        )
        return res.scalars().first()

    async def list_roles(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> Tuple[List[Role], int]:
        conditions = [
            (Role.institution_id == institution_id) | (Role.institution_id.is_(None))
        ]
        if search:
            conditions.append(Role.name.ilike(f"%{search}%"))

        count_query = select(func.count(Role.id)).where(and_(*conditions))
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        query = select(Role).where(and_(*conditions))
        if sort.lower() == "asc":
            query = query.order_by(Role.is_system.desc(), Role.name.asc())
        else:
            query = query.order_by(Role.is_system.desc(), Role.name.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update_role(self, role: Role, update_dict: dict) -> Role:
        for key, value in update_dict.items():
            if value is not None:
                setattr(role, key, value)
        await self.db.flush()
        await self.db.refresh(role)
        return role

    async def delete_role(self, role_id: UUID, institution_id: UUID) -> bool:
        role = await self.get_role_by_id(role_id, institution_id)
        if not role or role.is_system:
            return False
        await self.db.delete(role)
        await self.db.flush()
        return True

    async def replace_role_permissions(
        self, role: Role, permission_ids: List[UUID]
    ) -> Role:
        perms = await self.get_permissions_by_ids(permission_ids)
        role.permissions = perms
        await self.db.flush()
        await self.db.refresh(role)
        return role

    # Member Role Assignment
    async def assign_member_role(self, member_id: UUID, role_id: UUID) -> bool:
        res = await self.db.execute(
            select(member_roles).where(
                and_(
                    member_roles.c.member_id == member_id,
                    member_roles.c.role_id == role_id,
                )
            )
        )
        if res.first():
            return True

        stmt = insert(member_roles).values(member_id=member_id, role_id=role_id)
        await self.db.execute(stmt)
        await self.db.flush()
        return True

    async def remove_member_role(self, member_id: UUID, role_id: UUID) -> bool:
        stmt = delete(member_roles).where(
            and_(
                member_roles.c.member_id == member_id,
                member_roles.c.role_id == role_id,
            )
        )
        await self.db.execute(stmt)
        await self.db.flush()
        return True

    async def get_member_roles(self, member_id: UUID) -> List[Role]:
        res = await self.db.execute(
            select(Role)
            .join(member_roles, Role.id == member_roles.c.role_id)
            .where(member_roles.c.member_id == member_id)
        )
        return list(res.scalars().all())

    async def get_member_effective_permissions(
        self, member_id: UUID, user_id: UUID, institution_id: UUID
    ) -> Set[str]:
        # If user is owner of institution, give ALL permissions
        inst_res = await self.db.execute(
            select(Institution).where(Institution.id == institution_id)
        )
        inst = inst_res.scalars().first()
        if inst and inst.owner_id == user_id:
            all_perms = await self.list_all_permissions()
            return {p.code for p in all_perms}

        roles = await self.get_member_roles(member_id)
        effective: Set[str] = set()
        for role in roles:
            for p in role.permissions:
                effective.add(p.code)
        return effective

    async def get_role_statistics(self, institution_id: UUID) -> dict:
        roles, total = await self.list_roles(institution_id, page=1, limit=1000)

        perm_res = await self.db.execute(select(func.count(Permission.id)))
        total_perms = perm_res.scalar_one()

        assigned_roles_count = 0
        for r in roles:
            mem_count_res = await self.db.execute(
                select(func.count(member_roles.c.member_id)).where(
                    member_roles.c.role_id == r.id
                )
            )
            count = mem_count_res.scalar_one()
            if count > 0:
                assigned_roles_count += 1

        unassigned_roles_count = total - assigned_roles_count

        return {
            "total_roles": total,
            "total_permissions": total_perms,
            "assigned_roles": assigned_roles_count,
            "unassigned_roles": unassigned_roles_count,
        }
