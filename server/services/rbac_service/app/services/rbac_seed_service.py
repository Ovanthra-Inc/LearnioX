from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.role import Role
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository


class RBACSeedService:
    @staticmethod
    async def seed_system_roles_and_permissions(db: AsyncSession) -> None:
        perm_repo = PermissionRepository(db)
        role_repo = RoleRepository(db)

        # 1. Seed Permissions
        permissions_to_seed = [
            ("*", "Superuser Access", "Grants all permissions", "system"),
            ("course.create", "Create Course", "Ability to create new courses", "course"),
            ("course.update", "Update Course", "Ability to update course metadata", "course"),
            ("course.publish", "Publish Course", "Ability to publish/archive courses", "course"),
            ("course.delete", "Delete Course", "Ability to delete courses", "course"),
            ("lesson.create", "Create Lesson", "Ability to create lessons", "lesson"),
            ("lesson.update", "Update Lesson", "Ability to update lessons", "lesson"),
            ("lesson.delete", "Delete Lesson", "Ability to delete lessons", "lesson"),
            ("member.invite", "Invite Members", "Ability to invite team members", "member"),
            ("member.remove", "Remove Members", "Ability to remove team members", "member"),
            ("settings.update", "Update Settings", "Ability to change institution settings", "institution"),
            ("branding.update", "Update Branding", "Ability to change logo/banner/colors", "institution"),
        ]

        seeded_perms = {}
        for code, name, desc, module in permissions_to_seed:
            perm = await perm_repo.seed_permission(code, name, desc, module)
            seeded_perms[code] = perm.id

        # 2. Seed System Roles
        roles_to_seed = [
            ("Owner", "owner", "Owner of the coaching institution. Full access.", ["*"]),
            ("Admin", "admin", "Co-owner/Administrator. Management access.", [
                "course.create", "course.update", "course.publish", "lesson.create", "lesson.update",
                "lesson.delete", "member.invite", "member.remove", "settings.update", "branding.update"
            ]),
            ("Instructor", "instructor", "Lead Instructor. Course management access.", [
                "course.create", "course.update", "course.publish", "lesson.create", "lesson.update", "lesson.delete"
            ]),
        ]

        for name, code, desc, perm_codes in roles_to_seed:
            existing = await role_repo.get_by_code_and_institution(code, None)
            if not existing:
                role = Role(
                    name=name,
                    code=code,
                    description=desc,
                    is_system_role=True,
                    institution_id=None
                )
                created_role = await role_repo.create(role)
                perm_ids = [seeded_perms[p_code] for p_code in perm_codes if p_code in seeded_perms]
                await role_repo.assign_permissions(created_role.id, perm_ids)
