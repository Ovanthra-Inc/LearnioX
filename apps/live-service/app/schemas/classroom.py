from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ClassroomSettingsSchema(BaseModel):
    waiting_room_enabled: bool = True
    chat_enabled: bool = True
    qna_enabled: bool = True
    polls_enabled: bool = True
    whiteboard_enabled: bool = True
    allow_student_mic: bool = False
    allow_student_camera: bool = False
    allow_student_screen: bool = False
    auto_record: bool = False
    guest_allowed: bool = False


class ClassroomCreateRequest(BaseModel):
    institution_id: UUID
    course_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    settings: Optional[ClassroomSettingsSchema] = None


class ClassroomUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    settings: Optional[ClassroomSettingsSchema] = None
    status: Optional[str] = None


class LiveClassroomResponse(BaseModel):
    id: UUID
    institution_id: UUID
    course_id: Optional[UUID] = None
    lesson_id: Optional[UUID] = None
    instructor_id: UUID
    title: str
    description: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: str
    settings: Dict[str, Any]
    active_session_id: Optional[UUID] = None
    active_session_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MeetingSessionResponse(BaseModel):
    id: UUID
    classroom_id: UUID
    session_code: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    peak_participants: int
    recording_url: Optional[str] = None
    recording_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class JoinTicketRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class JoinTicketResponse(BaseModel):
    ticket: str
    classroom_id: UUID
    session_id: UUID
    session_code: str
    user_id: Optional[UUID] = None
    display_name: str
    role: str
    admission_status: str  # WAITING or ADMITTED
    media_token: str
    media_url: str
    expires_at: datetime


class ParticipantResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    display_name: str
    avatar_url: Optional[str] = None
    role: str
    admission_status: str
    joined_at: datetime
    total_seconds: int
    hand_raised: bool
    is_muted: bool

    class Config:
        from_attributes = True


class AdmitDenyRequest(BaseModel):
    user_ids: List[UUID]
    action: str = Field(..., pattern="^(ADMIT|DENY)$")


class ChatMessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: str = "PUBLIC"  # PUBLIC | ANNOUNCEMENT | DIRECT
    recipient_id: Optional[UUID] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    sender_id: UUID
    sender_name: str
    sender_role: str
    message_type: str
    recipient_id: Optional[UUID] = None
    content: str
    is_pinned: bool
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PollOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=255)
    is_correct: bool = False


class PollCreateRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    poll_type: str = "SINGLE_CHOICE"  # SINGLE_CHOICE | MULTIPLE_CHOICE | YES_NO
    is_anonymous: bool = False
    timer_seconds: int = 60
    options: List[PollOptionCreate] = Field(..., min_length=2, max_length=8)


class PollVoteRequest(BaseModel):
    option_ids: List[UUID]


class PollOptionResponse(BaseModel):
    id: UUID
    option_text: str
    is_correct: Optional[bool] = None
    vote_count: int = 0
    vote_percentage: float = 0.0

    class Config:
        from_attributes = True


class PollResponse(BaseModel):
    id: UUID
    session_id: UUID
    creator_id: UUID
    question: str
    poll_type: str
    is_anonymous: bool
    status: str
    timer_seconds: int
    total_votes: int = 0
    has_voted: bool = False
    user_voted_option_ids: List[UUID] = []
    options: List[PollOptionResponse]
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QnAQuestionCreateRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=1000)


class QnAAnswerRequest(BaseModel):
    answer_text: str = Field(..., min_length=1, max_length=3000)


class QnAQuestionResponse(BaseModel):
    id: UUID
    session_id: UUID
    asker_id: UUID
    asker_name: str
    question: str
    upvotes: int
    has_upvoted: bool = False
    is_answered: bool
    answer_text: Optional[str] = None
    answered_by: Optional[UUID] = None
    answered_by_name: Optional[str] = None
    is_hidden: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WhiteboardSnapshotResponse(BaseModel):
    page_number: int
    canvas_data: Dict[str, Any]
    updated_at: datetime


class AttendanceRecordResponse(BaseModel):
    id: UUID
    user_id: UUID
    first_join_at: datetime
    last_leave_at: datetime
    total_seconds: int
    attendance_percentage: float
    status: str
    reconciled_at: datetime

    class Config:
        from_attributes = True
