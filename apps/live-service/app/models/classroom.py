import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.base import Base


class ClassroomStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    ENDED = "ENDED"
    CANCELLED = "CANCELLED"


class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"


class ParticipantRole(str, enum.Enum):
    HOST = "HOST"
    INSTRUCTOR = "INSTRUCTOR"
    CO_HOST = "CO_HOST"
    TA = "TA"
    STUDENT = "STUDENT"
    GUEST = "GUEST"


class AdmissionStatus(str, enum.Enum):
    WAITING = "WAITING"
    ADMITTED = "ADMITTED"
    DENIED = "DENIED"
    REMOVED = "REMOVED"
    LEFT = "LEFT"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    PARTIAL = "PARTIAL"
    ABSENT = "ABSENT"


class ChatMessageType(str, enum.Enum):
    PUBLIC = "PUBLIC"
    ANNOUNCEMENT = "ANNOUNCEMENT"
    DIRECT = "DIRECT"
    SYSTEM = "SYSTEM"


class PollType(str, enum.Enum):
    SINGLE_CHOICE = "SINGLE_CHOICE"
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    YES_NO = "YES_NO"


class PollStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class RecordingStatus(str, enum.Enum):
    NONE = "NONE"
    RECORDING = "RECORDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class LiveClassroom(Base):
    __tablename__ = "live_classrooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    lesson_id = Column(UUID(as_uuid=True), nullable=True, unique=True, index=True)
    instructor_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_start = Column(DateTime(timezone=True), nullable=True)
    scheduled_end = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        Enum(ClassroomStatus, native_enum=False),
        default=ClassroomStatus.SCHEDULED,
        nullable=False,
    )

    settings = Column(
        JSON,
        default=lambda: {
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
        },
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sessions = relationship("MeetingSession", back_populates="classroom", cascade="all, delete-orphan")


class MeetingSession(Base):
    __tablename__ = "meeting_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id = Column(
        UUID(as_uuid=True),
        ForeignKey("live_classrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_code = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(
        Enum(SessionStatus, native_enum=False),
        default=SessionStatus.ACTIVE,
        nullable=False,
    )
    started_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    ended_at = Column(DateTime(timezone=True), nullable=True)
    peak_participants = Column(Integer, default=0, nullable=False)

    recording_url = Column(String(500), nullable=True)
    recording_status = Column(
        Enum(RecordingStatus, native_enum=False),
        default=RecordingStatus.NONE,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    classroom = relationship("LiveClassroom", back_populates="sessions")
    participants = relationship("ClassroomParticipant", back_populates="session", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")
    chat_messages = relationship("ClassroomChatMessage", back_populates="session", cascade="all, delete-orphan")
    polls = relationship("ClassroomPoll", back_populates="session", cascade="all, delete-orphan")
    qna_questions = relationship("ClassroomQnAQuestion", back_populates="session", cascade="all, delete-orphan")
    whiteboard_snapshots = relationship("ClassroomWhiteboardSnapshot", back_populates="session", cascade="all, delete-orphan")


class ClassroomParticipant(Base):
    __tablename__ = "classroom_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    display_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(
        Enum(ParticipantRole, native_enum=False),
        default=ParticipantRole.STUDENT,
        nullable=False,
    )
    admission_status = Column(
        Enum(AdmissionStatus, native_enum=False),
        default=AdmissionStatus.WAITING,
        nullable=False,
    )
    joined_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    left_at = Column(DateTime(timezone=True), nullable=True)
    total_seconds = Column(Integer, default=0, nullable=False)
    hand_raised = Column(Boolean, default=False, nullable=False)
    is_muted = Column(Boolean, default=False, nullable=False)

    session = relationship("MeetingSession", back_populates="participants")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "user_id", name="uq_session_user_attendance"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    first_join_at = Column(DateTime(timezone=True), nullable=False)
    last_leave_at = Column(DateTime(timezone=True), nullable=False)
    total_seconds = Column(Integer, default=0, nullable=False)
    attendance_percentage = Column(Float, default=0.0, nullable=False)
    status = Column(
        Enum(AttendanceStatus, native_enum=False),
        default=AttendanceStatus.PRESENT,
        nullable=False,
    )
    reconciled_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    session = relationship("MeetingSession", back_populates="attendance_records")


class ClassroomChatMessage(Base):
    __tablename__ = "classroom_chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    sender_name = Column(String(150), nullable=False)
    sender_role = Column(String(50), default="STUDENT", nullable=False)
    message_type = Column(
        Enum(ChatMessageType, native_enum=False),
        default=ChatMessageType.PUBLIC,
        nullable=False,
    )
    recipient_id = Column(UUID(as_uuid=True), nullable=True)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    session = relationship("MeetingSession", back_populates="chat_messages")


class ClassroomPoll(Base):
    __tablename__ = "classroom_polls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    creator_id = Column(UUID(as_uuid=True), nullable=False)
    question = Column(Text, nullable=False)
    poll_type = Column(
        Enum(PollType, native_enum=False),
        default=PollType.SINGLE_CHOICE,
        nullable=False,
    )
    is_anonymous = Column(Boolean, default=False, nullable=False)
    status = Column(
        Enum(PollStatus, native_enum=False),
        default=PollStatus.ACTIVE,
        nullable=False,
    )
    timer_seconds = Column(Integer, default=60, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    closed_at = Column(DateTime(timezone=True), nullable=True)

    session = relationship("MeetingSession", back_populates="polls")
    options = relationship("ClassroomPollOption", back_populates="poll", cascade="all, delete-orphan")
    responses = relationship("ClassroomPollResponse", back_populates="poll", cascade="all, delete-orphan")


class ClassroomPollOption(Base):
    __tablename__ = "classroom_poll_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(
        UUID(as_uuid=True),
        ForeignKey("classroom_polls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    option_text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    poll = relationship("ClassroomPoll", back_populates="options")
    responses = relationship("ClassroomPollResponse", back_populates="option", cascade="all, delete-orphan")


class ClassroomPollResponse(Base):
    __tablename__ = "classroom_poll_responses"
    __table_args__ = (
        UniqueConstraint("poll_id", "user_id", name="uq_poll_user_response"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(
        UUID(as_uuid=True),
        ForeignKey("classroom_polls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    option_id = Column(
        UUID(as_uuid=True),
        ForeignKey("classroom_poll_options.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    poll = relationship("ClassroomPoll", back_populates="responses")
    option = relationship("ClassroomPollOption", back_populates="responses")


class ClassroomQnAQuestion(Base):
    __tablename__ = "classroom_qna_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asker_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    asker_name = Column(String(150), nullable=False)
    question = Column(Text, nullable=False)
    upvotes = Column(Integer, default=0, nullable=False)
    is_answered = Column(Boolean, default=False, nullable=False)
    answer_text = Column(Text, nullable=True)
    answered_by = Column(UUID(as_uuid=True), nullable=True)
    answered_by_name = Column(String(150), nullable=True)
    is_hidden = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )

    session = relationship("MeetingSession", back_populates="qna_questions")


class ClassroomWhiteboardSnapshot(Base):
    __tablename__ = "classroom_whiteboard_snapshots"
    __table_args__ = (
        UniqueConstraint("session_id", "page_number", name="uq_session_whiteboard_page"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    page_number = Column(Integer, default=1, nullable=False)
    canvas_data = Column(JSON, default=dict, nullable=False)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = relationship("MeetingSession", back_populates="whiteboard_snapshots")
