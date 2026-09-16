from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.redis_client import cache_delete, tenant_key
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException, ValidationException
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.review import CourseReview
from app.models.user import User
from app.schemas.review import CreateReviewRequest, ReviewListResponse, ReviewResponse


class ReviewService:
    def __init__(self, db: AsyncSession, redis=None):
        self.db = db
        self.redis = redis

    async def create_review(
        self,
        course_id: UUID,
        user_id: UUID,
        payload: CreateReviewRequest,
    ) -> ReviewResponse:
        # 1. Course check
        res = await self.db.execute(select(Course).where(Course.id == course_id))
        course = res.scalars().first()
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        # 2. Enrollment check — only enrolled students can leave reviews
        enr_res = await self.db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ACTIVE,
            )
        )
        if not enr_res.scalars().first():
            raise ForbiddenException(
                message="You must be enrolled in this course to leave a review.",
                error_code="ENROLLMENT_REQUIRED",
            )

        # 3. Check existing review
        existing_res = await self.db.execute(
            select(CourseReview).where(
                CourseReview.course_id == course_id,
                CourseReview.user_id == user_id,
            )
        )
        existing = existing_res.scalars().first()

        if existing:
            existing.rating = payload.rating
            existing.title = payload.title
            existing.comment = payload.comment
            review = existing
        else:
            review = CourseReview(
                course_id=course_id,
                user_id=user_id,
                rating=payload.rating,
                title=payload.title,
                comment=payload.comment,
                is_approved=True,
            )
            self.db.add(review)

        await self.db.flush()

        # 4. Recalculate course avg_rating & review_count
        stats_res = await self.db.execute(
            select(
                func.count(CourseReview.id),
                func.avg(CourseReview.rating),
            ).where(
                CourseReview.course_id == course_id,
                CourseReview.is_approved == True,
            )
        )
        count, avg_val = stats_res.first() or (0, 0.0)
        course.review_count = count
        course.avg_rating = round(Decimal(str(avg_val or 0.0)), 2)
        await self.db.flush()

        # 5. Invalidate cache if available
        if self.redis:
            await cache_delete(self.redis, tenant_key(course.institution_id, "courses", "list"))

        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()

        return ReviewResponse(
            id=review.id,
            course_id=review.course_id,
            user_id=review.user_id,
            user_name=user.name if user else "Anonymous",
            user_avatar=getattr(user, "avatar_url", None) if user else None,
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            created_at=review.created_at,
        )

    async def list_course_reviews(
        self,
        course_id: UUID,
        page: int = 1,
        limit: int = 20,
    ) -> ReviewListResponse:
        count_res = await self.db.execute(
            select(func.count(CourseReview.id)).where(
                CourseReview.course_id == course_id,
                CourseReview.is_approved == True,
            )
        )
        total = count_res.scalar_one()

        avg_res = await self.db.execute(
            select(func.avg(CourseReview.rating)).where(
                CourseReview.course_id == course_id,
                CourseReview.is_approved == True,
            )
        )
        avg_val = avg_res.scalar_one() or 0.0

        # Distribution count per star
        dist_res = await self.db.execute(
            select(CourseReview.rating, func.count(CourseReview.id))
            .where(CourseReview.course_id == course_id, CourseReview.is_approved == True)
            .group_by(CourseReview.rating)
        )
        dist_dict = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for star, cnt in dist_res.all():
            dist_dict[star] = cnt

        # Fetch page of reviews with User join
        query = (
            select(CourseReview, User)
            .join(User, CourseReview.user_id == User.id)
            .where(CourseReview.course_id == course_id, CourseReview.is_approved == True)
            .order_by(CourseReview.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        items = []
        for rev, usr in res.all():
            items.append(
                ReviewResponse(
                    id=rev.id,
                    course_id=rev.course_id,
                    user_id=rev.user_id,
                    user_name=usr.name,
                    user_avatar=getattr(usr, "avatar_url", None),
                    rating=rev.rating,
                    title=rev.title,
                    comment=rev.comment,
                    created_at=rev.created_at,
                )
            )

        return ReviewListResponse(
            items=items,
            total=total,
            avg_rating=round(Decimal(str(avg_val)), 2),
            rating_distribution=dist_dict,
        )
