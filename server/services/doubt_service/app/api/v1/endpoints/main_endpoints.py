import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, update
from app.dependencies.db import get_db
from app.models.doubt import Doubt, DoubtAnswer, DoubtStatus
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateDoubtRequest(BaseModel):
    institution_id: uuid.UUID | None = None
    course_id: uuid.UUID
    lesson_id: uuid.UUID | None = None
    title: str
    body: str


class UpdateDoubtRequest(BaseModel):
    title: str | None = None
    body: str | None = None


class CreateDoubtAnswerRequest(BaseModel):
    body: str
    is_instructor_answer: bool = False
    is_ai_generated: bool = False


class UpdateDoubtAnswerRequest(BaseModel):
    body: str


class AssignDoubtRequest(BaseModel):
    assignee_user_id: uuid.UUID


class DoubtResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    course_id: uuid.UUID
    lesson_id: uuid.UUID | None = None
    institution_id: uuid.UUID | None = None
    title: str
    body: str
    status: str
    assigned_to_user_id: uuid.UUID | None = None
    created_at: datetime


class DoubtAnswerResponse(BaseModel):
    id: uuid.UUID
    doubt_id: uuid.UUID
    user_id: uuid.UUID
    body: str
    is_instructor_answer: bool
    is_ai_generated: bool
    created_at: datetime


# ── Serialisers ───────────────────────────────────────────────────────────────

def _dr(d) -> DoubtResponse:
    return DoubtResponse(
        id=d.id, user_id=d.user_id, course_id=d.course_id, lesson_id=d.lesson_id,
        institution_id=d.institution_id, title=d.title, body=d.body,
        status=d.status.value, assigned_to_user_id=d.assigned_to_user_id,
        created_at=d.created_at,
    )


def _dar(a) -> DoubtAnswerResponse:
    return DoubtAnswerResponse(
        id=a.id, doubt_id=a.doubt_id, user_id=a.user_id, body=a.body,
        is_instructor_answer=a.is_instructor_answer, is_ai_generated=a.is_ai_generated,
        created_at=a.created_at,
    )


# ── Auth helper ───────────────────────────────────────────────────────────────

