import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.enrollment import Enrollment, EnrollmentStatus, EnrollmentSource
from app.repositories.enrollment_repository import EnrollmentRepository
from app.schemas.requests import EnrollCourseRequest, CourseAccessCheckRequest, LessonAccessCheckRequest, BulkAccessCheckRequest
from app.schemas.responses import AccessCheckResponse, BulkAccessCheckResponse


class EnrollmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = EnrollmentRepository(db)

    # ─────────────────────────────────────────
    # ENROLL
    # ─────────────────────────────────────────
    async def enroll(
        self,
        course_id: uuid.UUID,
        requesting_user_id: uuid.UUID,
        request: EnrollCourseRequest,
    ) -> Enrollment:
        # The actual learner is the requesting user unless an override is supplied (admin action)
        learner_id = request.user_id or requesting_user_id

        # Idempotency – return existing active enrollment
        existing = await self.repo.get_by_user_and_course(learner_id, course_id)
        if existing:
            return existing

        enrollment = Enrollment(
            user_id=learner_id,
            course_id=course_id,
            institution_id=request.institution_id,
            source=EnrollmentSource(request.source),
            status=EnrollmentStatus.ACTIVE,
            payment_id=request.payment_id,
            subscription_id=request.subscription_id,
        )
        return await self.repo.create(enrollment)

    # ─────────────────────────────────────────
    # QUERIES
    # ─────────────────────────────────────────
    async def get_enrollment_by_id(self, enrollment_id: uuid.UUID) -> Enrollment:
        enrollment = await self.repo.get_by_id(enrollment_id)
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
        return enrollment

    async def list_my_enrollments(
        self, user_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> tuple[list[Enrollment], int]:
        return await self.repo.list_by_user(user_id, page, limit)

    async def list_course_enrollments(
        self, course_id: uuid.UUID, page: int = 1, limit: int = 20
    ) -> tuple[list[Enrollment], int]:
        return await self.repo.list_by_course(course_id, page, limit)

    # ─────────────────────────────────────────
    # STATUS MUTATIONS
    # ─────────────────────────────────────────
    async def cancel(self, enrollment_id: uuid.UUID) -> Enrollment:
        e = await self.get_enrollment_by_id(enrollment_id)
        e.status = EnrollmentStatus.CANCELLED
        return await self.repo.update(e)

    async def expire(self, enrollment_id: uuid.UUID) -> Enrollment:
        e = await self.get_enrollment_by_id(enrollment_id)
        e.status = EnrollmentStatus.EXPIRED
        return await self.repo.update(e)

    async def reactivate(self, enrollment_id: uuid.UUID) -> Enrollment:
        e = await self.get_enrollment_by_id(enrollment_id)
        e.status = EnrollmentStatus.ACTIVE
        return await self.repo.update(e)

    # ─────────────────────────────────────────
    # ACCESS CHECKS
    # ─────────────────────────────────────────
    async def check_course_access(self, req: CourseAccessCheckRequest) -> AccessCheckResponse:
        enrollment = await self.repo.get_by_user_and_course(req.user_id, req.course_id)
        if enrollment and enrollment.status == EnrollmentStatus.ACTIVE:
            return AccessCheckResponse(
                allowed=True,
                reason="active_enrollment",
                access_type=enrollment.source.value,
                enrollment_id=enrollment.id,
            )
        return AccessCheckResponse(allowed=False, reason="not_enrolled")

    async def check_lesson_access(self, req: LessonAccessCheckRequest) -> AccessCheckResponse:
        # Lesson-level access falls back to course enrollment check.
        # Lesson-specific rules (free_preview, drip) are enforced by lesson_service.
        # Here we simply check the enrollment gate.
        enrollment = await self.repo.get_by_user_and_course(req.user_id, req.course_id)
        if enrollment and enrollment.status == EnrollmentStatus.ACTIVE:
            return AccessCheckResponse(
                allowed=True,
                reason="enrolled",
                access_type=enrollment.source.value,
                enrollment_id=enrollment.id,
            )
        return AccessCheckResponse(allowed=False, reason="not_enrolled")

    async def bulk_check_access(self, req: BulkAccessCheckRequest) -> BulkAccessCheckResponse:
        courses_result: dict[str, bool] = {}
        for course_id in req.course_ids:
            enrollment = await self.repo.get_by_user_and_course(req.user_id, course_id)
            courses_result[str(course_id)] = (
                enrollment is not None and enrollment.status == EnrollmentStatus.ACTIVE
            )
        # Lesson access derives from course access – we need course_id per lesson but that
        # info isn't in this service's DB. Return False for now; caller should use lesson-level check.
        lessons_result: dict[str, bool] = {str(lid): False for lid in req.lesson_ids}
        return BulkAccessCheckResponse(
            user_id=req.user_id,
            courses=courses_result,
            lessons=lessons_result,
        )

    async def get_user_course_access(self, user_id: uuid.UUID, course_id: uuid.UUID) -> AccessCheckResponse:
        return await self.check_course_access(CourseAccessCheckRequest(user_id=user_id, course_id=course_id))
