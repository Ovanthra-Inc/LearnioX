from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.redis_client import cache_get, cache_set, tenant_key
from app.core.config import settings
from app.core.exceptions import NotFoundException
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.institution import Institution
from app.models.payment import CoursePurchase, PaymentStatus
from app.schemas.analytics import CourseAnalyticsResponse, InstitutionAnalyticsResponse


class AnalyticsService:
    def __init__(self, db: AsyncSession, redis=None):
        self.db = db
        self.redis = redis

    async def get_institution_analytics(
        self,
        institution_id: UUID,
    ) -> InstitutionAnalyticsResponse:
        # Check cache
        cache_key = tenant_key(institution_id, "analytics", "summary")
        cached = await cache_get(self.redis, cache_key)
        if cached:
            return InstitutionAnalyticsResponse(**cached)

        inst_res = await self.db.execute(select(Institution).where(Institution.id == institution_id))
        inst = inst_res.scalars().first()
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")

        # Courses count
        courses_res = await self.db.execute(
            select(
                func.count(Course.id),
                func.count(Course.id).filter(Course.status == CourseStatus.PUBLISHED),
            ).where(Course.institution_id == institution_id)
        )
        total_courses, total_published = courses_res.first() or (0, 0)

        # Enrollments stats
        enr_res = await self.db.execute(
            select(
                func.count(func.distinct(Enrollment.user_id)),
                func.count(Enrollment.id),
                func.count(Enrollment.id).filter(Enrollment.status == EnrollmentStatus.ACTIVE),
                func.count(Enrollment.id).filter(Enrollment.status == EnrollmentStatus.COMPLETED),
            ).where(Enrollment.institution_id == institution_id)
        )
        total_students, total_enrollments, active_enr, completed_enr = enr_res.first() or (0, 0, 0, 0)

        # 7-day window
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_enr_res = await self.db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.institution_id == institution_id,
                Enrollment.enrolled_at >= seven_days_ago,
            )
        )
        recent_enr_7d = recent_enr_res.scalar_one() or 0

        # Revenue
        rev_res = await self.db.execute(
            select(func.coalesce(func.sum(CoursePurchase.amount), Decimal("0.00")))
            .join(Course, CoursePurchase.course_id == Course.id)
            .where(
                Course.institution_id == institution_id,
                CoursePurchase.status == PaymentStatus.SUCCESS,
            )
        )
        total_revenue = rev_res.scalar_one() or Decimal("0.00")

        recent_rev_res = await self.db.execute(
            select(func.coalesce(func.sum(CoursePurchase.amount), Decimal("0.00")))
            .join(Course, CoursePurchase.course_id == Course.id)
            .where(
                Course.institution_id == institution_id,
                CoursePurchase.status == PaymentStatus.SUCCESS,
                CoursePurchase.created_at >= seven_days_ago,
            )
        )
        recent_revenue_7d = recent_rev_res.scalar_one() or Decimal("0.00")

        data = InstitutionAnalyticsResponse(
            institution_id=institution_id,
            total_courses=total_courses,
            total_published_courses=total_published,
            total_students=total_students,
            total_enrollments=total_enrollments,
            active_enrollments=active_enr,
            completed_enrollments=completed_enr,
            total_revenue=round(total_revenue, 2),
            currency=inst.currency or "INR",
            recent_enrollments_count_7d=recent_enr_7d,
            recent_revenue_7d=round(recent_revenue_7d, 2),
        )

        # Cache result
        await cache_set(self.redis, cache_key, data.model_dump(), ttl=settings.CACHE_TTL_ANALYTICS)
        return data

    async def get_course_analytics(self, course_id: UUID) -> CourseAnalyticsResponse:
        course_res = await self.db.execute(select(Course).where(Course.id == course_id))
        course = course_res.scalars().first()
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        enr_res = await self.db.execute(
            select(
                func.count(Enrollment.id),
                func.count(Enrollment.id).filter(Enrollment.status == EnrollmentStatus.ACTIVE),
                func.count(Enrollment.id).filter(Enrollment.status == EnrollmentStatus.COMPLETED),
            ).where(Enrollment.course_id == course_id)
        )
        total_enr, active_students, completed = enr_res.first() or (0, 0, 0)
        completion_rate = (completed / total_enr * 100.0) if total_enr > 0 else 0.0

        rev_res = await self.db.execute(
            select(func.coalesce(func.sum(CoursePurchase.amount), Decimal("0.00"))).where(
                CoursePurchase.course_id == course_id,
                CoursePurchase.status == PaymentStatus.SUCCESS,
            )
        )
        total_rev = rev_res.scalar_one() or Decimal("0.00")

        return CourseAnalyticsResponse(
            course_id=course_id,
            course_title=course.title,
            total_enrollments=total_enr,
            active_students=active_students,
            completion_rate_percent=round(completion_rate, 1),
            avg_rating=course.avg_rating or Decimal("0.00"),
            review_count=course.review_count or 0,
            total_revenue=round(total_rev, 2),
        )
