import json
import logging
import uuid
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
import jwt

from app.core.config import settings
from app.database.session import AsyncSessionLocal
from app.repositories.classroom_repository import ClassroomRepository
from app.ws.connection_manager import ws_manager

logger = logging.getLogger("live-service.ws-endpoint")
router = APIRouter()


@router.websocket("/ws/{session_id}")
async def classroom_websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    ticket: Optional[str] = Query(None),
):
    connection_id = str(uuid.uuid4())
    user_info = {
        "user_id": None,
        "display_name": "Anonymous Learner",
        "role": "STUDENT",
        "admission_status": "ADMITTED",
    }

    # Verify cryptographic join ticket
    if ticket:
        try:
            payload = jwt.decode(ticket, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_info["user_id"] = payload.get("user_id")
            user_info["display_name"] = payload.get("display_name", "Learner")
            user_info["role"] = payload.get("role", "STUDENT")
            user_info["admission_status"] = payload.get("admission_status", "ADMITTED")
        except jwt.PyJWTError as e:
            logger.warning(f"Invalid join ticket for WS connection: {e}")
            await websocket.close(code=4003, reason="Invalid Join Ticket")
            return
    elif not settings.DEBUG:
        await websocket.close(code=4001, reason="Join Ticket Required")
        return

    # Accept & register connection
    await ws_manager.connect(session_id, connection_id, websocket, user_info)

    try:
        while True:
            raw_text = await websocket.receive_text()
            ws_manager.update_activity(connection_id)
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type")

            # 1. Ephemeral Keepalive Ping & Pong
            if event_type == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
                continue
            elif event_type == "PONG":
                continue

            # 2. Ephemeral Reaction (Buffer & Batch for storm mitigation)
            elif event_type == "REACTION":
                reaction = data.get("reaction", "thumbs_up")
                ws_manager.buffer_reaction(session_id, reaction)

            # 3. Hand Raise Toggle
            elif event_type == "HAND_RAISE":
                raised = bool(data.get("raised", True))
                if user_info.get("user_id"):
                    async with AsyncSessionLocal() as db:
                        repo = ClassroomRepository(db)
                        await repo.set_hand_raised(
                            session_id=UUID(session_id),
                            user_id=UUID(str(user_info["user_id"])),
                            raised=raised,
                        )
                        await db.commit()

                await ws_manager.publish_event(
                    session_id,
                    {
                        "type": "HAND_RAISE_UPDATE",
                        "user_id": str(user_info.get("user_id")),
                        "display_name": user_info.get("display_name"),
                        "raised": raised,
                    },
                )

            # 4. In-flight Whiteboard Stroke
            elif event_type == "WHITEBOARD_STROKE":
                # Realtime ephemeral drawing path forwarded to participants
                await ws_manager.publish_event(
                    session_id,
                    {
                        "type": "WHITEBOARD_STROKE",
                        "stroke": data.get("stroke"),
                        "page": data.get("page", 1),
                        "sender_id": str(user_info.get("user_id")),
                    },
                )

    except WebSocketDisconnect:
        await ws_manager.disconnect(session_id, connection_id)
        if user_info.get("user_id"):
            try:
                async with AsyncSessionLocal() as db:
                    repo = ClassroomRepository(db)
                    await repo.record_participant_leave(
                        session_id=UUID(session_id),
                        user_id=UUID(str(user_info["user_id"])),
                    )
                    await db.commit()
            except Exception as e:
                logger.error(f"Failed to record participant leave: {e}")
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}")
        await ws_manager.disconnect(session_id, connection_id)
