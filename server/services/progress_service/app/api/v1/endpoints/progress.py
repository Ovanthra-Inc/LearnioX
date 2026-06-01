import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.dependencies.db import get_db
from app.repositories.progress_repository import ProgressRepository
from app.models.progress import LessonProgress, CourseProgress
from app.schemas.schemas import (
    WatchProgressRequest, MarkLessonCompleteRequest, RecalculateCourseProgressRequest,
    LessonProgressResponse, CourseProgressResponse, ContinueLearningItemResponse
)
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


def _lp(p) -> LessonProgressResponse:
    return LessonProgressResponse(
        id=p.id, user_id=p.user_id, course_id=p.course_id, lesson_id=p.lesson_id,
        watched_seconds=p.watched_seconds, duration_seconds=p.duration_seconds,
        is_completed=p.is_completed, completed_at=p.completed_at, last_watched_at=p.last_watched_at,
    )


def _cp(p) -> CourseProgressResponse:
    return CourseProgressResponse(
        id=p.id, user_id=p.user_id, course_id=p.course_id,
        total_lessons=p.total_lessons, completed_lessons=p.completed_lessons,
        completion_percentage=float(p.completion_percentage),
        last_lesson_id=p.last_lesson_id, is_completed=p.is_completed, completed_at=p.completed_at,
    )


# ── Watch Progress ────────────────────────────────────────────────────────────

