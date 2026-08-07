from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.course import CourseAccessType
from app.models.curriculum import LessonVisibility
from app.repositories.course_repository import CourseRepository
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import CourseAccessResponse, LessonAccessResponse


class AccessService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.course_repo = CourseRepository(db)
        self.curriculum_repo = CurriculumRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    async def can_access_course(
        self, course_id: UUID, user_id: Optional[UUID] = None
    ) -> CourseAccessResponse:
        course = await self.course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        access_type_str = course.access_type.value if hasattr(course.access_type, "value") else str(course.access_type)

        if access_type_str == CourseAccessType.FREE.value:
            return CourseAccessResponse(allowed=True, reason="Free Course", access_type=access_type_str)

        if not user_id:
            return CourseAccessResponse(allowed=False, reason="Authentication Required", access_type=access_type_str)

        # Check Team Membership
        is_member = await self.payment_repo.is_user_institution_member(user_id, course.institution_id)
        if is_member:
            return CourseAccessResponse(allowed=True, reason="Institution Team Member", access_type="TEAM_MEMBER")

        # Check One-Time Purchase
        has_purchased = await self.payment_repo.has_user_purchased_course(user_id, course_id)
        if has_purchased:
            return CourseAccessResponse(allowed=True, reason="Course Purchased", access_type="PURCHASED")

        # Check Membership Subscription
        has_sub = await self.payment_repo.has_user_active_plan_for_course(user_id, course_id)
        if has_sub:
            return CourseAccessResponse(allowed=True, reason="Active Membership Subscription", access_type="MEMBERSHIP")

        # Check Active Enrollment
        enr = await self.enrollment_repo.find_enrollment(user_id, course_id)
        if enr and str(enr.status) == "ACTIVE":
            return CourseAccessResponse(allowed=True, reason="Active Enrollment", access_type=access_type_str)

        return CourseAccessResponse(allowed=False, reason="Enrollment / Purchase Required", access_type=access_type_str)

    async def can_access_lesson(
        self, lesson_id: UUID, user_id: Optional[UUID] = None
    ) -> LessonAccessResponse:
        lesson = await self.curriculum_repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        if lesson.is_preview:
            return LessonAccessResponse(allowed=True, reason="Free Preview Lesson")

        visibility_str = lesson.visibility.value if hasattr(lesson.visibility, "value") else str(lesson.visibility)
        if visibility_str == LessonVisibility.PUBLIC.value:
            return LessonAccessResponse(allowed=True, reason="Public Lesson")

        if not user_id:
            return LessonAccessResponse(allowed=False, reason="Authentication Required")

        module = await self.curriculum_repo.get_module_by_id(lesson.module_id)
        if not module:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")

        c_access = await self.can_access_course(module.course_id, user_id=user_id)
        if c_access.allowed:
            return LessonAccessResponse(allowed=True, reason=f"Allowed via {c_access.reason}")

        return LessonAccessResponse(allowed=False, reason="Course Enrollment or Purchase Required")
