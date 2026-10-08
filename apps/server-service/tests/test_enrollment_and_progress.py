import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.core.exceptions import ForbiddenException, ValidationException
from app.models.course import CourseStatus
from app.models.enrollment import EnrollmentAccessType, EnrollmentStatus, LessonProgressStatus
from app.schemas.enrollment import EnrollRequest, UpdateProgressRequest
from app.services.certificate_service import CertificateService
from app.services.enrollment_service import EnrollmentService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def enrollment_service(mock_db):
    service = EnrollmentService(db=mock_db)
    service.repo = MagicMock()
    service.course_repo = MagicMock()
    service.curriculum_repo = MagicMock()
    return service


@pytest.mark.asyncio
async def test_enroll_course_idempotency(enrollment_service):
    """Test duplicate enrollment returns existing active record idempotently."""
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()
    enrollment_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.status = CourseStatus.PUBLISHED
    fake_course.institution_id = uuid.uuid4()

    fake_existing_enr = MagicMock()
    fake_existing_enr.id = enrollment_id
    fake_existing_enr.user_id = user_id
    fake_existing_enr.course_id = course_id
    fake_existing_enr.status = EnrollmentStatus.ACTIVE
    fake_existing_enr.access_type = EnrollmentAccessType.FREE
    fake_existing_enr.enrolled_at = datetime.now(timezone.utc)
    fake_existing_enr.completed_at = None
    fake_existing_enr.expires_at = None

    enrollment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)
    enrollment_service.repo.find_enrollment = AsyncMock(return_value=fake_existing_enr)

    payload = EnrollRequest(access_type="FREE")
    res = await enrollment_service.enroll_course(user_id=user_id, course_id=course_id, payload=payload)

    assert res.enrollment_id == enrollment_id
    assert res.status == "ACTIVE"
    # Ensure no duplicate creation call was triggered
    enrollment_service.repo.create_enrollment.assert_not_called()


@pytest.mark.asyncio
async def test_enroll_unpublished_course_fails(enrollment_service):
    """Test enrolling in a DRAFT or unpublished course raises ValidationException."""
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.status = CourseStatus.DRAFT

    enrollment_service.course_repo.get_course_by_id = AsyncMock(return_value=fake_course)

    with pytest.raises(ValidationException) as exc_info:
        await enrollment_service.enroll_course(
            user_id=user_id, course_id=course_id, payload=EnrollRequest(access_type="FREE")
        )

    assert exc_info.value.error_code == "COURSE_NOT_PUBLISHED"


@pytest.mark.asyncio
async def test_progress_heartbeat_and_completion(enrollment_service):
    """Test updating lesson progress heartbeat marks completed when reaching 100%."""
    user_id = uuid.uuid4()
    lesson_id = uuid.uuid4()
    module_id = uuid.uuid4()
    course_id = uuid.uuid4()

    fake_prog = MagicMock()
    fake_prog.lesson_id = lesson_id
    fake_prog.watch_time = 30
    fake_prog.last_position = 30
    fake_prog.progress_percentage = 25
    fake_prog.status = LessonProgressStatus.IN_PROGRESS
    fake_prog.started_at = datetime.now(timezone.utc)
    fake_prog.completed_at = None

    updated_prog = MagicMock()
    updated_prog.lesson_id = lesson_id
    updated_prog.watch_time = 120
    updated_prog.last_position = 120
    updated_prog.progress_percentage = 100
    updated_prog.status = LessonProgressStatus.COMPLETED
    updated_prog.started_at = fake_prog.started_at
    updated_prog.completed_at = datetime.now(timezone.utc)

    fake_lesson = MagicMock()
    fake_lesson.module_id = module_id
    fake_module = MagicMock()
    fake_module.course_id = course_id

    enrollment_service.repo.get_or_create_lesson_progress = AsyncMock(return_value=fake_prog)
    enrollment_service.repo.update_lesson_progress = AsyncMock(return_value=updated_prog)
    enrollment_service.curriculum_repo.get_lesson_by_id = AsyncMock(return_value=fake_lesson)
    enrollment_service.curriculum_repo.get_module_by_id = AsyncMock(return_value=fake_module)
    enrollment_service.repo.recalculate_course_progress = AsyncMock()

    payload = UpdateProgressRequest(watch_time=120, last_position=120, progress_percentage=100)
    res = await enrollment_service.update_progress(user_id=user_id, lesson_id=lesson_id, payload=payload)

    assert res.progress_percentage == 100
    assert res.status == "COMPLETED"
    enrollment_service.repo.recalculate_course_progress.assert_called_once_with(
        user_id, course_id, last_lesson_id=lesson_id
    )


@pytest.mark.asyncio
async def test_certificate_issuance_completion_guard(mock_db):
    """Test certificate issuance is blocked until the course enrollment is COMPLETED."""
    cert_service = CertificateService(db=mock_db)
    user_id = uuid.uuid4()
    course_id = uuid.uuid4()

    fake_course = MagicMock()
    fake_course.id = course_id
    fake_course.certificate_enabled = True

    fake_enr = MagicMock()
    fake_enr.status = EnrollmentStatus.ACTIVE  # Not completed yet

    mock_db.execute = AsyncMock()
    # First query returns course, second returns incomplete enrollment
    mock_db.execute.side_effect = [
        MagicMock(scalars=lambda: MagicMock(first=lambda: fake_course)),
        MagicMock(scalars=lambda: MagicMock(first=lambda: fake_enr)),
    ]

    with pytest.raises(ForbiddenException) as exc_info:
        await cert_service.issue_certificate(course_id=course_id, user_id=user_id)

    assert exc_info.value.error_code == "COURSE_NOT_COMPLETED"
