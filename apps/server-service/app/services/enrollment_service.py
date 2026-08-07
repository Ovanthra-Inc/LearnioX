from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.course import CourseStatus
from app.models.enrollment import (
    EnrollmentAccessType,
    EnrollmentStatus,
    LessonProgressStatus,
)
from app.repositories.course_repository import CourseRepository
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.schemas.curriculum import ContentStatisticsResponse
from app.schemas.enrollment import (
    BookmarkRequest,
    BookmarkResponse,
    CompletionResponse,
    ContinueLearningItem,
    ContinueLearningResponse,
    CourseProgressResponse,
    EnrollRequest,
    EnrollmentListResponse,
    EnrollmentResponse,
    EnrollmentStatisticsResponse,
    LearningHistoryItem,
    LessonProgressResponse,
    StartLessonRequest,
    UpdateEnrollmentRequest,
    UpdateProgressRequest,
)


class EnrollmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = EnrollmentRepository(db)
        self.course_repo = CourseRepository(db)
        self.curriculum_repo = CurriculumRepository(db)

    # Enrollment Services
    async def enroll_course(
        self, user_id: UUID, course_id: UUID, payload: EnrollRequest
    ) -> EnrollmentResponse:
        course = await self.course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        if course.status != CourseStatus.PUBLISHED:
            raise ValidationException(
                message="Cannot enroll in an unpublished course",
                error_code="COURSE_NOT_PUBLISHED",
            )

        existing = await self.repo.find_enrollment(user_id, course_id)
        if existing and existing.status == EnrollmentStatus.ACTIVE:
            raise ConflictException(
                message="User is already actively enrolled in this course",
                error_code="ALREADY_ENROLLED",
            )

        access_type = EnrollmentAccessType(payload.access_type)
        if existing:
            updated = await self.repo.update_enrollment(
                existing,
                {
                    "status": EnrollmentStatus.ACTIVE,
                    "access_type": access_type,
                    "enrolled_at": datetime.now(timezone.utc),
                    "completed_at": None,
                },
            )
            enrollment = updated
        else:
            enrollment = await self.repo.create_enrollment(
                user_id=user_id,
                course_id=course_id,
                institution_id=course.institution_id,
                access_type=access_type,
            )

        # Initialize CourseProgress
        await self.repo.recalculate_course_progress(user_id, course_id)

        return EnrollmentResponse(
            enrollment_id=enrollment.id,
            course_id=enrollment.course_id,
            user_id=enrollment.user_id,
            status=enrollment.status.value if hasattr(enrollment.status, "value") else str(enrollment.status),
            access_type=enrollment.access_type.value if hasattr(enrollment.access_type, "value") else str(enrollment.access_type),
            enrolled_at=enrollment.enrolled_at,
            completed_at=enrollment.completed_at,
            expires_at=enrollment.expires_at,
        )

    async def cancel_enrollment(self, user_id: UUID, course_id: UUID) -> None:
        success = await self.repo.cancel_enrollment(user_id, course_id)
        if not success:
            raise NotFoundException(
                message="Active enrollment not found", error_code="ENROLLMENT_NOT_FOUND"
            )

    async def get_enrollment(
        self, enrollment_id: UUID, user_id: Optional[UUID] = None
    ) -> EnrollmentResponse:
        enrollment = await self.repo.get_enrollment_by_id(enrollment_id)
        if not enrollment:
            raise NotFoundException(
                message="Enrollment not found", error_code="ENROLLMENT_NOT_FOUND"
            )
        # FIX #9: Ownership check — reject if requester doesn't own this enrollment
        if user_id is not None and enrollment.user_id != user_id:
            raise ForbiddenException(
                message="You do not have permission to view this enrollment",
                error_code="ENROLLMENT_ACCESS_DENIED",
            )
        return EnrollmentResponse(
            enrollment_id=enrollment.id,
            course_id=enrollment.course_id,
            user_id=enrollment.user_id,
            status=enrollment.status.value if hasattr(enrollment.status, "value") else str(enrollment.status),
            access_type=enrollment.access_type.value if hasattr(enrollment.access_type, "value") else str(enrollment.access_type),
            enrolled_at=enrollment.enrolled_at,
            completed_at=enrollment.completed_at,
            expires_at=enrollment.expires_at,
        )

    async def list_user_enrollments(
        self, user_id: UUID, page: int = 1, limit: int = 20, status: Optional[str] = None
    ) -> EnrollmentListResponse:
        items, total = await self.repo.list_user_enrollments(
            user_id=user_id, page=page, limit=limit, status=status
        )
        pages = (total + limit - 1) // limit if total > 0 else 1
        resp_items = [
            EnrollmentResponse(
                enrollment_id=e.id,
                course_id=e.course_id,
                user_id=e.user_id,
                status=e.status.value if hasattr(e.status, "value") else str(e.status),
                access_type=e.access_type.value if hasattr(e.access_type, "value") else str(e.access_type),
                enrolled_at=e.enrolled_at,
                completed_at=e.completed_at,
                expires_at=e.expires_at,
            )
            for e in items
        ]
        return EnrollmentListResponse(
            items=resp_items, total=total, page=page, limit=limit, pages=pages
        )

    async def list_course_enrollments(
        self,
        course_id: UUID,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> EnrollmentListResponse:
        items, total = await self.repo.list_course_enrollments(
            course_id=course_id, page=page, limit=limit, status=status, search=search
        )
        pages = (total + limit - 1) // limit if total > 0 else 1
        resp_items = [
            EnrollmentResponse(
                enrollment_id=e.id,
                course_id=e.course_id,
                user_id=e.user_id,
                status=e.status.value if hasattr(e.status, "value") else str(e.status),
                access_type=e.access_type.value if hasattr(e.access_type, "value") else str(e.access_type),
                enrolled_at=e.enrolled_at,
                completed_at=e.completed_at,
                expires_at=e.expires_at,
            )
            for e in items
        ]
        return EnrollmentListResponse(
            items=resp_items, total=total, page=page, limit=limit, pages=pages
        )

    async def update_student_enrollment(
        self, course_id: UUID, target_user_id: UUID, payload: UpdateEnrollmentRequest
    ) -> EnrollmentResponse:
        enrollment = await self.repo.find_enrollment(target_user_id, course_id)
        if not enrollment:
            raise NotFoundException(
                message="Student enrollment not found", error_code="ENROLLMENT_NOT_FOUND"
            )

        update_dict = payload.model_dump(exclude_unset=True)
        if "status" in update_dict and update_dict["status"]:
            update_dict["status"] = EnrollmentStatus(update_dict["status"])

        updated = await self.repo.update_enrollment(enrollment, update_dict)
        return EnrollmentResponse(
            enrollment_id=updated.id,
            course_id=updated.course_id,
            user_id=updated.user_id,
            status=updated.status.value if hasattr(updated.status, "value") else str(updated.status),
            access_type=updated.access_type.value if hasattr(updated.access_type, "value") else str(updated.access_type),
            enrolled_at=updated.enrolled_at,
            completed_at=updated.completed_at,
            expires_at=updated.expires_at,
        )

    # Learning Progress Services
    async def start_lesson(
        self, user_id: UUID, lesson_id: UUID, payload: Optional[StartLessonRequest] = None
    ) -> LessonProgressResponse:
        lesson = await self.curriculum_repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        module = await self.curriculum_repo.get_module_by_id(lesson.module_id)
        if not module:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")

        enrollment = await self.repo.find_enrollment(user_id, module.course_id)
        if not enrollment or enrollment.status != EnrollmentStatus.ACTIVE:
            if not lesson.is_preview:
                raise ForbiddenException(
                    message="Active course enrollment required to access lesson",
                    error_code="ENROLLMENT_REQUIRED",
                )

        prog = await self.repo.get_or_create_lesson_progress(user_id, lesson_id)
        started_at = (payload.started_at if payload and payload.started_at else None) or datetime.now(timezone.utc)
        
        update_dict = {}
        if prog.status == LessonProgressStatus.NOT_STARTED:
            update_dict["status"] = LessonProgressStatus.IN_PROGRESS
            update_dict["started_at"] = started_at

        updated_prog = await self.repo.update_lesson_progress(prog, update_dict)

        # Update CourseProgress last_lesson_id
        await self.repo.recalculate_course_progress(
            user_id, module.course_id, last_lesson_id=lesson_id
        )

        return LessonProgressResponse(
            lesson_id=updated_prog.lesson_id,
            status=updated_prog.status.value if hasattr(updated_prog.status, "value") else str(updated_prog.status),
            progress_percentage=updated_prog.progress_percentage,
            watch_time=updated_prog.watch_time,
            last_position=updated_prog.last_position,
            started_at=updated_prog.started_at,
            completed_at=updated_prog.completed_at,
        )

    async def update_progress(
        self, user_id: UUID, lesson_id: UUID, payload: UpdateProgressRequest
    ) -> LessonProgressResponse:
        prog = await self.repo.get_or_create_lesson_progress(user_id, lesson_id)

        update_dict = {
            "watch_time": max(prog.watch_time, payload.watch_time),
            "last_position": payload.last_position,
            "progress_percentage": max(prog.progress_percentage, payload.progress_percentage),
        }
        if prog.status == LessonProgressStatus.NOT_STARTED:
            update_dict["status"] = LessonProgressStatus.IN_PROGRESS
            update_dict["started_at"] = datetime.now(timezone.utc)

        if payload.progress_percentage >= 100 and prog.status != LessonProgressStatus.COMPLETED:
            update_dict["status"] = LessonProgressStatus.COMPLETED
            update_dict["completed_at"] = datetime.now(timezone.utc)

        updated_prog = await self.repo.update_lesson_progress(prog, update_dict)

        lesson = await self.curriculum_repo.get_lesson_by_id(lesson_id)
        if lesson:
            module = await self.curriculum_repo.get_module_by_id(lesson.module_id)
            if module:
                await self.repo.recalculate_course_progress(
                    user_id, module.course_id, last_lesson_id=lesson_id
                )

        return LessonProgressResponse(
            lesson_id=updated_prog.lesson_id,
            status=updated_prog.status.value if hasattr(updated_prog.status, "value") else str(updated_prog.status),
            progress_percentage=updated_prog.progress_percentage,
            watch_time=updated_prog.watch_time,
            last_position=updated_prog.last_position,
            started_at=updated_prog.started_at,
            completed_at=updated_prog.completed_at,
        )

    async def complete_lesson(self, user_id: UUID, lesson_id: UUID) -> LessonProgressResponse:
        prog = await self.repo.get_or_create_lesson_progress(user_id, lesson_id)

        update_dict = {
            "status": LessonProgressStatus.COMPLETED,
            "progress_percentage": 100,
            "completed_at": datetime.now(timezone.utc),
        }
        if not prog.started_at:
            update_dict["started_at"] = datetime.now(timezone.utc)

        updated_prog = await self.repo.update_lesson_progress(prog, update_dict)

        lesson = await self.curriculum_repo.get_lesson_by_id(lesson_id)
        if lesson:
            module = await self.curriculum_repo.get_module_by_id(lesson.module_id)
            if module:
                await self.repo.recalculate_course_progress(
                    user_id, module.course_id, last_lesson_id=lesson_id
                )

        return LessonProgressResponse(
            lesson_id=updated_prog.lesson_id,
            status=updated_prog.status.value if hasattr(updated_prog.status, "value") else str(updated_prog.status),
            progress_percentage=updated_prog.progress_percentage,
            watch_time=updated_prog.watch_time,
            last_position=updated_prog.last_position,
            started_at=updated_prog.started_at,
            completed_at=updated_prog.completed_at,
        )

    async def get_lesson_progress(self, user_id: UUID, lesson_id: UUID) -> LessonProgressResponse:
        prog = await self.repo.get_or_create_lesson_progress(user_id, lesson_id)
        return LessonProgressResponse(
            lesson_id=prog.lesson_id,
            status=prog.status.value if hasattr(prog.status, "value") else str(prog.status),
            progress_percentage=prog.progress_percentage,
            watch_time=prog.watch_time,
            last_position=prog.last_position,
            started_at=prog.started_at,
            completed_at=prog.completed_at,
        )

    async def get_course_progress(
        self, user_id: UUID, course_id: UUID
    ) -> CourseProgressResponse:
        c_prog = await self.repo.get_course_progress(user_id, course_id)
        if not c_prog:
            c_prog = await self.repo.recalculate_course_progress(user_id, course_id)

        return CourseProgressResponse(
            course_id=c_prog.course_id,
            completed_lessons=c_prog.completed_lessons,
            total_lessons=c_prog.total_lessons,
            progress_percentage=c_prog.progress_percentage,
            last_lesson_id=c_prog.last_lesson_id,
        )

    async def get_course_completion(self, user_id: UUID, course_id: UUID) -> CompletionResponse:
        enr = await self.repo.find_enrollment(user_id, course_id)
        c_prog = await self.repo.get_course_progress(user_id, course_id)
        if not c_prog:
            c_prog = await self.repo.recalculate_course_progress(user_id, course_id)

        completed = (c_prog.progress_percentage >= 100.0) or (
            enr is not None and enr.status == EnrollmentStatus.COMPLETED
        )
        completed_at = enr.completed_at if enr else None

        return CompletionResponse(
            completed=completed,
            completed_at=completed_at,
            percentage=c_prog.progress_percentage,
        )

    # Continue Learning & Bookmarks
    async def get_continue_learning(self, user_id: UUID) -> ContinueLearningResponse:
        raw_items = await self.repo.get_continue_learning(user_id)
        items = [ContinueLearningItem(**i) for i in raw_items]
        return ContinueLearningResponse(items=items)

    async def get_learning_history(
        self, user_id: UUID, limit: int = 20
    ) -> List[LearningHistoryItem]:
        raw_history = await self.repo.get_learning_history(user_id, limit=limit)
        return [LearningHistoryItem(**h) for h in raw_history]

    async def create_bookmark(
        self, user_id: UUID, lesson_id: UUID, payload: BookmarkRequest
    ) -> BookmarkResponse:
        lesson = await self.curriculum_repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        bm = await self.repo.create_bookmark(
            user_id=user_id,
            lesson_id=lesson_id,
            timestamp_seconds=payload.timestamp_seconds,
            note=payload.note,
        )
        return BookmarkResponse(
            id=bm.id,
            user_id=bm.user_id,
            lesson_id=bm.lesson_id,
            timestamp_seconds=bm.timestamp_seconds,
            note=bm.note,
            created_at=bm.created_at,
        )

    async def list_bookmarks(self, user_id: UUID, lesson_id: UUID) -> List[BookmarkResponse]:
        bms = await self.repo.list_bookmarks(user_id, lesson_id)
        return [
            BookmarkResponse(
                id=bm.id,
                user_id=bm.user_id,
                lesson_id=bm.lesson_id,
                timestamp_seconds=bm.timestamp_seconds,
                note=bm.note,
                created_at=bm.created_at,
            )
            for bm in bms
        ]

    async def update_bookmark(
        self, bookmark_id: UUID, user_id: UUID, note: Optional[str]
    ) -> BookmarkResponse:
        bm = await self.repo.get_bookmark(bookmark_id)
        if not bm or bm.user_id != user_id:
            raise NotFoundException(message="Bookmark not found", error_code="BOOKMARK_NOT_FOUND")

        updated = await self.repo.update_bookmark(bm, note)
        return BookmarkResponse(
            id=updated.id,
            user_id=updated.user_id,
            lesson_id=updated.lesson_id,
            timestamp_seconds=updated.timestamp_seconds,
            note=updated.note,
            created_at=updated.created_at,
        )

    async def delete_bookmark(self, bookmark_id: UUID, user_id: UUID) -> None:
        success = await self.repo.delete_bookmark(bookmark_id, user_id)
        if not success:
            raise NotFoundException(message="Bookmark not found", error_code="BOOKMARK_NOT_FOUND")

    async def get_enrollment_statistics(self, course_id: UUID) -> EnrollmentStatisticsResponse:
        stats = await self.repo.get_enrollment_statistics(course_id)
        return EnrollmentStatisticsResponse(**stats)
