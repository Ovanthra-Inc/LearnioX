import uuid
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.core.exceptions import ValidationException
from app.schemas.role import UpdateRolePermissionsRequest
from app.services.role_service import RoleService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def role_service(mock_db):
    service = RoleService(db=mock_db)
    service.repo = MagicMock()
    service.inst_repo = MagicMock()
    service.member_repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_owner_super_access_receives_all_permissions(role_service):
    """Test institution owner automatically receives all permissions in the institution."""
    owner_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    member_id = uuid.uuid4()

    all_perm_codes = [
        "course.create", "course.update", "course.delete", "course.publish",
        "member.invite", "member.remove", "payment.manage", "analytics.view"
    ]
    role_service.repo.get_member_effective_permissions = AsyncMock(
        return_value=set(all_perm_codes)
    )

    perms = await role_service.get_member_effective_permissions(
        member_id=member_id, user_id=owner_id, institution_id=inst_id
    )

    assert set(perms) == set(all_perm_codes)
    assert "course.delete" in perms
    assert "payment.manage" in perms


@pytest.mark.asyncio
async def test_custom_role_permission_enforcement(role_service):
    """Test non-owner member only receives the explicit permissions granted to their role."""
    user_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    member_id = uuid.uuid4()

    instructor_perms = ["course.create", "course.update", "lecture.upload"]
    role_service.repo.get_member_effective_permissions = AsyncMock(
        return_value=set(instructor_perms)
    )

    perms = await role_service.get_member_effective_permissions(
        member_id=member_id, user_id=user_id, institution_id=inst_id
    )

    assert set(perms) == set(instructor_perms)
    assert "course.create" in perms
    assert "payment.manage" not in perms  # Not permitted for Instructor
    assert "member.remove" not in perms   # Not permitted for Instructor


@pytest.mark.asyncio
async def test_system_role_deletion_protection(role_service):
    """Test system roles cannot be deleted and raise ValidationException."""
    role_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    owner_id = uuid.uuid4()

    fake_inst = MagicMock()
    fake_inst.id = inst_id
    fake_inst.owner_id = owner_id

    system_role = MagicMock()
    system_role.id = role_id
    system_role.name = "Owner"
    system_role.is_system = True

    role_service.inst_repo.get_by_id = AsyncMock(return_value=fake_inst)
    role_service.repo.get_role_by_id = AsyncMock(return_value=system_role)

    with pytest.raises(ValidationException) as exc_info:
        await role_service.delete_role(role_id=role_id, institution_id=inst_id, user_id=owner_id)

    assert exc_info.value.error_code == "SYSTEM_ROLE_PROTECTED"


@pytest.mark.asyncio
async def test_replace_role_permissions(role_service):
    """Test atomic replacement of permissions on a custom role."""
    role_id = uuid.uuid4()
    user_id = uuid.uuid4()
    p1 = uuid.uuid4()
    p2 = uuid.uuid4()

    mock_role = MagicMock()
    mock_role.id = role_id
    mock_role.name = "Content Editor"
    mock_role.description = "Manages course lectures"
    mock_role.is_system = False
    mock_role.permissions = []
    mock_role.created_at = None

    perm1 = MagicMock()
    perm1.id = p1
    perm1.name = "Course Update"
    perm1.code = "course.update"
    perm1.category = "Course"
    perm1.description = "Update course details"

    perm2 = MagicMock()
    perm2.id = p2
    perm2.name = "Lecture Upload"
    perm2.code = "lecture.upload"
    perm2.category = "Lecture"
    perm2.description = "Upload lectures"

    updated_role = MagicMock()
    updated_role.id = role_id
    updated_role.name = "Content Editor"
    updated_role.description = "Manages course lectures"
    updated_role.is_system = False
    updated_role.permissions = [perm1, perm2]
    updated_role.created_at = None

    role_service.repo.get_role_by_id = AsyncMock(return_value=mock_role)
    role_service.repo.replace_role_permissions = AsyncMock(return_value=updated_role)
    role_service._to_role_detail_response = AsyncMock()

    payload = UpdateRolePermissionsRequest(permission_ids=[p1, p2])
    await role_service.replace_role_permissions(role_id=role_id, user_id=user_id, payload=payload)

    role_service.repo.replace_role_permissions.assert_called_once_with(mock_role, [p1, p2])
