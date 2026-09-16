from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_classroom_service, get_current_user_id, require_user_id
from app.schemas.classroom import (
    ClassroomCreateRequest,
    ClassroomUpdateRequest,
    LiveClassroomResponse,
    MeetingSessionResponse,
    JoinTicketRequest,
    JoinTicketResponse,
    ParticipantResponse,
    AdmitDenyRequest,
    ChatMessageCreateRequest,
    ChatMessageResponse,
    PollCreateRequest,
    PollVoteRequest,
    PollResponse,
    QnAQuestionCreateRequest,
    QnAAnswerRequest,
    QnAQuestionResponse,
    WhiteboardSnapshotResponse,
    AttendanceRecordResponse,
)
from app.services.classroom_service import ClassroomService

router = APIRouter()


# ─── Classroom Management ──────────────────────────────────────────────────────
@router.post("/classrooms", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_classroom(
    data: ClassroomCreateRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    classroom = await service.create_classroom(data, instructor_id=user_id)
    return {
        "success": True,
        "message": "Live classroom created successfully",
        "data": LiveClassroomResponse.model_validate(classroom),
        "error": None,
    }


@router.get("/classrooms", response_model=Dict[str, Any])
async def list_classrooms(
    institution_id: Optional[UUID] = None,
    course_id: Optional[UUID] = None,
    instructor_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: ClassroomService = Depends(get_classroom_service),
):
    classrooms, total = await service.list_classrooms(
        institution_id=institution_id,
        course_id=course_id,
        instructor_id=instructor_id,
        status=status,
        skip=skip,
        limit=limit,
    )
    return {
        "success": True,
        "message": "Classrooms retrieved successfully",
        "data": {
            "total": total,
            "items": [LiveClassroomResponse.model_validate(c) for c in classrooms],
        },
        "error": None,
    }


@router.get("/classrooms/{classroom_id}", response_model=Dict[str, Any])
async def get_classroom(
    classroom_id: UUID,
    service: ClassroomService = Depends(get_classroom_service),
):
    classroom = await service.get_classroom(classroom_id)
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Classroom not found", "data": None, "error": {"code": "NOT_FOUND"}},
        )
    return {
        "success": True,
        "message": "Classroom details retrieved",
        "data": LiveClassroomResponse.model_validate(classroom),
        "error": None,
    }


@router.patch("/classrooms/{classroom_id}", response_model=Dict[str, Any])
async def update_classroom(
    classroom_id: UUID,
    data: ClassroomUpdateRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    updated = await service.update_classroom(classroom_id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "Classroom not found", "data": None, "error": {"code": "NOT_FOUND"}},
        )
    return {
        "success": True,
        "message": "Classroom updated successfully",
        "data": LiveClassroomResponse.model_validate(updated),
        "error": None,
    }


# ─── Meeting Session Lifecycle ─────────────────────────────────────────────────
@router.post("/classrooms/{classroom_id}/start", response_model=Dict[str, Any])
async def start_session(
    classroom_id: UUID,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    try:
        session, classroom = await service.start_session(classroom_id, host_id=user_id)
        return {
            "success": True,
            "message": "Live meeting session started",
            "data": MeetingSessionResponse.model_validate(session),
            "error": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e), "data": None, "error": {"code": "START_SESSION_FAILED"}},
        )


@router.post("/sessions/{session_id}/end", response_model=Dict[str, Any])
async def end_session(
    session_id: UUID,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    try:
        session = await service.end_session(session_id, host_id=user_id)
        return {
            "success": True,
            "message": "Live meeting session ended and attendance reconciled",
            "data": MeetingSessionResponse.model_validate(session),
            "error": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e), "data": None, "error": {"code": "END_SESSION_FAILED"}},
        )


# ─── Join Ticket & Media Access ────────────────────────────────────────────────
@router.post("/classrooms/{classroom_id}/join-ticket", response_model=Dict[str, Any])
async def create_join_ticket(
    classroom_id: UUID,
    data: JoinTicketRequest,
    user_id: Optional[UUID] = Depends(get_current_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    display_name = data.display_name or (f"Student-{str(user_id)[:6]}" if user_id else "Guest Learner")
    try:
        ticket_data = await service.create_join_ticket(
            classroom_id=classroom_id,
            user_id=user_id,
            user_email=None,
            display_name=display_name,
            avatar_url=data.avatar_url,
        )
        return {
            "success": True,
            "message": "Join ticket issued successfully",
            "data": ticket_data,
            "error": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e), "data": None, "error": {"code": "JOIN_TICKET_ERROR"}},
        )


