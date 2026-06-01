import uuid
from sqlalchemy import select, and_, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment, EnrollmentStatus, EnrollmentSource


class EnrollmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, enrollment_id: uuid.UUID) -> Enrollment | None:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.id == enrollment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_course(self, user_id: uuid.UUID, course_id: uuid.UUID) -> Enrollment | None:
        result = await self.db.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.user_id == user_id,
                    Enrollment.course_id == course_id,
                    Enrollment.status == EnrollmentStatus.ACTIVE
                )
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, page: int = 1, limit: int = 20) -> tuple[list[Enrollment], int]:
        offset = (page - 1) * limit
        from sqlalchemy import func
        count_stmt = select(func.count(Enrollment.id)).where(Enrollment.user_id == user_id)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Enrollment)
            .where(Enrollment.user_id == user_id)
            .offset(offset)
            .limit(limit)
            .order_by(Enrollment.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def list_by_course(self, course_id: uuid.UUID, page: int = 1, limit: int = 20) -> tuple[list[Enrollment], int]:
        offset = (page - 1) * limit
        from sqlalchemy import func
        count_stmt = select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Enrollment)
            .where(Enrollment.course_id == course_id)
            .offset(offset)
            .limit(limit)
            .order_by(Enrollment.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, enrollment: Enrollment) -> Enrollment:
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def update(self, enrollment: Enrollment) -> Enrollment:
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment
