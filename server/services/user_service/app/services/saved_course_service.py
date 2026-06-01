import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.saved_course import SavedCourse
from app.repositories.saved_course_repository import SavedCourseRepository


class SavedCourseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SavedCourseRepository(db)

    async def save_course(self, user_id: uuid.UUID, course_id: uuid.UUID) -> SavedCourse:
        existing = await self.repo.get_by_user_and_course(user_id, course_id)
        if existing:
            return existing
        return await self.repo.save(user_id, course_id)

    async def unsave_course(self, user_id: uuid.UUID, course_id: uuid.UUID) -> bool:
        return await self.repo.unsave(user_id, course_id)

    async def get_saved_courses(self, user_id: uuid.UUID) -> list[SavedCourse]:
        return await self.repo.get_all_for_user(user_id)
