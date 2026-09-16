from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import and_, delete, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    AdmissionStatus,
    AttendanceStatus,
)


class ClassroomRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Classroom CRUD ────────────────────────────────────────────────────────
    async def create_classroom(self, classroom: LiveClassroom) -> LiveClassroom:
        self.db.add(classroom)
        await self.db.flush()
        await self.db.refresh(classroom)
        return classroom

    async def get_classroom_by_id(self, classroom_id: UUID) -> Optional[LiveClassroom]:
        stmt = (
            select(LiveClassroom)
            .options(selectinload(LiveClassroom.sessions))
            .where(LiveClassroom.id == classroom_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_classroom_by_lesson_id(self, lesson_id: UUID) -> Optional[LiveClassroom]:
        stmt = (
            select(LiveClassroom)
            .options(selectinload(LiveClassroom.sessions))
            .where(LiveClassroom.lesson_id == lesson_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_classrooms(
        self,
        institution_id: Optional[UUID] = None,
        course_id: Optional[UUID] = None,
        instructor_id: Optional[UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[LiveClassroom], int]:
        stmt = select(LiveClassroom).options(selectinload(LiveClassroom.sessions))
        count_stmt = select(func.count(LiveClassroom.id))

        filters = []
        if institution_id:
            filters.append(LiveClassroom.institution_id == institution_id)
        if course_id:
            filters.append(LiveClassroom.course_id == course_id)
        if instructor_id:
            filters.append(LiveClassroom.instructor_id == instructor_id)
        if status:
            filters.append(LiveClassroom.status == status)

        if filters:
            stmt = stmt.where(and_(*filters))
            count_stmt = count_stmt.where(and_(*filters))

        stmt = stmt.order_by(desc(LiveClassroom.created_at)).offset(skip).limit(limit)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        res = await self.db.execute(stmt)
        items = list(res.scalars().all())
        return items, total

    async def update_classroom(self, classroom_id: UUID, values: Dict[str, Any]) -> Optional[LiveClassroom]:
        values["updated_at"] = datetime.now(timezone.utc)
        stmt = (
            update(LiveClassroom)
            .where(LiveClassroom.id == classroom_id)
            .values(**values)
            .returning(LiveClassroom)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.scalar_one_or_none()

    # ─── Meeting Session Management ───────────────────────────────────────────
    async def create_session(self, session: MeetingSession) -> MeetingSession:
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get_session_by_id(self, session_id: UUID) -> Optional[MeetingSession]:
        stmt = (
            select(MeetingSession)
            .options(
                selectinload(MeetingSession.classroom),
                selectinload(MeetingSession.participants),
            )
            .where(MeetingSession.id == session_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_session_by_code(self, session_code: str) -> Optional[MeetingSession]:
        stmt = (
            select(MeetingSession)
            .options(
                selectinload(MeetingSession.classroom),
                selectinload(MeetingSession.participants),
            )
            .where(MeetingSession.session_code == session_code)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_session_for_classroom(self, classroom_id: UUID) -> Optional[MeetingSession]:
        stmt = (
            select(MeetingSession)
            .where(
                and_(
                    MeetingSession.classroom_id == classroom_id,
                    MeetingSession.status == SessionStatus.ACTIVE,
                )
            )
            .order_by(desc(MeetingSession.started_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def end_session(self, session_id: UUID) -> Optional[MeetingSession]:
        now = datetime.now(timezone.utc)
        stmt = (
            update(MeetingSession)
            .where(MeetingSession.id == session_id)
            .values(status=SessionStatus.ENDED, ended_at=now)
            .returning(MeetingSession)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.scalar_one_or_none()

    async def update_session_peak(self, session_id: UUID, current_count: int) -> None:
        stmt = (
            update(MeetingSession)
            .where(
                and_(
                    MeetingSession.id == session_id,
                    MeetingSession.peak_participants < current_count,
                )
            )
            .values(peak_participants=current_count)
        )
        await self.db.execute(stmt)
        await self.db.flush()

    # ─── Participant Tracking ──────────────────────────────────────────────────
    async def get_participant(self, session_id: UUID, user_id: UUID) -> Optional[ClassroomParticipant]:
        stmt = select(ClassroomParticipant).where(
            and_(
                ClassroomParticipant.session_id == session_id,
                ClassroomParticipant.user_id == user_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_participant(self, participant: ClassroomParticipant) -> ClassroomParticipant:
        existing = None
        if participant.user_id:
            existing = await self.get_participant(participant.session_id, participant.user_id)

        if existing:
            existing.admission_status = participant.admission_status
            existing.display_name = participant.display_name
            existing.role = participant.role
            existing.left_at = None
            await self.db.flush()
            return existing
        else:
            self.db.add(participant)
            await self.db.flush()
            await self.db.refresh(participant)
            return participant

    async def list_participants(
        self, session_id: UUID, admission_status: Optional[str] = None
    ) -> List[ClassroomParticipant]:
        stmt = select(ClassroomParticipant).where(ClassroomParticipant.session_id == session_id)
        if admission_status:
            stmt = stmt.where(ClassroomParticipant.admission_status == admission_status)
        stmt = stmt.order_by(ClassroomParticipant.joined_at)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_participant_admission(
        self, session_id: UUID, user_ids: List[UUID], status: AdmissionStatus
    ) -> int:
        stmt = (
            update(ClassroomParticipant)
            .where(
                and_(
                    ClassroomParticipant.session_id == session_id,
                    ClassroomParticipant.user_id.in_(user_ids),
                )
            )
            .values(admission_status=status)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount

    async def set_hand_raised(self, session_id: UUID, user_id: UUID, raised: bool) -> None:
        stmt = (
            update(ClassroomParticipant)
            .where(
                and_(
                    ClassroomParticipant.session_id == session_id,
                    ClassroomParticipant.user_id == user_id,
                )
            )
            .values(hand_raised=raised)
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def record_participant_leave(self, session_id: UUID, user_id: UUID) -> None:
        now = datetime.now(timezone.utc)
        stmt = select(ClassroomParticipant).where(
            and_(
                ClassroomParticipant.session_id == session_id,
                ClassroomParticipant.user_id == user_id,
            )
        )
        res = await self.db.execute(stmt)
        p = res.scalar_one_or_none()
        if p and p.joined_at:
            delta = int((now - p.joined_at).total_seconds())
            p.total_seconds = (p.total_seconds or 0) + max(0, delta)
            p.left_at = now
            await self.db.flush()

    # ─── Chat Messages ─────────────────────────────────────────────────────────
    async def create_chat_message(self, message: ClassroomChatMessage) -> ClassroomChatMessage:
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_session_messages(
        self, session_id: UUID, limit: int = 100
    ) -> List[ClassroomChatMessage]:
        stmt = (
            select(ClassroomChatMessage)
            .where(
                and_(
                    ClassroomChatMessage.session_id == session_id,
                    ClassroomChatMessage.is_deleted == False,
                )
            )
            .order_by(ClassroomChatMessage.created_at.asc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_chat_message(self, message_id: UUID) -> bool:
        stmt = (
            update(ClassroomChatMessage)
            .where(ClassroomChatMessage.id == message_id)
            .values(is_deleted=True)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount > 0

    # ─── Polls Engine ──────────────────────────────────────────────────────────
    async def create_poll(self, poll: ClassroomPoll) -> ClassroomPoll:
        self.db.add(poll)
        await self.db.flush()
        await self.db.refresh(poll)
        return poll

    async def get_poll_by_id(self, poll_id: UUID) -> Optional[ClassroomPoll]:
        stmt = (
            select(ClassroomPoll)
            .options(
                selectinload(ClassroomPoll.options),
                selectinload(ClassroomPoll.responses),
            )
            .where(ClassroomPoll.id == poll_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_session_polls(self, session_id: UUID) -> List[ClassroomPoll]:
        stmt = (
            select(ClassroomPoll)
            .options(
                selectinload(ClassroomPoll.options),
                selectinload(ClassroomPoll.responses),
            )
            .where(ClassroomPoll.session_id == session_id)
            .order_by(desc(ClassroomPoll.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def cast_poll_vote(self, response: ClassroomPollResponse) -> ClassroomPollResponse:
        self.db.add(response)
        await self.db.flush()
        await self.db.refresh(response)
        return response

    async def close_poll(self, poll_id: UUID) -> Optional[ClassroomPoll]:
        now = datetime.now(timezone.utc)
        stmt = (
            update(ClassroomPoll)
            .where(ClassroomPoll.id == poll_id)
            .values(status="CLOSED", closed_at=now)
            .returning(ClassroomPoll)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.scalar_one_or_none()

    # ─── Q&A Hub ───────────────────────────────────────────────────────────────
    async def create_qna_question(self, question: ClassroomQnAQuestion) -> ClassroomQnAQuestion:
        self.db.add(question)
        await self.db.flush()
        await self.db.refresh(question)
        return question

    async def get_qna_question_by_id(self, question_id: UUID) -> Optional[ClassroomQnAQuestion]:
        stmt = select(ClassroomQnAQuestion).where(ClassroomQnAQuestion.id == question_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_session_qna(self, session_id: UUID) -> List[ClassroomQnAQuestion]:
        stmt = (
            select(ClassroomQnAQuestion)
            .where(
                and_(
                    ClassroomQnAQuestion.session_id == session_id,
                    ClassroomQnAQuestion.is_hidden == False,
                )
            )
            .order_by(desc(ClassroomQnAQuestion.upvotes), desc(ClassroomQnAQuestion.created_at))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def upvote_qna_question(self, question_id: UUID) -> Optional[ClassroomQnAQuestion]:
        stmt = (
            update(ClassroomQnAQuestion)
            .where(ClassroomQnAQuestion.id == question_id)
            .values(upvotes=ClassroomQnAQuestion.upvotes + 1)
            .returning(ClassroomQnAQuestion)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.scalar_one_or_none()

    async def answer_qna_question(
        self, question_id: UUID, answer: str, answered_by: UUID, answered_by_name: str
    ) -> Optional[ClassroomQnAQuestion]:
        stmt = (
            update(ClassroomQnAQuestion)
            .where(ClassroomQnAQuestion.id == question_id)
            .values(
                is_answered=True,
                answer_text=answer,
                answered_by=answered_by,
                answered_by_name=answered_by_name,
            )
            .returning(ClassroomQnAQuestion)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.scalar_one_or_none()

    # ─── Whiteboard Snapshots ──────────────────────────────────────────────────
    async def save_whiteboard_snapshot(
        self, session_id: UUID, page_number: int, canvas_data: Dict[str, Any], user_id: Optional[UUID]
    ) -> ClassroomWhiteboardSnapshot:
        stmt = select(ClassroomWhiteboardSnapshot).where(
            and_(
                ClassroomWhiteboardSnapshot.session_id == session_id,
                ClassroomWhiteboardSnapshot.page_number == page_number,
            )
        )
        res = await self.db.execute(stmt)
        snap = res.scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if snap:
            snap.canvas_data = canvas_data
            snap.updated_by = user_id
            snap.updated_at = now
            await self.db.flush()
            return snap
        else:
            snap = ClassroomWhiteboardSnapshot(
                session_id=session_id,
                page_number=page_number,
                canvas_data=canvas_data,
                updated_by=user_id,
                updated_at=now,
            )
            self.db.add(snap)
            await self.db.flush()
            await self.db.refresh(snap)
            return snap

    async def get_whiteboard_snapshot(
        self, session_id: UUID, page_number: int
    ) -> Optional[ClassroomWhiteboardSnapshot]:
        stmt = select(ClassroomWhiteboardSnapshot).where(
            and_(
                ClassroomWhiteboardSnapshot.session_id == session_id,
                ClassroomWhiteboardSnapshot.page_number == page_number,
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    # ─── Attendance Reconciliation ─────────────────────────────────────────────
    async def save_attendance_record(self, record: AttendanceRecord) -> AttendanceRecord:
        stmt = select(AttendanceRecord).where(
            and_(
                AttendanceRecord.session_id == record.session_id,
                AttendanceRecord.user_id == record.user_id,
            )
        )
        res = await self.db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            existing.last_leave_at = record.last_leave_at
            existing.total_seconds = record.total_seconds
            existing.attendance_percentage = record.attendance_percentage
            existing.status = record.status
            existing.reconciled_at = datetime.now(timezone.utc)
            await self.db.flush()
            return existing
        else:
            self.db.add(record)
            await self.db.flush()
            await self.db.refresh(record)
            return record

    async def list_session_attendance(self, session_id: UUID) -> List[AttendanceRecord]:
        stmt = (
            select(AttendanceRecord)
            .where(AttendanceRecord.session_id == session_id)
            .order_by(desc(AttendanceRecord.total_seconds))
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
