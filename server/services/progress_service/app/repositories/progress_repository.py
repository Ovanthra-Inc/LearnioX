import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.progress import LessonProgress, CourseProgress


class ProgressRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_lesson_progress(self, user_id: uuid.UUID, lesson_id: uuid.UUID) -> LessonProgress | None:
        result = await self.db.execute(
            select(LessonProgress).where(and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id))
        )
        return result.scalar_one_or_none()

    async def upsert_lesson_progress(self, user_id: uuid.UUID, course_id: uuid.UUID, lesson_id: uuid.UUID,
                                     watched_seconds: int, duration_seconds: int | None) -> LessonProgress:
        existing = await self.get_lesson_progress(user_id, lesson_id)
        now = datetime.now(timezone.utc)
        if existing:
            if watched_seconds > existing.watched_seconds:
                existing.watched_seconds = watched_seconds
            if duration_seconds:
                existing.duration_seconds = duration_seconds
            existing.last_watched_at = now
            if duration_seconds and watched_seconds >= duration_seconds * 0.9:
                existing.is_completed = True
                existing.completed_at = existing.completed_at or now
        else:
            is_done = bool(duration_seconds and watched_seconds >= duration_seconds * 0.9)
            existing = LessonProgress(
                user_id=user_id, course_id=course_id, lesson_id=lesson_id,
                watched_seconds=watched_seconds, duration_seconds=duration_seconds,
                is_completed=is_done, last_watched_at=now,
                completed_at=now if is_done else None,
            )
            self.db.add(existing)
        await self.db.commit()
        await self.db.refresh(existing)
        return existing

    async def mark_lesson_complete(self, user_id: uuid.UUID, course_id: uuid.UUID, lesson_id: uuid.UUID) -> LessonProgress:
        existing = await self.get_lesson_progress(user_id, lesson_id)
        now = datetime.now(timezone.utc)
        if existing:
            existing.is_completed = True
            existing.completed_at = existing.completed_at or now
        else:
            existing = LessonProgress(
                user_id=user_id, course_id=course_id, lesson_id=lesson_id,
                watched_seconds=0, is_completed=True, completed_at=now, last_watched_at=now,
            )
            self.db.add(existing)
        await self.db.commit()
        await self.db.refresh(existing)
        return existing

    async def get_course_progress(self, user_id: uuid.UUID, course_id: uuid.UUID) -> CourseProgress | None:
        result = await self.db.execute(
            select(CourseProgress).where(and_(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id))
        )
        return result.scalar_one_or_none()

    async def upsert_course_progress(self, user_id: uuid.UUID, course_id: uuid.UUID,
                                     total_lessons: int, completed_lessons: int, last_lesson_id: uuid.UUID | None) -> CourseProgress:
        pct = round((completed_lessons / total_lessons * 100) if total_lessons else 0, 2)
        is_done = pct >= 100
        now = datetime.now(timezone.utc)
        existing = await self.get_course_progress(user_id, course_id)
        if existing:
            existing.total_lessons = total_lessons
            existing.completed_lessons = completed_lessons
            existing.completion_percentage = pct
            existing.last_lesson_id = last_lesson_id
            existing.is_completed = is_done
            if is_done and not existing.completed_at:
                existing.completed_at = now
        else:
            existing = CourseProgress(
                user_id=user_id, course_id=course_id,
                total_lessons=total_lessons, completed_lessons=completed_lessons,
                completion_percentage=pct, last_lesson_id=last_lesson_id,
                is_completed=is_done, completed_at=now if is_done else None,
            )
            self.db.add(existing)
        await self.db.commit()
        await self.db.refresh(existing)
        return existing

    async def list_continue_learning(self, user_id: uuid.UUID, limit: int = 10) -> list[CourseProgress]:
        result = await self.db.execute(
            select(CourseProgress)
            .where(and_(CourseProgress.user_id == user_id, CourseProgress.is_completed == False))
            .order_by(CourseProgress.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_completed_by_course(self, user_id: uuid.UUID, course_id: uuid.UUID) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(LessonProgress.id)).where(
                and_(LessonProgress.user_id == user_id, LessonProgress.course_id == course_id, LessonProgress.is_completed == True)
            )
        )
        return result.scalar() or 0

    async def mark_lesson_uncomplete(self, user_id: uuid.UUID, course_id: uuid.UUID, lesson_id: uuid.UUID) -> LessonProgress:
        existing = await self.get_lesson_progress(user_id, lesson_id)
        if existing:
            existing.is_completed = False
            existing.completed_at = None
        else:
            existing = LessonProgress(
                user_id=user_id, course_id=course_id, lesson_id=lesson_id,
                watched_seconds=0, is_completed=False,
            )
            self.db.add(existing)
        await self.db.commit()
        await self.db.refresh(existing)
        return existing

