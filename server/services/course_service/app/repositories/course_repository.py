import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseStatus, CourseAccessType, CourseLevel
from app.models.course_instructor import CourseInstructor


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, course_id: uuid.UUID) -> Course | None:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Course | None:
        result = await self.db.execute(select(Course).where(Course.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_institution_and_slug(self, institution_id: uuid.UUID, slug: str) -> Course | None:
        result = await self.db.execute(
            select(Course).where(
                Course.institution_id == institution_id,
                Course.slug == slug
            )
        )
        return result.scalar_one_or_none()

    async def create(self, course: Course) -> Course:
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def update(self, course: Course) -> Course:
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def delete(self, course_id: uuid.UUID) -> bool:
        course = await self.get_by_id(course_id)
        if course:
            await self.db.delete(course)
            await self.db.commit()
            return True
        return False

    async def list_by_institution(
        self,
        institution_id: uuid.UUID,
        page: int = 1,
        limit: int = 20
    ) -> tuple[list[Course], int]:
        offset = (page - 1) * limit
        
        # Get count
        from sqlalchemy import func
        count_stmt = select(func.count(Course.id)).where(Course.institution_id == institution_id)
        total_count = (await self.db.execute(count_stmt)).scalar() or 0

        # Get records
        stmt = select(Course).where(Course.institution_id == institution_id).offset(offset).limit(limit)
        results = await self.db.execute(stmt)
        return list(results.scalars().all()), total_count

    async def list_public(
        self,
        page: int = 1,
        limit: int = 20,
        category: str | None = None,
        level: str | None = None,
        language: str | None = None
    ) -> tuple[list[Course], int]:
        offset = (page - 1) * limit
        
        stmt = select(Course).where(Course.status == CourseStatus.PUBLISHED)
        
        if category:
            stmt = stmt.where(Course.category == category)
        if level:
            stmt = stmt.where(Course.level == CourseLevel(level))
        if language:
            stmt = stmt.where(Course.language == language)

        # Count total matching
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = (await self.db.execute(count_stmt)).scalar() or 0

        # Get paginated matching
        stmt = stmt.offset(offset).limit(limit)
        results = await self.db.execute(stmt)
        return list(results.scalars().all()), total_count


class InstructorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_instructors(self, course_id: uuid.UUID) -> list[CourseInstructor]:
        result = await self.db.execute(
            select(CourseInstructor).where(CourseInstructor.course_id == course_id)
        )
        return list(result.scalars().all())

    async def add_instructor(self, course_id: uuid.UUID, user_id: uuid.UUID) -> CourseInstructor:
        # Check if already exists
        existing_stmt = select(CourseInstructor).where(
            CourseInstructor.course_id == course_id,
            CourseInstructor.user_id == user_id
        )
        existing = (await self.db.execute(existing_stmt)).scalar_one_or_none()
        if existing:
            return existing

        instructor = CourseInstructor(course_id=course_id, user_id=user_id)
        self.db.add(instructor)
        await self.db.commit()
        await self.db.refresh(instructor)
        return instructor

    async def remove_instructor(self, course_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = delete(CourseInstructor).where(
            CourseInstructor.course_id == course_id,
            CourseInstructor.user_id == user_id
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
