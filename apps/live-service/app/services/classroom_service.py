import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.classroom import (
    LiveClassroom,
    MeetingSession,
    ClassroomParticipant,
    AttendanceRecord,
    ClassroomChatMessage,
    ClassroomPoll,
    ClassroomPollOption,
    ClassroomPollResponse,
    ClassroomQnAQuestion,
    ClassroomWhiteboardSnapshot,
    ClassroomStatus,
    SessionStatus,
    ParticipantRole,
    AdmissionStatus,
    AttendanceStatus,
)
from app.repositories.classroom_repository import ClassroomRepository
from app.schemas.classroom import (
    ClassroomCreateRequest,
    ClassroomUpdateRequest,
    PollCreateRequest,
    ChatMessageCreateRequest,
    QnAQuestionCreateRequest,
)
from app.services.media_provider import get_media_provider
from app.ws.connection_manager import ws_manager


class ClassroomService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ClassroomRepository(db)
        self.media_provider = get_media_provider()

    # ─── Classroom Management ──────────────────────────────────────────────────
    async def create_classroom(
        self, data: ClassroomCreateRequest, instructor_id: UUID
    ) -> LiveClassroom:
        settings_dict = (
            data.settings.model_dump()
            if data.settings
            else {
                "waiting_room_enabled": True,
                "chat_enabled": True,
                "qna_enabled": True,
                "polls_enabled": True,
                "whiteboard_enabled": True,
                "allow_student_mic": False,
                "allow_student_camera": False,
                "allow_student_screen": False,
                "auto_record": False,
                "guest_allowed": False,
            }
        )

        classroom = LiveClassroom(
            institution_id=data.institution_id,
            course_id=data.course_id,
            lesson_id=data.lesson_id,
            instructor_id=instructor_id,
            title=data.title,
            description=data.description,
            scheduled_start=data.scheduled_start,
            scheduled_end=data.scheduled_end,
            status=ClassroomStatus.SCHEDULED,
            settings=settings_dict,
        )
        return await self.repo.create_classroom(classroom)

    async def get_classroom(self, classroom_id: UUID) -> Optional[LiveClassroom]:
        return await self.repo.get_classroom_by_id(classroom_id)

    async def list_classrooms(
        self,
        institution_id: Optional[UUID] = None,
        course_id: Optional[UUID] = None,
        instructor_id: Optional[UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[LiveClassroom], int]:
        return await self.repo.list_classrooms(
            institution_id=institution_id,
            course_id=course_id,
            instructor_id=instructor_id,
            status=status,
            skip=skip,
            limit=limit,
        )

    async def update_classroom(
        self, classroom_id: UUID, data: ClassroomUpdateRequest
    ) -> Optional[LiveClassroom]:
        update_data = data.model_dump(exclude_unset=True)
        if "settings" in update_data and update_data["settings"]:
            update_data["settings"] = update_data["settings"]
        return await self.repo.update_classroom(classroom_id, update_data)

    # ─── Live Meeting Sessions ─────────────────────────────────────────────────
    async def start_session(
        self, classroom_id: UUID, host_id: UUID
    ) -> Tuple[MeetingSession, LiveClassroom]:
        classroom = await self.repo.get_classroom_by_id(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")

        # Check if active session already exists
        existing = await self.repo.get_active_session_for_classroom(classroom_id)
        if existing:
            return existing, classroom

        # Generate unique human-readable session code e.g. lnx-a3b4c5
        session_code = f"lnx-{uuid.uuid4().hex[:6]}"

        session = MeetingSession(
            classroom_id=classroom_id,
            session_code=session_code,
            status=SessionStatus.ACTIVE,
            started_at=datetime.now(timezone.utc),
        )
        session = await self.repo.create_session(session)

        # Update classroom status to LIVE
        await self.repo.update_classroom(classroom_id, {"status": ClassroomStatus.LIVE})

        # Provision Media Room in Media Provider
        await self.media_provider.create_room(
            room_name=session_code, options=classroom.settings
        )

        return session, classroom

    async def end_session(self, session_id: UUID, host_id: UUID) -> MeetingSession:
        session = await self.repo.get_session_by_id(session_id)
        if not session:
            raise ValueError("Session not found")

        ended_session = await self.repo.end_session(session_id)
        await self.repo.update_classroom(
            session.classroom_id, {"status": ClassroomStatus.ENDED}
        )

        # Reconcile Attendance automatically for all participants
        await self.reconcile_attendance(session_id)

        # Broadcast SESSION_ENDED to room via WebSockets
        await ws_manager.publish_event(
            str(session_id),
            {
                "type": "SESSION_ENDED",
                "session_id": str(session_id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        # Tear down media room
        await self.media_provider.end_room(session.session_code)

        return ended_session

    # ─── Join Ticket & Access Control ──────────────────────────────────────────
    async def create_join_ticket(
        self,
        classroom_id: UUID,
        user_id: Optional[UUID],
        user_email: Optional[str],
        display_name: str,
        avatar_url: Optional[str],
    ) -> Dict[str, Any]:
        classroom = await self.repo.get_classroom_by_id(classroom_id)
        if not classroom:
            raise ValueError("Classroom not found")

        # Get or auto-start active session
        session = await self.repo.get_active_session_for_classroom(classroom_id)
        if not session:
            # If scheduled start has arrived or host joins, auto-activate
            if user_id and str(user_id) == str(classroom.instructor_id):
                session, _ = await self.start_session(classroom_id, user_id)
            else:
                # Return scheduled status if not yet live
                raise ValueError("Classroom is not currently live. Please wait for instructor.")

        # Determine Role
        role = ParticipantRole.STUDENT
        if user_id:
            if str(user_id) == str(classroom.instructor_id):
                role = ParticipantRole.HOST
        else:
            role = ParticipantRole.GUEST

        # Waiting room policy
        settings_dict = classroom.settings or {}
        waiting_room_enabled = settings_dict.get("waiting_room_enabled", True)

        admission_status = AdmissionStatus.ADMITTED
        if role in (ParticipantRole.HOST, ParticipantRole.INSTRUCTOR, ParticipantRole.CO_HOST):
            admission_status = AdmissionStatus.ADMITTED
        elif waiting_room_enabled:
            # Check if student was previously admitted
            if user_id:
                p = await self.repo.get_participant(session.id, user_id)
                if p and p.admission_status == AdmissionStatus.ADMITTED:
                    admission_status = AdmissionStatus.ADMITTED
                else:
                    admission_status = AdmissionStatus.WAITING
            else:
                admission_status = AdmissionStatus.WAITING

        # Upsert participant record
        participant = ClassroomParticipant(
            session_id=session.id,
            user_id=user_id,
            display_name=display_name,
            avatar_url=avatar_url,
            role=role,
            admission_status=admission_status,
            joined_at=datetime.now(timezone.utc),
        )
        await self.repo.upsert_participant(participant)

        # Generate Media Token (LiveKit or Dev WebRTC)
        can_publish = role in (ParticipantRole.HOST, ParticipantRole.INSTRUCTOR, ParticipantRole.CO_HOST)
        media_token = await self.media_provider.generate_token(
            room_name=session.session_code,
            participant_id=str(user_id or uuid.uuid4()),
            display_name=display_name,
            role=role.value,
            can_publish=can_publish,
            can_subscribe=True,
        )

        # Sign short-lived HMAC Join Ticket
        expires_at = int(time.time()) + settings.JOIN_TICKET_EXPIRE_SECONDS
        ticket_payload = {
            "ticket_id": str(uuid.uuid4()),
            "classroom_id": str(classroom_id),
            "session_id": str(session.id),
            "session_code": session.session_code,
            "user_id": str(user_id) if user_id else None,
            "display_name": display_name,
            "role": role.value,
            "admission_status": admission_status.value,
            "exp": expires_at,
        }
        ticket = jwt.encode(ticket_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        return {
            "ticket": ticket,
            "classroom_id": classroom_id,
            "session_id": session.id,
            "session_code": session.session_code,
            "user_id": user_id,
            "display_name": display_name,
            "role": role.value,
            "admission_status": admission_status.value,
            "media_token": media_token,
            "media_url": (
                settings.LIVEKIT_URL
                if settings.MEDIA_PROVIDER == "livekit"
                else "webrtc://localhost/api/v1/live/media"
            ),
            "expires_at": datetime.fromtimestamp(expires_at, tz=timezone.utc),
        }

    # ─── Waiting Room Admission ────────────────────────────────────────────────
    async def admit_deny_participants(
        self, session_id: UUID, user_ids: List[UUID], action: str, host_id: UUID
    ) -> int:
        status = AdmissionStatus.ADMITTED if action == "ADMIT" else AdmissionStatus.DENIED
        count = await self.repo.update_participant_admission(session_id, user_ids, status)

        # Notify affected participants via WebSockets
        for uid in user_ids:
            await ws_manager.publish_event(
                str(session_id),
                {
                    "type": "ADMISSION_UPDATE",
                    "user_id": str(uid),
                    "action": action,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
        return count

    # ─── Chat Operations ───────────────────────────────────────────────────────
    async def send_chat_message(
        self,
        session_id: UUID,
        sender_id: UUID,
        sender_name: str,
        sender_role: str,
        data: ChatMessageCreateRequest,
    ) -> ClassroomChatMessage:
        msg = ClassroomChatMessage(
            session_id=session_id,
            sender_id=sender_id,
            sender_name=sender_name,
            sender_role=sender_role,
            message_type=data.message_type,
            recipient_id=data.recipient_id,
            content=data.content,
        )
        saved = await self.repo.create_chat_message(msg)

        # Fanout via WebSocket
        event = {
            "type": "CHAT_MESSAGE",
            "message": {
                "id": str(saved.id),
                "sender_id": str(saved.sender_id),
                "sender_name": saved.sender_name,
                "sender_role": saved.sender_role,
                "message_type": saved.message_type.value,
                "content": saved.content,
                "created_at": saved.created_at.isoformat(),
            },
        }
        await ws_manager.publish_event(str(session_id), event)
        return saved

    # ─── Live Polls Operations ─────────────────────────────────────────────────
    async def create_and_launch_poll(
        self, session_id: UUID, creator_id: UUID, data: PollCreateRequest
    ) -> ClassroomPoll:
        poll = ClassroomPoll(
            session_id=session_id,
            creator_id=creator_id,
            question=data.question,
            poll_type=data.poll_type,
            is_anonymous=data.is_anonymous,
            timer_seconds=data.timer_seconds,
            status="ACTIVE",
        )
        poll = await self.repo.create_poll(poll)

        for opt in data.options:
            option_rec = ClassroomPollOption(
                poll_id=poll.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
            )
            self.db.add(option_rec)
        await self.db.flush()

        # Reload with options
        full_poll = await self.repo.get_poll_by_id(poll.id)

        # Broadcast POLL_LAUNCHED
        event = {
            "type": "POLL_LAUNCHED",
            "poll": {
                "id": str(full_poll.id),
                "question": full_poll.question,
                "poll_type": full_poll.poll_type.value,
                "is_anonymous": full_poll.is_anonymous,
                "timer_seconds": full_poll.timer_seconds,
                "options": [
                    {"id": str(o.id), "option_text": o.option_text}
                    for o in full_poll.options
                ],
            },
        }
        await ws_manager.publish_event(str(session_id), event)
        return full_poll

    async def vote_poll(
        self, poll_id: UUID, user_id: UUID, option_ids: List[UUID]
    ) -> bool:
        poll = await self.repo.get_poll_by_id(poll_id)
        if not poll or poll.status != "ACTIVE":
            raise ValueError("Poll is closed or does not exist")

        for opt_id in option_ids:
            response = ClassroomPollResponse(
                poll_id=poll_id,
                option_id=opt_id,
                user_id=user_id,
            )
            await self.repo.cast_poll_vote(response)

        # Broadcast live vote update
        await ws_manager.publish_event(
            str(poll.session_id),
            {
                "type": "POLL_VOTE_CAST",
                "poll_id": str(poll_id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return True

    async def close_poll(self, poll_id: UUID, user_id: UUID) -> Optional[ClassroomPoll]:
        poll = await self.repo.close_poll(poll_id)
        if poll:
            # Broadcast final poll results
            full_poll = await self.repo.get_poll_by_id(poll_id)
            total_votes = len(full_poll.responses)
            counts: Dict[str, int] = {}
            for r in full_poll.responses:
                counts[str(r.option_id)] = counts.get(str(r.option_id), 0) + 1

            event = {
                "type": "POLL_CLOSED",
                "poll_id": str(poll_id),
                "total_votes": total_votes,
                "option_counts": counts,
            }
            await ws_manager.publish_event(str(poll.session_id), event)
        return poll

    # ─── Q&A Hub Operations ────────────────────────────────────────────────────
    async def create_qna(
        self,
        session_id: UUID,
        asker_id: UUID,
        asker_name: str,
        data: QnAQuestionCreateRequest,
    ) -> ClassroomQnAQuestion:
        q = ClassroomQnAQuestion(
            session_id=session_id,
            asker_id=asker_id,
            asker_name=asker_name,
            question=data.question,
        )
        saved = await self.repo.create_qna_question(q)

        # Broadcast QNA_NEW
        await ws_manager.publish_event(
            str(session_id),
            {
                "type": "QNA_NEW",
                "question": {
                    "id": str(saved.id),
                    "asker_id": str(saved.asker_id),
                    "asker_name": saved.asker_name,
                    "question": saved.question,
                    "upvotes": saved.upvotes,
                    "created_at": saved.created_at.isoformat(),
                },
            },
        )
        return saved

    async def upvote_qna(self, question_id: UUID, user_id: UUID) -> Optional[ClassroomQnAQuestion]:
        q = await self.repo.upvote_qna_question(question_id)
        if q:
            await ws_manager.publish_event(
                str(q.session_id),
                {
                    "type": "QNA_UPVOTED",
                    "question_id": str(question_id),
                    "upvotes": q.upvotes,
                },
            )
        return q

    async def answer_qna(
        self, question_id: UUID, answer: str, answered_by: UUID, answered_by_name: str
    ) -> Optional[ClassroomQnAQuestion]:
        q = await self.repo.answer_qna_question(
            question_id=question_id,
            answer=answer,
            answered_by=answered_by,
            answered_by_name=answered_by_name,
        )
        if q:
            await ws_manager.publish_event(
                str(q.session_id),
                {
                    "type": "QNA_ANSWERED",
                    "question_id": str(question_id),
                    "answer_text": q.answer_text,
                    "answered_by_name": q.answered_by_name,
                },
            )
        return q

    # ─── Attendance Automated Reconciliation ───────────────────────────────────
    async def reconcile_attendance(self, session_id: UUID) -> List[AttendanceRecord]:
        session = await self.repo.get_session_by_id(session_id)
        if not session:
            return []

        session_duration = 0
        if session.started_at:
            end_t = session.ended_at or datetime.now(timezone.utc)
            session_duration = max(60, int((end_t - session.started_at).total_seconds()))

        participants = await self.repo.list_participants(
            session_id, admission_status=AdmissionStatus.ADMITTED
        )
        records: List[AttendanceRecord] = []

        for p in participants:
            if not p.user_id or p.role in (ParticipantRole.HOST, ParticipantRole.INSTRUCTOR):
                continue  # Skip hosts / guest accounts without LMS ID

            total_sec = p.total_seconds
            # If participant was still active at session end
            if p.joined_at and not p.left_at and session.ended_at:
                delta = int((session.ended_at - p.joined_at).total_seconds())
                total_sec += max(0, delta)

            pct = min(100.0, round((total_sec / session_duration) * 100.0, 1))

            status = AttendanceStatus.ABSENT
            if pct >= settings.ATTENDANCE_MIN_PERCENTAGE_PRESENT:
                status = AttendanceStatus.PRESENT
            elif pct >= settings.ATTENDANCE_MIN_PERCENTAGE_LATE:
                status = AttendanceStatus.LATE
            elif pct > 10.0:
                status = AttendanceStatus.PARTIAL

            rec = AttendanceRecord(
                session_id=session_id,
                user_id=p.user_id,
                course_id=session.classroom.course_id if session.classroom else None,
                first_join_at=p.joined_at,
                last_leave_at=p.left_at or (session.ended_at or datetime.now(timezone.utc)),
                total_seconds=total_sec,
                attendance_percentage=pct,
                status=status,
                reconciled_at=datetime.now(timezone.utc),
            )
            saved = await self.repo.save_attendance_record(rec)
            records.append(saved)

        return records
