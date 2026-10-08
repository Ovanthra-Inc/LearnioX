import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.member import MemberStatus
from app.services.curriculum_service import CurriculumService
from app.schemas.curriculum import CreateModuleRequest, UpdateModuleRequest


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def curriculum_service(mock_db):
    service = CurriculumService(db=mock_db)
    service.repo = MagicMock()
    service.course_repo = MagicMock()
    service.inst_repo = MagicMock()
    service.member_repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_create_module(curriculum_service):
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    inst_id = uuid.uuid4()
    other_owner_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.institution_id = inst_id

    fake_inst = MagicMock()
    fake_inst.owner_id = other_owner_id

    curriculum_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    curriculum_service.inst_repo.get_by_id = AsyncMock(return_value=fake_inst)
    # User is not an active member of the institution
    curriculum_service.member_repo.get_member_by_user_and_inst = AsyncMock(return_value=None)

    req = CreateModuleRequest(title="Attacker Module", description="Hacked")
    with pytest.raises(ForbiddenException):
        await curriculum_service.create_module(course_id, user_id, req)


@pytest.mark.asyncio
async def test_owner_can_create_module(curriculum_service):
    owner_id = uuid.uuid4()
    course_id = uuid.uuid4()
    inst_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.institution_id = inst_id

    fake_inst = MagicMock()
    fake_inst.owner_id = owner_id

    curriculum_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    curriculum_service.inst_repo.get_by_id = AsyncMock(return_value=fake_inst)

    fake_module = MagicMock()
    fake_module.id = uuid.uuid4()
    fake_module.course_id = course_id
    fake_module.title = "Owner Module"
    fake_module.description = "Valid"
    fake_module.position = 1
    fake_module.is_free = True
    from datetime import datetime, timezone
    fake_module.created_at = datetime.now(timezone.utc)

    curriculum_service.repo.create_module = AsyncMock(return_value=fake_module)

    req = CreateModuleRequest(title="Owner Module", description="Valid", is_free=True)
    resp = await curriculum_service.create_module(course_id, owner_id, req)
    assert resp.title == "Owner Module"


@pytest.mark.asyncio
async def test_unauthorized_user_cannot_delete_module(curriculum_service):
    user_id = uuid.uuid4()
    module_id = uuid.uuid4()
    course_id = uuid.uuid4()
    inst_id = uuid.uuid4()

    fake_module = MagicMock()
    fake_module.course_id = course_id

    fake_course = MagicMock()
    fake_course.institution_id = inst_id

    fake_inst = MagicMock()
    fake_inst.owner_id = uuid.uuid4()

    curriculum_service.repo.get_module_by_id = AsyncMock(return_value=fake_module)
    curriculum_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    curriculum_service.inst_repo.get_by_id = AsyncMock(return_value=fake_inst)
    curriculum_service.member_repo.get_member_by_user_and_inst = AsyncMock(return_value=None)

    with pytest.raises(ForbiddenException):
        await curriculum_service.delete_module(module_id, user_id)
