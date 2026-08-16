from typing import Callable, Optional
from uuid import UUID
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.exceptions import ForbiddenException, NotFoundException, UnauthorizedException
from app.core.security import decode_token
from app.database.session import get_db
from app.models.member import MemberStatus
from app.models.user import User
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token: Optional[str] = credentials.credentials if (credentials and credentials.credentials) else request.cookies.get("access_token")

    if not token:
        raise UnauthorizedException(
            message="Authorization token missing",
            error_code="MISSING_BEARER_TOKEN",
        )

    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException(
            message="Invalid token type for authorization",
            error_code="INVALID_TOKEN_TYPE",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(
            message="Token subject missing",
            error_code="INVALID_TOKEN_PAYLOAD",
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(user_id_str))

    if not user:
        raise UnauthorizedException(
            message="User account not found",
            error_code="USER_NOT_FOUND",
        )

    if not user.is_active:
        raise UnauthorizedException(
            message="User account is deactivated",
            error_code="USER_DEACTIVATED",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedException(
            message="Inactive user account",
            error_code="USER_INACTIVE",
        )
    return current_user


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Catches authentication/token errors gracefully.
    Inspects Authorization header first, then HttpOnly access_token cookie.
    """
    token: Optional[str] = credentials.credentials if (credentials and credentials.credentials) else request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_repo = UserRepository(db)
        return await user_repo.get_by_id(UUID(user_id_str))
    except (UnauthorizedException, ValueError):
        # Expected token errors — silently treat as unauthenticated
        return None
    # NOTE: DB-level exceptions (sqlalchemy.exc, asyncpg errors) are NOT caught
    # here intentionally — they will bubble up to the global 500 handler.


def require_permission(permission_code: str) -> Callable:
    async def permission_checker(
        institution_id: UUID,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db),
    ) -> bool:
        inst_repo = InstitutionRepository(db)
        inst = await inst_repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id == current_user.id:
            return True

        member_repo = MemberRepository(db)
        member = await member_repo.get_member_by_user_and_inst(current_user.id, institution_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenException(message="Active membership required", error_code="FORBIDDEN")

        role_repo = RoleRepository(db)
        effective = await role_repo.get_member_effective_permissions(member.id, current_user.id, institution_id)
        if permission_code not in effective:
            raise ForbiddenException(
                message=f"Missing required permission: {permission_code}",
                error_code="PERMISSION_DENIED",
            )
        return True

    return permission_checker


def require_course_admin(permission_code: str) -> Callable:
    """
    CRIT-04: Dependency factory that checks whether the current user has admin
    rights over the institution that owns a given course.

    Usage in router:
        @router.get("/courses/{course_id}/students")
        async def list_students(
            course_id: UUID,
            _: bool = Depends(require_course_admin("student.view")),
            ...
        ):
    """
    async def course_admin_checker(
        course_id: UUID,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db),
    ) -> bool:
        from app.repositories.course_repository import CourseRepository
        course_repo = CourseRepository(db)
        course = await course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        institution_id = course.institution_id
        inst_repo = InstitutionRepository(db)
        inst = await inst_repo.get_by_id(institution_id)
        if inst and inst.owner_id == current_user.id:
            return True

        member_repo = MemberRepository(db)
        member = await member_repo.get_member_by_user_and_inst(current_user.id, institution_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenException(
                message="You must be an institution admin or owner to access this resource.",
                error_code="FORBIDDEN",
            )

        role_repo = RoleRepository(db)
        effective = await role_repo.get_member_effective_permissions(
            member.id, current_user.id, institution_id
        )
        if permission_code not in effective:
            raise ForbiddenException(
                message=f"Missing required permission: {permission_code}",
                error_code="PERMISSION_DENIED",
            )
        return True

    return course_admin_checker


def require_institution_owner() -> Callable:
    """
    CRIT-04: Ensures the current user is the owner of at least one institution
    (used for global-scope admin endpoints like payment history).
    """
    async def owner_checker(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db),
    ) -> bool:
        inst_repo = InstitutionRepository(db)
        owned = await inst_repo.list_by_owner(current_user.id)
        if not owned:
            raise ForbiddenException(
                message="Only institution owners can access this resource.",
                error_code="FORBIDDEN_OWNER_ONLY",
            )
        return True

    return owner_checker


# ─── Service DI Factories ─────────────────────────────────────────────────────
# Use these as FastAPI Depends() instead of instantiating services inline.
# Benefit: in tests, override with app.dependency_overrides[get_xxx_service].

def get_auth_service(db: AsyncSession = Depends(get_db)):
    from app.services.auth_service import AuthService
    return AuthService(db)


def get_user_service(db: AsyncSession = Depends(get_db)):
    from app.services.user_service import UserService
    return UserService(db)


def get_course_service(db: AsyncSession = Depends(get_db)):
    from app.services.course_service import CourseService
    return CourseService(db)


def get_curriculum_service(db: AsyncSession = Depends(get_db)):
    from app.services.curriculum_service import CurriculumService
    return CurriculumService(db)


def get_enrollment_service(db: AsyncSession = Depends(get_db)):
    from app.services.enrollment_service import EnrollmentService
    return EnrollmentService(db)


def get_institution_service(db: AsyncSession = Depends(get_db)):
    from app.services.institution_service import InstitutionService
    return InstitutionService(db)


def get_member_service(db: AsyncSession = Depends(get_db)):
    from app.services.member_service import MemberService
    return MemberService(db)


def get_role_service(db: AsyncSession = Depends(get_db)):
    from app.services.role_service import RoleService
    return RoleService(db)


def get_storage_service(db: AsyncSession = Depends(get_db)):
    from app.services.storage_service import StorageService
    return StorageService(db)


def get_assessment_service(db: AsyncSession = Depends(get_db)):
    from app.services.assessment_service import AssessmentService
    return AssessmentService(db)


def get_payment_service(db: AsyncSession = Depends(get_db)):
    from app.services.payment_service import PaymentService
    return PaymentService(db)


def get_search_service(db: AsyncSession = Depends(get_db)):
    from app.services.search_service import SearchService
    return SearchService(db)


def get_access_service(db: AsyncSession = Depends(get_db)):
    from app.services.access_service import AccessService
    return AccessService(db)
