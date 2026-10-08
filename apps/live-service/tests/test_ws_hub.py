import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.models.classroom import (
    AdmissionStatus,
    AttendanceRecord,
    AttendanceStatus,
    ClassroomParticipant,
    MeetingSession,
    ParticipantRole,
)
from app.services.classroom_service import ClassroomService
from app.ws.connection_manager import ClassroomConnectionManager


@pytest.fixture
def mock_websocket():
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_text = AsyncMock()
    return ws


@pytest.fixture
def connection_manager():
    mgr = ClassroomConnectionManager()
    mgr.redis_pool = None  # in-memory mode for unit test
    return mgr


@pytest.mark.asyncio
async def test_ws_connection_lifecycle(connection_manager, mock_websocket):
    """Test connecting and disconnecting WebSockets within session room."""
    session_id = "test-session-123"
    conn_id = "conn-abc-456"
    user_info = {"user_id": str(uuid.uuid4()), "display_name": "Alice"}

    # 1. Connect
    await connection_manager.connect(session_id, conn_id, mock_websocket, user_info)
    assert session_id in connection_manager.active_rooms
    assert conn_id in connection_manager.active_rooms[session_id]
    mock_websocket.accept.assert_called_once()

    # 2. Local broadcast
    test_event = {"type": "CHAT_MESSAGE", "content": "Hello class!"}
    await connection_manager.broadcast_local(session_id, test_event)
    mock_websocket.send_text.assert_called_with(json.dumps(test_event))

    # 3. Disconnect
    await connection_manager.disconnect(session_id, conn_id)
    assert session_id not in connection_manager.active_rooms
    assert conn_id not in connection_manager.connection_meta


@pytest.mark.asyncio
async def test_reaction_storm_batching(connection_manager, mock_websocket):
    """Test reaction buffering aggregates bursts into a single batch event."""
    session_id = "session-storm-789"
    conn_id = "conn-789"
    user_info = {"user_id": str(uuid.uuid4()), "display_name": "Bob"}

    await connection_manager.connect(session_id, conn_id, mock_websocket, user_info)

    # Buffer rapid reaction burst
    connection_manager.buffer_reaction(session_id, "🔥")
    connection_manager.buffer_reaction(session_id, "🔥")
    connection_manager.buffer_reaction(session_id, "👏")
    connection_manager.buffer_reaction(session_id, "❤️")
    connection_manager.buffer_reaction(session_id, "🔥")

    assert connection_manager.reaction_buffer[session_id]["🔥"] == 3
    assert connection_manager.reaction_buffer[session_id]["👏"] == 1
    assert connection_manager.reaction_buffer[session_id]["❤️"] == 1

    # Flush reaction buffer manually to test aggregation broadcast
    batch = connection_manager.reaction_buffer.pop(session_id, {})
    event = {
        "type": "REACTIONS_BATCH",
        "reactions": batch,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await connection_manager.broadcast_local(session_id, event)

    mock_websocket.send_text.assert_called()
    sent_payload = json.loads(mock_websocket.send_text.call_args[0][0])
    assert sent_payload["type"] == "REACTIONS_BATCH"
    assert sent_payload["reactions"]["🔥"] == 3
    assert sent_payload["reactions"]["👏"] == 1

    await connection_manager.disconnect(session_id, conn_id)


@pytest.mark.asyncio
async def test_whiteboard_stroke_synchronization(connection_manager, mock_websocket):
    """Test real-time whiteboard stroke broadcasting across connected room participants."""
    session_id = "whiteboard-session"
    conn_id = "conn-wb"
    user_info = {"user_id": str(uuid.uuid4()), "display_name": "Teacher"}

    await connection_manager.connect(session_id, conn_id, mock_websocket, user_info)

    stroke_event = {
        "type": "WHITEBOARD_STROKE",
        "page_number": 1,
        "stroke": {"tool": "pen", "color": "#ff0000", "points": [[10, 10], [20, 20]]},
        "sender_id": user_info["user_id"],
    }

    await connection_manager.broadcast_local(session_id, stroke_event)
    mock_websocket.send_text.assert_called_with(json.dumps(stroke_event))

    await connection_manager.disconnect(session_id, conn_id)


@pytest.mark.asyncio
async def test_attendance_reconciliation_computation():
    """Test automated attendance status calculation based on session duration."""
    session_id = uuid.uuid4()
    mock_db = AsyncMock()
    service = ClassroomService(db=mock_db)
    service.repo = MagicMock()

    now = datetime.now(timezone.utc)
    started_at = now - timedelta(minutes=60)
    ended_at = now

    fake_session = MagicMock()
    fake_session.id = session_id
    fake_session.started_at = started_at
    fake_session.ended_at = ended_at
    fake_session.classroom = None

    # Student 1: Attended 50 min / 60 min (83.3%) -> PRESENT
    student1_id = uuid.uuid4()
    p1 = MagicMock()
    p1.user_id = student1_id
    p1.role = ParticipantRole.STUDENT
    p1.total_seconds = 3000
    p1.joined_at = started_at
    p1.left_at = ended_at

    # Student 2: Attended 35 min / 60 min (58.3%) -> LATE
    student2_id = uuid.uuid4()
    p2 = MagicMock()
    p2.user_id = student2_id
    p2.role = ParticipantRole.STUDENT
    p2.total_seconds = 2100
    p2.joined_at = started_at
    p2.left_at = ended_at

    # Student 3: Attended 3 min / 60 min (5%) -> ABSENT
    student3_id = uuid.uuid4()
    p3 = MagicMock()
    p3.user_id = student3_id
    p3.role = ParticipantRole.STUDENT
    p3.total_seconds = 180
    p3.joined_at = started_at
    p3.left_at = ended_at

    service.repo.get_session_by_id = AsyncMock(return_value=fake_session)
    service.repo.list_participants = AsyncMock(return_value=[p1, p2, p3])
    service.repo.save_attendance_record = AsyncMock(side_effect=lambda r: r)

    records = await service.reconcile_attendance(session_id)

    assert len(records) == 3
    assert records[0].status == AttendanceStatus.PRESENT
    assert records[0].attendance_percentage >= 75.0
    assert records[1].status == AttendanceStatus.LATE
    assert records[2].status == AttendanceStatus.ABSENT