@router.post("/progress/watch", response_model=APIResponse[LessonProgressResponse])
async def record_watch_progress(
    request: WatchProgressRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = request.user_id or user_id
    repo = ProgressRepository(db)
    p = await repo.upsert_lesson_progress(uid, request.course_id, request.lesson_id, request.watched_seconds, request.duration_seconds)
    return APIResponse(success=True, message="Progress recorded", data=_lp(p))


# ── Lesson Complete / Uncomplete ──────────────────────────────────────────────

@router.post("/progress/lesson/complete", response_model=APIResponse[LessonProgressResponse])
async def mark_lesson_complete(
    request: MarkLessonCompleteRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    uid = request.user_id or user_id
    repo = ProgressRepository(db)
    p = await repo.mark_lesson_complete(uid, request.course_id, request.lesson_id)
    return APIResponse(success=True, message="Lesson marked complete", data=_lp(p))


@router.post("/progress/lesson/uncomplete", response_model=APIResponse[LessonProgressResponse])
async def mark_lesson_uncomplete(
    request: MarkLessonCompleteRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark a lesson as incomplete (reset completion state)."""
    uid = request.user_id or user_id
    repo = ProgressRepository(db)
    p = await repo.mark_lesson_uncomplete(uid, request.course_id, request.lesson_id)
    return APIResponse(success=True, message="Lesson marked incomplete", data=_lp(p))


# ── Course Progress ───────────────────────────────────────────────────────────

@router.get("/progress/courses/{course_id}", response_model=APIResponse[CourseProgressResponse])
async def get_course_progress(
    course_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = ProgressRepository(db)
    p = await repo.get_course_progress(user_id, course_id)
    if not p:
        raise HTTPException(status_code=404, detail="No progress found")
    return APIResponse(success=True, message="Course progress retrieved", data=_cp(p))


@router.get("/progress/lessons/{lesson_id}", response_model=APIResponse[LessonProgressResponse])
async def get_lesson_progress(
    lesson_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = ProgressRepository(db)
    p = await repo.get_lesson_progress(user_id, lesson_id)
    if not p:
        raise HTTPException(status_code=404, detail="No progress found")
    return APIResponse(success=True, message="Lesson progress retrieved", data=_lp(p))


@router.post("/progress/courses/recalculate", response_model=APIResponse[CourseProgressResponse])
async def recalculate_course_progress(
    request: RecalculateCourseProgressRequest,
    db: AsyncSession = Depends(get_db),
):
    repo = ProgressRepository(db)
    completed = await repo.count_completed_by_course(request.user_id, request.course_id)
    existing = await repo.get_course_progress(request.user_id, request.course_id)
    last_lid = existing.last_lesson_id if existing else None
    p = await repo.upsert_course_progress(request.user_id, request.course_id, request.total_lessons, completed, last_lid)
    return APIResponse(success=True, message="Course progress recalculated", data=_cp(p))


# ── Continue Learning ─────────────────────────────────────────────────────────

@router.get("/progress/continue-learning", response_model=APIResponse[list[ContinueLearningItemResponse]])
async def continue_learning(
    limit: int = Query(10, ge=1, le=50),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = ProgressRepository(db)
    items = await repo.list_continue_learning(user_id, limit)
    return APIResponse(
        success=True, message="Continue learning items retrieved",
        data=[ContinueLearningItemResponse(
            course_id=i.course_id, last_lesson_id=i.last_lesson_id,
            completion_percentage=float(i.completion_percentage), is_completed=i.is_completed,
        ) for i in items],
    )


# ── My Overall Progress ───────────────────────────────────────────────────────

@router.get("/users/me/progress", response_model=PaginatedResponse[CourseProgressResponse])
async def get_my_progress(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(CourseProgress.id)).where(CourseProgress.user_id == user_id)
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(CourseProgress).where(CourseProgress.user_id == user_id)
        .order_by(CourseProgress.updated_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Progress retrieved",
        data=[_cp(p) for p in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/users/me/lessons/{lesson_id}/progress", response_model=APIResponse[LessonProgressResponse])
async def get_my_lesson_progress(
    lesson_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = ProgressRepository(db)
    p = await repo.get_lesson_progress(user_id, lesson_id)
    if not p:
        raise HTTPException(status_code=404, detail="No lesson progress found")
    return APIResponse(success=True, message="Lesson progress retrieved", data=_lp(p))


# ── Streak ────────────────────────────────────────────────────────────────────

@router.get("/users/me/streak", response_model=APIResponse[dict])
async def get_my_streak(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Returns current learning streak (consecutive days with activity)."""
    from datetime import date, timedelta
    from sqlalchemy import cast, Date

    # Get all distinct days user had lesson activity
    result = await db.execute(
        select(func.date(LessonProgress.last_watched_at).label("day"))
        .where(and_(LessonProgress.user_id == user_id, LessonProgress.last_watched_at.isnot(None)))
        .distinct()
        .order_by(func.date(LessonProgress.last_watched_at).desc())
    )
    days = [row.day for row in result.fetchall()]

    streak = 0
    today = date.today()
    check = today
    for day in days:
        if isinstance(day, str):
            from datetime import datetime as dt
            day = dt.fromisoformat(day).date()
        if day == check or day == check - timedelta(days=1):
            streak += 1
            check = day
        else:
            break

    return APIResponse(success=True, message="Streak retrieved", data={
        "streak_days": streak,
        "last_activity_date": str(days[0]) if days else None,
    })


# ── Institution Progress Views ────────────────────────────────────────────────

@router.get("/institutions/{institution_id}/progress/learners", response_model=APIResponse[dict])
async def get_institution_learner_progress(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Aggregate progress stats for all learners in an institution."""
    total_enrollments_result = await db.execute(
        select(func.count(CourseProgress.id))
    )
    total = total_enrollments_result.scalar_one()
    completed_result = await db.execute(
        select(func.count(CourseProgress.id)).where(CourseProgress.is_completed == True)
    )
    completed = completed_result.scalar_one()
    avg_result = await db.execute(
        select(func.avg(CourseProgress.completion_percentage))
    )
    avg_pct = avg_result.scalar_one()

    return APIResponse(success=True, message="Institution learner progress", data={
        "institution_id": str(institution_id),
        "total_enrollments": total,
        "completed_courses": completed,
        "average_completion_pct": round(float(avg_pct or 0), 2),
    })


@router.get("/institutions/{institution_id}/progress/courses/{course_id}", response_model=APIResponse[dict])
async def get_course_progress_stats(
    institution_id: uuid.UUID,
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Progress statistics for a specific course in an institution."""
    total_result = await db.execute(
        select(func.count(CourseProgress.id)).where(CourseProgress.course_id == course_id)
    )
    total = total_result.scalar_one()
    completed_result = await db.execute(
        select(func.count(CourseProgress.id)).where(
            and_(CourseProgress.course_id == course_id, CourseProgress.is_completed == True)
        )
    )
    completed = completed_result.scalar_one()
    avg_result = await db.execute(
        select(func.avg(CourseProgress.completion_percentage)).where(CourseProgress.course_id == course_id)
    )
    avg_pct = avg_result.scalar_one()

    return APIResponse(success=True, message="Course progress stats", data={
        "course_id": str(course_id),
        "institution_id": str(institution_id),
        "total_learners": total,
        "completed_count": completed,
        "completion_rate_pct": round((completed / total * 100) if total else 0, 2),
        "average_completion_pct": round(float(avg_pct or 0), 2),
    })


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    try:
        await db.execute(text("SELECT 1"))
        return APIResponse(success=True, message="OK", data={"status": "healthy"})
    except Exception as e:
        return APIResponse(success=False, message="DB error", data={"error": str(e)})