def get_uid(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


# ── Doubts CRUD ───────────────────────────────────────────────────────────────

@router.post("/doubts", response_model=APIResponse[DoubtResponse], status_code=201)
async def create_doubt(
    request: CreateDoubtRequest,
    user_id: uuid.UUID = Depends(get_uid),
    db: AsyncSession = Depends(get_db),
):
    d = Doubt(**request.model_dump(), user_id=user_id)
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return APIResponse(success=True, message="Doubt posted", data=_dr(d))


@router.get("/doubts/{doubt_id}", response_model=APIResponse[DoubtResponse])
async def get_doubt(doubt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    return APIResponse(success=True, message="Doubt retrieved", data=_dr(d))


@router.patch("/doubts/{doubt_id}", response_model=APIResponse[DoubtResponse])
async def update_doubt(
    doubt_id: uuid.UUID, request: UpdateDoubtRequest,
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    if d.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if request.title is not None:
        d.title = request.title
    if request.body is not None:
        d.body = request.body
    await db.commit()
    await db.refresh(d)
    return APIResponse(success=True, message="Doubt updated", data=_dr(d))


@router.delete("/doubts/{doubt_id}", response_model=APIResponse[dict])
async def delete_doubt(
    doubt_id: uuid.UUID, user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    if d.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(d)
    await db.commit()
    return APIResponse(success=True, message="Doubt deleted", data={})


@router.get("/doubts", response_model=PaginatedResponse[DoubtResponse])
async def list_doubts(
    course_id: uuid.UUID = Query(...),
    lesson_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = [Doubt.course_id == course_id]
    if lesson_id:
        filters.append(Doubt.lesson_id == lesson_id)

    total_result = await db.execute(select(func.count(Doubt.id)).where(and_(*filters)))
    total = total_result.scalar_one()
    result = await db.execute(
        select(Doubt).where(and_(*filters))
        .order_by(Doubt.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Doubts retrieved",
        data=[_dr(d) for d in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


# ── Doubt Answers ─────────────────────────────────────────────────────────────

@router.post("/doubts/{doubt_id}/answers", response_model=APIResponse[DoubtAnswerResponse], status_code=201)
async def post_answer(
    doubt_id: uuid.UUID, request: CreateDoubtAnswerRequest,
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    a = DoubtAnswer(
        doubt_id=doubt_id, user_id=user_id, body=request.body,
        is_instructor_answer=request.is_instructor_answer,
        is_ai_generated=request.is_ai_generated,
    )
    db.add(a)
    # Mark doubt as in-progress if it was open
    await db.execute(
        update(Doubt).where(and_(Doubt.id == doubt_id, Doubt.status == DoubtStatus.OPEN))
        .values(status=DoubtStatus.IN_PROGRESS)
    )
    await db.commit()
    await db.refresh(a)
    return APIResponse(success=True, message="Answer posted", data=_dar(a))


@router.get("/doubts/{doubt_id}/answers", response_model=APIResponse[list[DoubtAnswerResponse]])
async def list_answers(doubt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DoubtAnswer).where(DoubtAnswer.doubt_id == doubt_id).order_by(DoubtAnswer.created_at.asc())
    )
    return APIResponse(success=True, message="Answers retrieved", data=[_dar(a) for a in result.scalars().all()])


@router.patch("/doubt-answers/{answer_id}", response_model=APIResponse[DoubtAnswerResponse])
async def update_answer(
    answer_id: uuid.UUID, request: UpdateDoubtAnswerRequest,
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DoubtAnswer).where(DoubtAnswer.id == answer_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    if a.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    a.body = request.body
    await db.commit()
    await db.refresh(a)
    return APIResponse(success=True, message="Answer updated", data=_dar(a))


@router.delete("/doubt-answers/{answer_id}", response_model=APIResponse[dict])
async def delete_answer(
    answer_id: uuid.UUID, user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DoubtAnswer).where(DoubtAnswer.id == answer_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    if a.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(a)
    await db.commit()
    return APIResponse(success=True, message="Answer deleted", data={})


# ── Status Transitions ────────────────────────────────────────────────────────

@router.post("/doubts/{doubt_id}/resolve", response_model=APIResponse[DoubtResponse])
async def resolve_doubt(doubt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    d.status = DoubtStatus.RESOLVED
    await db.commit()
    await db.refresh(d)
    return APIResponse(success=True, message="Doubt resolved", data=_dr(d))


@router.post("/doubts/{doubt_id}/reopen", response_model=APIResponse[DoubtResponse])
async def reopen_doubt(doubt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    d.status = DoubtStatus.OPEN
    await db.commit()
    await db.refresh(d)
    return APIResponse(success=True, message="Doubt reopened", data=_dr(d))


@router.post("/doubts/{doubt_id}/upvote", response_model=APIResponse[dict])
async def upvote_doubt(
    doubt_id: uuid.UUID, user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Doubt not found")
    # Upvote stored as acknowledgement — lightweight for now
    return APIResponse(success=True, message="Upvoted", data={"doubt_id": str(doubt_id)})


@router.post("/doubts/{doubt_id}/assign", response_model=APIResponse[DoubtResponse])
async def assign_doubt(
    doubt_id: uuid.UUID, request: AssignDoubtRequest, db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doubt).where(Doubt.id == doubt_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doubt not found")
    d.assigned_to_user_id = request.assignee_user_id
    d.status = DoubtStatus.IN_PROGRESS
    await db.commit()
    await db.refresh(d)
    return APIResponse(success=True, message="Doubt assigned", data=_dr(d))


# ── Institution & User Views ──────────────────────────────────────────────────

@router.get("/institutions/{institution_id}/doubts", response_model=PaginatedResponse[DoubtResponse])
async def list_institution_doubts(
    institution_id: uuid.UUID,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(Doubt.id)).where(Doubt.institution_id == institution_id)
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(Doubt).where(Doubt.institution_id == institution_id)
        .order_by(Doubt.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Institution doubts retrieved",
        data=[_dr(d) for d in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/institutions/{institution_id}/doubts/pending", response_model=PaginatedResponse[DoubtResponse])
async def list_institution_pending_doubts(
    institution_id: uuid.UUID,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    filters = [Doubt.institution_id == institution_id, Doubt.status == DoubtStatus.OPEN]
    total_result = await db.execute(select(func.count(Doubt.id)).where(and_(*filters)))
    total = total_result.scalar_one()
    result = await db.execute(
        select(Doubt).where(and_(*filters))
        .order_by(Doubt.created_at.asc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Pending doubts retrieved",
        data=[_dr(d) for d in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/users/me/doubts", response_model=PaginatedResponse[DoubtResponse])
async def list_my_doubts(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(select(func.count(Doubt.id)).where(Doubt.user_id == user_id))
    total = total_result.scalar_one()
    result = await db.execute(
        select(Doubt).where(Doubt.user_id == user_id)
        .order_by(Doubt.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="My doubts retrieved",
        data=[_dr(d) for d in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
