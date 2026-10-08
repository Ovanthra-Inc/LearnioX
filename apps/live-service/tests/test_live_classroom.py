import time
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import jwt
import pytest

from app.core.config import settings
from app.models.classroom import (
    AdmissionStatus,
    ClassroomParticipant,
    ClassroomStatus,
    LiveClassroom,
    MeetingSession,
    ParticipantRole,
    SessionStatus,
)
from app.services.classroom_service import ClassroomService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def classroom_service(mock_db):
    service = ClassroomService(db=mock_db)
    service.repo = MagicMock()
    service.media_provider = MagicMock()
    service.media_provider.generate_token = AsyncMock(return_value="mock_media_token_abc")
    service.media_provider.create_room = AsyncMock()
    service.media_provider.end_room = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_join_ticket_role_assignment_host(classroom_service):
    """Test join ticket gives HOST role and ADMITTED status when instructor joins."""
    instructor_id = uuid.uuid4()
    classroom_id = uuid.uuid4()
    session_id = uuid.uuid4()

    fake_classroom = MagicMock()
    fake_classroom.id = classroom_id
    fake_classroom.instructor_id = instructor_id
    fake_classroom.settings = {"waiting_room_enabled": True}

    fake_session = MagicMock()
    fake_session.id = session_id
    fake_session.session_code = "lnx-host12"

    classroom_service.repo.get_classroom_by_id = AsyncMock(return_value=fake_classroom)
    classroom_service.repo.get_active_session_for_classroom = AsyncMock(return_value=fake_session)
    classroom_service.repo.upsert_participant = AsyncMock()

    res = await classroom_service.create_join_ticket(
        classroom_id=classroom_id,
        user_id=instructor_id,
        user_email="instructor@learniox.com",
        display_name="Prof. Ramanujan",
        avatar_url=None,
    )

    assert res["role"] == "HOST"
    assert res["admission_status"] == "ADMITTED"
    assert res["media_token"] == "mock_media_token_abc"

    # Decode and verify HMAC JWT ticket signature
    payload = jwt.decode(res["ticket"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["role"] == "HOST"
    assert payload["admission_status"] == "ADMITTED"
    assert payload["classroom_id"] == str(classroom_id)


@pytest.mark.asyncio
async def test_join_ticket_role_assignment_student_and_waiting_room(classroom_service):
    """Test student join ticket defaults to WAITING status when waiting room is active."""
    instructor_id = uuid.uuid4()
    student_id = uuid.uuid4()
    classroom_id = uuid.uuid4()
    session_id = uuid.uuid4()

    fake_classroom = MagicMock()
    fake_classroom.id = classroom_id
    fake_classroom.instructor_id = instructor_id
    fake_classroom.settings = {"waiting_room_enabled": True}

    fake_session = MagicMock()
    fake_session.id = session_id
    fake_session.session_code = "lnx-class99"

    classroom_service.repo.get_classroom_by_id = AsyncMock(return_value=fake_classroom)
    classroom_service.repo.get_active_session_for_classroom = AsyncMock(return_value=fake_session)
    classroom_service.repo.get_participant = AsyncMock(return_value=None)  # Not previously admitted
    classroom_service.repo.upsert_participant = AsyncMock()

    res = await classroom_service.create_join_ticket(
        classroom_id=classroom_id,
        user_id=student_id,
        user_email="student@learniox.com",
        display_name="Student Bob",
        avatar_url=None,
    )

    assert res["role"] == "STUDENT"
    assert res["admission_status"] == "WAITING"

    payload = jwt.decode(res["ticket"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["role"] == "STUDENT"
    assert payload["admission_status"] == "WAITING"


@pytest.mark.asyncio
async def test_join_ticket_unauthenticated_guest(classroom_service):
    """Test unauthenticated guest without LMS ID gets GUEST role in WAITING state."""
    instructor_id = uuid.uuid4()
    classroom_id = uuid.uuid4()
    session_id = uuid.uuid4()

    fake_classroom = MagicMock()
    fake_classroom.id = classroom_id
    fake_classroom.instructor_id = instructor_id
    fake_classroom.settings = {"waiting_room_enabled": True}

    fake_session = MagicMock()
    fake_session.id = session_id
    fake_session.session_code = "lnx-class99"

    classroom_service.repo.get_classroom_by_id = AsyncMock(return_value=fake_classroom)
    classroom_service.repo.get_active_session_for_classroom = AsyncMock(return_value=fake_session)
    classroom_service.repo.upsert_participant = AsyncMock()

    res = await classroom_service.create_join_ticket(
        classroom_id=classroom_id,
        user_id=None,
        user_email=None,
        display_name="Auditor Guest",
        avatar_url=None,
    )

    assert res["role"] == "GUEST"
    assert res["admission_status"] == "WAITING"
    assert res["user_id"] is None


@pytest.mark.asyncio
async def test_waiting_room_admission_and_denial(classroom_service):
    """Test host admitting or denying waiting room participants with WS broadcasts."""
    session_id = uuid.uuid4()
    host_id = uuid.uuid4()
    student_id = uuid.uuid4()

    classroom_service.repo.update_participant_admission = AsyncMock(return_value=1)

    with patch("app.services.classroom_service.ws_manager.publish_event", new_callable=AsyncMock) as mock_pub:
        # 1. Admit action
        count_admit = await classroom_service.admit_deny_participants(
            session_id=session_id, user_ids=[student_id], action="ADMIT", host_id=host_id
        )
        assert count_admit == 1
        classroom_service.repo.update_participant_admission.assert_called_with(
            session_id, [student_id], AdmissionStatus.ADMITTED
        )
        mock_pub.assert_called_once()
        assert mock_pub.call_args[0][1]["action"] == "ADMIT"

        # 2. Deny action
        mock_pub.reset_mock()
        count_deny = await classroom_service.admit_deny_participants(
            session_id=session_id, user_ids=[student_id], action="DENY", host_id=host_id
        )
        assert count_deny == 1
        classroom_service.repo.update_participant_admission.assert_called_with(
            session_id, [student_id], AdmissionStatus.DENIED
        )
        mock_pub.assert_called_once()
        assert mock_pub.call_args[0][1]["action"] == "DENY"
