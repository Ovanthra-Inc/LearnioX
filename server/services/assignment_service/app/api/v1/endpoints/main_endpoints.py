import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.assignment import Assignment, AssignmentSubmission, AssignmentStatus, SubmissionStatus
from app.schemas.schemas import (
    CreateAssignmentRequest, SubmitAssignmentRequest, ReviewAssignmentRequest,
    AssignmentResponse, AssignmentSubmissionResponse,
)
from learniox_common.schemas import APIResponse

router = APIRouter()


def get_uid(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


def _ar(a) -> AssignmentResponse:
    return AssignmentResponse(id=a.id, course_id=a.course_id, lesson_id=a.lesson_id, title=a.title,
                              description=a.description, due_date=a.due_date, max_marks=a.max_marks,
                              status=a.status.value, created_at=a.created_at)


def _sr(s) -> AssignmentSubmissionResponse:
    return AssignmentSubmissionResponse(
        id=s.id, assignment_id=s.assignment_id, user_id=s.user_id, text_answer=s.text_answer,
        file_asset_id=s.file_asset_id, status=s.status.value,
        marks_obtained=float(s.marks_obtained) if s.marks_obtained else None,
        feedback=s.feedback, created_at=s.created_at,
    )


@router.post("/assignments", response_model=APIResponse[AssignmentResponse])
async def create_assignment(request: CreateAssignmentRequest, db: AsyncSession = Depends(get_db)):
    a = Assignment(**request.model_dump())
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return APIResponse(success=True, message="Assignment created", data=_ar(a))


@router.get("/assignments/{assignment_id}", response_model=APIResponse[AssignmentResponse])
async def get_assignment(assignment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return APIResponse(success=True, message="Assignment retrieved", data=_ar(a))


@router.post("/assignments/{assignment_id}/submit", response_model=APIResponse[AssignmentSubmissionResponse])
async def submit_assignment(
    assignment_id: uuid.UUID, request: SubmitAssignmentRequest,
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    s = AssignmentSubmission(assignment_id=assignment_id, user_id=user_id,
                             text_answer=request.text_answer, file_asset_id=request.file_asset_id)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return APIResponse(success=True, message="Assignment submitted", data=_sr(s))


@router.post("/submissions/{submission_id}/review", response_model=APIResponse[AssignmentSubmissionResponse])
async def review_submission(
    submission_id: uuid.UUID, request: ReviewAssignmentRequest, db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == submission_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Submission not found")
    s.marks_obtained = request.marks_obtained
    s.feedback = request.feedback
    s.status = SubmissionStatus.GRADED
    await db.commit()
    await db.refresh(s)
    return APIResponse(success=True, message="Submission graded", data=_sr(s))


@router.get("/assignments/{assignment_id}/submissions", response_model=APIResponse[list[AssignmentSubmissionResponse]])
async def list_submissions(assignment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.assignment_id == assignment_id))
    return APIResponse(success=True, message="Submissions retrieved", data=[_sr(s) for s in result.scalars().all()])


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
