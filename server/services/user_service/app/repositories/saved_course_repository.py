import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_course import SavedCourse


class SavedCourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_and_course(self, user_id: uuid.UUID, course_id: uuid.UUID) -> SavedCourse | None:
        result = await self.db.execute(
            select(SavedCourse).where(
                SavedCourse.user_id == user_id,
                SavedCourse.course_id == course_id
            )
        )
        return result.scalar_one_or_none()

    async def get_all_for_user(self, user_id: uuid.UUID) -> list[SavedCourse]:
        result = await self.db.execute(select(SavedCourse).where(SavedCourse.user_id == user_id))
        return list(result.scalars().all())

    async def save(self, user_id: uuid.UUID, course_id: uuid.UUID) -> SavedCourse:
        saved = SavedCourse(user_id=user_id, course_id=course_id)
        self.db.add(saved)
        await self.db.commit()
        await self.db.refresh(saved)
        return saved

    async def unsave(self, user_id: uuid.UUID, course_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            delete(SavedCourse).where(
                SavedCourse.user_id == user_id,
                SavedCourse.course_id == course_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0
