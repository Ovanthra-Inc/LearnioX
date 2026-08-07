from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, and_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.course import Course, CourseStatus
from app.models.curriculum import CourseModule, Lesson
from app.models.enrollment import (
    CourseProgress,
    Enrollment,
    EnrollmentAccessType,
    EnrollmentStatus,
    LessonBookmark,
    LessonProgress,
    LessonProgressStatus,
)
from app.models.user import User


class EnrollmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Enrollment Operations
    async def create_enrollment(
        self,
        user_id: UUID,
        course_id: UUID,
        institution_id: UUID,
        access_type: EnrollmentAccessType = EnrollmentAccessType.FREE,
    ) -> Enrollment:
        enrollment = Enrollment(
            user_id=user_id,
            course_id=course_id,
            institution_id=institution_id,
            status=EnrollmentStatus.ACTIVE,
            access_type=access_type,
            enrolled_at=datetime.now(timezone.utc),
        )
        self.db.add(enrollment)
        await self.db.flush()
        await self.db.refresh(enrollment)
        return enrollment

    async def find_enrollment(self, user_id: UUID, course_id: UUID) -> Optional[Enrollment]:
        res = await self.db.execute(
            select(Enrollment).where(
                and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
            )
        )
        return res.scalars().first()

    async def get_enrollment_by_id(self, enrollment_id: UUID) -> Optional[Enrollment]:
        res = await self.db.execute(
            select(Enrollment).where(Enrollment.id == enrollment_id)
        )
        return res.scalars().first()

    async def list_user_enrollments(
        self, user_id: UUID, page: int = 1, limit: int = 20, status: Optional[str] = None
    ) -> Tuple[List[Enrollment], int]:
        conditions = [Enrollment.user_id == user_id]
        if status:
            conditions.append(Enrollment.status == status)

        count_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(and_(*conditions))
        )
        total = count_res.scalar_one()

        query = (
            select(Enrollment)
            .where(and_(*conditions))
            .order_by(Enrollment.enrolled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def list_course_enrollments(
        self,
        course_id: UUID,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Enrollment], int]:
        conditions = [Enrollment.course_id == course_id]
        if status:
            conditions.append(Enrollment.status == status)

        if search:
            conditions.append(
                Enrollment.user_id.in_(
                    select(User.id).where(
                        # MED-01: User model has 'name' not 'full_name'
                        (User.name.ilike(f"%{search}%"))
                        | (User.email.ilike(f"%{search}%"))
                    )
                )
            )

        count_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(and_(*conditions))
        )
        total = count_res.scalar_one()

        query = (
            select(Enrollment)
            .where(and_(*conditions))
            .order_by(Enrollment.enrolled_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def update_enrollment(
        self, enrollment: Enrollment, update_dict: dict
    ) -> Enrollment:
        for k, v in update_dict.items():
            if v is not None:
                setattr(enrollment, k, v)
        await self.db.flush()
        await self.db.refresh(enrollment)
        return enrollment

    async def cancel_enrollment(self, user_id: UUID, course_id: UUID) -> bool:
        enr = await self.find_enrollment(user_id, course_id)
        if not enr:
            return False
        enr.status = EnrollmentStatus.CANCELLED
        await self.db.flush()
        return True

    # Progress Operations
    async def get_or_create_lesson_progress(
        self, user_id: UUID, lesson_id: UUID
    ) -> LessonProgress:
        # CRIT-07: Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicate-key
        # crash under concurrent requests for the same (user_id, lesson_id) pair.
        stmt = (
            pg_insert(LessonProgress)
            .values(
                user_id=user_id,
                lesson_id=lesson_id,
                status=LessonProgressStatus.NOT_STARTED,
                watch_time=0,
                progress_percentage=0,
                last_position=0,
            )
            .on_conflict_do_nothing(index_elements=["user_id", "lesson_id"])
        )
        await self.db.execute(stmt)
        await self.db.flush()

        # Always re-fetch after upsert — handles both insert and conflict cases
        res = await self.db.execute(
            select(LessonProgress).where(
                and_(
                    LessonProgress.user_id == user_id,
                    LessonProgress.lesson_id == lesson_id,
                )
            )
        )
        return res.scalars().first()

    async def update_lesson_progress(
        self, progress: LessonProgress, update_dict: dict
    ) -> LessonProgress:
        for k, v in update_dict.items():
            if v is not None:
                setattr(progress, k, v)
        await self.db.flush()
        await self.db.refresh(progress)
        return progress

    async def get_course_progress(
        self, user_id: UUID, course_id: UUID
    ) -> Optional[CourseProgress]:
        res = await self.db.execute(
            select(CourseProgress).where(
                and_(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
            )
        )
        return res.scalars().first()

    async def recalculate_course_progress(
        self, user_id: UUID, course_id: UUID, last_lesson_id: Optional[UUID] = None
    ) -> CourseProgress:
        module_subquery = select(CourseModule.id).where(CourseModule.course_id == course_id)
        lesson_ids_query = select(Lesson.id).where(Lesson.module_id.in_(module_subquery))
        
        total_lessons_res = await self.db.execute(
            select(func.count(Lesson.id)).where(Lesson.module_id.in_(module_subquery))
        )
        total_lessons = total_lessons_res.scalar_one()

        completed_lessons_res = await self.db.execute(
            select(func.count(LessonProgress.id)).where(
                and_(
                    LessonProgress.user_id == user_id,
                    LessonProgress.lesson_id.in_(lesson_ids_query),
                    LessonProgress.status == LessonProgressStatus.COMPLETED,
                )
            )
        )
        completed_lessons = completed_lessons_res.scalar_one()

        percentage = 0.0
        if total_lessons > 0:
            percentage = round((completed_lessons / total_lessons) * 100.0, 2)

        # HIGH-11: Atomic upsert using ON CONFLICT DO UPDATE to prevent race conditions
        insert_stmt = pg_insert(CourseProgress).values(
            user_id=user_id,
            course_id=course_id,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons,
            progress_percentage=percentage,
            last_lesson_id=last_lesson_id,
        )
        update_dict = {
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "progress_percentage": percentage,
        }
        if last_lesson_id:
            update_dict["last_lesson_id"] = last_lesson_id

        upsert_stmt = insert_stmt.on_conflict_do_update(
            constraint="uq_user_course_progress",
            set_=update_dict,
        )
        await self.db.execute(upsert_stmt)
        await self.db.flush()

        c_prog = await self.get_course_progress(user_id, course_id)

        # Auto-complete enrollment if 100% complete
        if percentage >= 100.0 and total_lessons > 0:
            enr = await self.find_enrollment(user_id, course_id)
            if enr and enr.status == EnrollmentStatus.ACTIVE:
                enr.status = EnrollmentStatus.COMPLETED
                enr.completed_at = datetime.now(timezone.utc)
                await self.db.flush()

        return c_prog

    # Bookmark Operations
    async def create_bookmark(
        self, user_id: UUID, lesson_id: UUID, timestamp_seconds: int, note: Optional[str] = None
    ) -> LessonBookmark:
        bookmark = LessonBookmark(
            user_id=user_id,
            lesson_id=lesson_id,
            timestamp_seconds=timestamp_seconds,
            note=note.strip() if note else None,
        )
        self.db.add(bookmark)
        await self.db.flush()
        await self.db.refresh(bookmark)
        return bookmark

    async def get_bookmark(self, bookmark_id: UUID) -> Optional[LessonBookmark]:
        res = await self.db.execute(
            select(LessonBookmark).where(LessonBookmark.id == bookmark_id)
        )
        return res.scalars().first()

    async def list_bookmarks(self, user_id: UUID, lesson_id: UUID) -> List[LessonBookmark]:
        res = await self.db.execute(
            select(LessonBookmark)
            .where(
                and_(
                    LessonBookmark.user_id == user_id,
                    LessonBookmark.lesson_id == lesson_id,
                )
            )
            .order_by(LessonBookmark.timestamp_seconds.asc())
        )
        return list(res.scalars().all())

    async def update_bookmark(
        self, bookmark: LessonBookmark, note: Optional[str]
    ) -> LessonBookmark:
        bookmark.note = note.strip() if note else None
        await self.db.flush()
        await self.db.refresh(bookmark)
        return bookmark

    async def delete_bookmark(self, bookmark_id: UUID, user_id: UUID) -> bool:
        bm = await self.get_bookmark(bookmark_id)
        if not bm or bm.user_id != user_id:
            return False
        await self.db.delete(bm)
        await self.db.flush()
        return True

    # Feeds & Analytics
    async def get_continue_learning(self, user_id: UUID) -> List[dict]:
        enrollments, _ = await self.list_user_enrollments(
            user_id=user_id, status=None, limit=50
        )
        items = []
        for enr in enrollments:
            course_res = await self.db.execute(
                select(Course).where(Course.id == enr.course_id)
            )
            course = course_res.scalars().first()
            if not course:
                continue

            c_prog = await self.get_course_progress(user_id, enr.course_id)
            last_lesson_id = c_prog.last_lesson_id if c_prog else None
            last_lesson_title = None
            last_pos = 0

            if last_lesson_id:
                les_res = await self.db.execute(
                    select(Lesson).where(Lesson.id == last_lesson_id)
                )
                les = les_res.scalars().first()
                if les:
                    last_lesson_title = les.title
                    l_prog = await self.get_or_create_lesson_progress(user_id, les.id)
                    last_pos = l_prog.last_position

            items.append(
                {
                    "course_id": course.id,
                    "course_title": course.title,
                    "last_lesson_id": last_lesson_id,
                    "last_lesson_title": last_lesson_title,
                    "last_position": last_pos,
                    "progress_percentage": c_prog.progress_percentage if c_prog else 0.0,
                }
            )

        return items

    async def get_learning_history(self, user_id: UUID, limit: int = 20) -> List[dict]:
        query = (
            select(LessonProgress, Lesson, Course)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .join(CourseModule, Lesson.module_id == CourseModule.id)
            .join(Course, CourseModule.course_id == Course.id)
            .where(
                and_(
                    LessonProgress.user_id == user_id,
                    LessonProgress.status != LessonProgressStatus.NOT_STARTED,
                )
            )
            .order_by(LessonProgress.updated_at.desc())
            .limit(limit)
        )
        res = await self.db.execute(query)
        rows = res.all()

        history = []
        for lp, l, c in rows:
            history.append(
                {
                    "lesson_id": l.id,
                    "lesson_title": l.title,
                    "course_id": c.id,
                    "course_title": c.title,
                    "last_viewed_at": lp.updated_at,
                }
            )

        return history

    async def get_enrollment_statistics(self, course_id: UUID) -> dict:
        total_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
        )
        total_students = total_res.scalar_one()

        active_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.status == EnrollmentStatus.ACTIVE,
                )
            )
        )
        active_students = active_res.scalar_one()

        completed_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.status == EnrollmentStatus.COMPLETED,
                )
            )
        )
        completed_students = completed_res.scalar_one()

        avg_prog_res = await self.db.execute(
            select(func.coalesce(func.avg(CourseProgress.progress_percentage), 0.0)).where(
                CourseProgress.course_id == course_id
            )
        )
        average_progress = round(avg_prog_res.scalar_one(), 2)

        completion_rate = 0.0
        if total_students > 0:
            completion_rate = round((completed_students / total_students) * 100.0, 2)

        return {
            "total_students": total_students,
            "active_students": active_students,
            "completed_students": completed_students,
            "average_progress": average_progress,
            "completion_rate": completion_rate,
        }