# ─── Participant & Waiting Room Moderation ─────────────────────────────────────
@router.get("/sessions/{session_id}/participants", response_model=Dict[str, Any])
async def list_participants(
    session_id: UUID,
    admission_status: Optional[str] = None,
    service: ClassroomService = Depends(get_classroom_service),
):
    participants = await service.repo.list_participants(session_id, admission_status=admission_status)
    return {
        "success": True,
        "message": "Participants retrieved",
        "data": {
            "total": len(participants),
            "items": [ParticipantResponse.model_validate(p) for p in participants],
        },
        "error": None,
    }


@router.post("/sessions/{session_id}/admit", response_model=Dict[str, Any])
async def admit_deny_participants(
    session_id: UUID,
    data: AdmitDenyRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    count = await service.admit_deny_participants(
        session_id=session_id,
        user_ids=data.user_ids,
        action=data.action,
        host_id=user_id,
    )
    return {
        "success": True,
        "message": f"Successfully processed {count} participant(s) with action {data.action}",
        "data": {"count": count},
        "error": None,
    }


# ─── Chat System ───────────────────────────────────────────────────────────────
@router.get("/sessions/{session_id}/chat", response_model=Dict[str, Any])
async def get_chat_history(
    session_id: UUID,
    limit: int = Query(100, ge=1, le=200),
    service: ClassroomService = Depends(get_classroom_service),
):
    messages = await service.repo.get_session_messages(session_id, limit=limit)
    return {
        "success": True,
        "message": "Chat messages retrieved",
        "data": {
            "items": [ChatMessageResponse.model_validate(m) for m in messages],
        },
        "error": None,
    }


@router.post("/sessions/{session_id}/chat", response_model=Dict[str, Any])
async def send_chat_message(
    session_id: UUID,
    data: ChatMessageCreateRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    msg = await service.send_chat_message(
        session_id=session_id,
        sender_id=user_id,
        sender_name=f"User-{str(user_id)[:6]}",
        sender_role="STUDENT",
        data=data,
    )
    return {
        "success": True,
        "message": "Chat message sent",
        "data": ChatMessageResponse.model_validate(msg),
        "error": None,
    }


# ─── Polls Engine ──────────────────────────────────────────────────────────────
@router.get("/sessions/{session_id}/polls", response_model=Dict[str, Any])
async def list_polls(
    session_id: UUID,
    user_id: Optional[UUID] = Depends(get_current_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    polls = await service.repo.list_session_polls(session_id)
    items = []
    for p in polls:
        total_votes = len(p.responses)
        counts: Dict[UUID, int] = {}
        user_voted: List[UUID] = []
        for r in p.responses:
            counts[r.option_id] = counts.get(r.option_id, 0) + 1
            if user_id and r.user_id == user_id:
                user_voted.append(r.option_id)

        opts = []
        for o in p.options:
            vc = counts.get(o.id, 0)
            pct = round((vc / total_votes) * 100, 1) if total_votes > 0 else 0.0
            opts.append(
                {
                    "id": o.id,
                    "option_text": o.option_text,
                    "is_correct": o.is_correct if p.status == "CLOSED" else None,
                    "vote_count": vc,
                    "vote_percentage": pct,
                }
            )

        items.append(
            {
                "id": p.id,
                "session_id": p.session_id,
                "creator_id": p.creator_id,
                "question": p.question,
                "poll_type": p.poll_type.value,
                "is_anonymous": p.is_anonymous,
                "status": p.status.value,
                "timer_seconds": p.timer_seconds,
                "total_votes": total_votes,
                "has_voted": len(user_voted) > 0,
                "user_voted_option_ids": user_voted,
                "options": opts,
                "created_at": p.created_at,
                "closed_at": p.closed_at,
            }
        )
    return {
        "success": True,
        "message": "Polls retrieved",
        "data": {"items": items},
        "error": None,
    }


@router.post("/sessions/{session_id}/polls", response_model=Dict[str, Any])
async def create_poll(
    session_id: UUID,
    data: PollCreateRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    poll = await service.create_and_launch_poll(session_id, creator_id=user_id, data=data)
    return {
        "success": True,
        "message": "Poll launched successfully",
        "data": {"poll_id": str(poll.id)},
        "error": None,
    }


@router.post("/polls/{poll_id}/vote", response_model=Dict[str, Any])
async def vote_poll(
    poll_id: UUID,
    data: PollVoteRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    try:
        await service.vote_poll(poll_id, user_id=user_id, option_ids=data.option_ids)
        return {
            "success": True,
            "message": "Vote recorded",
            "data": {"success": True},
            "error": None,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": str(e), "data": None, "error": {"code": "POLL_VOTE_ERROR"}},
        )


@router.post("/polls/{poll_id}/close", response_model=Dict[str, Any])
async def close_poll(
    poll_id: UUID,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    closed = await service.close_poll(poll_id, user_id=user_id)
    return {
        "success": True,
        "message": "Poll closed",
        "data": {"poll_id": str(poll_id)},
        "error": None,
    }


# ─── Q&A Hub ───────────────────────────────────────────────────────────────────
@router.get("/sessions/{session_id}/qna", response_model=Dict[str, Any])
async def list_qna(
    session_id: UUID,
    service: ClassroomService = Depends(get_classroom_service),
):
    questions = await service.repo.list_session_qna(session_id)
    return {
        "success": True,
        "message": "Q&A questions retrieved",
        "data": {
            "items": [QnAQuestionResponse.model_validate(q) for q in questions],
        },
        "error": None,
    }


@router.post("/sessions/{session_id}/qna", response_model=Dict[str, Any])
async def ask_question(
    session_id: UUID,
    data: QnAQuestionCreateRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    q = await service.create_qna(
        session_id=session_id,
        asker_id=user_id,
        asker_name=f"Learner-{str(user_id)[:6]}",
        data=data,
    )
    return {
        "success": True,
        "message": "Question posted",
        "data": QnAQuestionResponse.model_validate(q),
        "error": None,
    }


@router.post("/qna/{question_id}/upvote", response_model=Dict[str, Any])
async def upvote_question(
    question_id: UUID,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    q = await service.upvote_qna(question_id, user_id=user_id)
    return {
        "success": True,
        "message": "Question upvoted",
        "data": QnAQuestionResponse.model_validate(q) if q else None,
        "error": None,
    }


@router.post("/qna/{question_id}/answer", response_model=Dict[str, Any])
async def answer_question(
    question_id: UUID,
    data: QnAAnswerRequest,
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    q = await service.answer_qna(
        question_id=question_id,
        answer=data.answer_text,
        answered_by=user_id,
        answered_by_name="Instructor",
    )
    return {
        "success": True,
        "message": "Question answered",
        "data": QnAQuestionResponse.model_validate(q) if q else None,
        "error": None,
    }


# ─── Attendance Records ────────────────────────────────────────────────────────
@router.get("/sessions/{session_id}/attendance", response_model=Dict[str, Any])
async def get_attendance(
    session_id: UUID,
    service: ClassroomService = Depends(get_classroom_service),
):
    records = await service.repo.list_session_attendance(session_id)
    return {
        "success": True,
        "message": "Attendance records retrieved",
        "data": {
            "total": len(records),
            "items": [AttendanceRecordResponse.model_validate(r) for r in records],
        },
        "error": None,
    }


# ─── Collaborative Whiteboard ──────────────────────────────────────────────────
@router.get("/sessions/{session_id}/whiteboard/{page_number}", response_model=Dict[str, Any])
async def get_whiteboard_page(
    session_id: UUID,
    page_number: int = 1,
    service: ClassroomService = Depends(get_classroom_service),
):
    snap = await service.repo.get_whiteboard_snapshot(session_id, page_number)
    return {
        "success": True,
        "message": "Whiteboard snapshot retrieved",
        "data": {
            "page_number": page_number,
            "canvas_data": snap.canvas_data if snap else {},
            "updated_at": snap.updated_at if snap else None,
        },
        "error": None,
    }


@router.put("/sessions/{session_id}/whiteboard/{page_number}", response_model=Dict[str, Any])
async def save_whiteboard_page(
    session_id: UUID,
    page_number: int,
    data: Dict[str, Any],
    user_id: UUID = Depends(require_user_id),
    service: ClassroomService = Depends(get_classroom_service),
):
    snap = await service.repo.save_whiteboard_snapshot(
        session_id=session_id,
        page_number=page_number,
        canvas_data=data,
        user_id=user_id,
    )
    # Broadcast to room
    from app.ws.connection_manager import ws_manager
    await ws_manager.publish_event(
        str(session_id),
        {
            "type": "WHITEBOARD_SYNC",
            "page_number": page_number,
            "canvas_data": data,
            "user_id": str(user_id),
        },
    )
    return {
        "success": True,
        "message": "Whiteboard page saved and synced",
        "data": {"page_number": page_number},
        "error": None,
    }
