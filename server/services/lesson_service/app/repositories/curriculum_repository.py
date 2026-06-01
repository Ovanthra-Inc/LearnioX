import uuid
from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course_module import CourseModule
from app.models.lesson import Lesson


class CurriculumRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------ MODULES ------------------

    async def get_module_by_id(self, module_id: uuid.UUID) -> CourseModule | None:
        result = await self.db.execute(select(CourseModule).where(CourseModule.id == module_id))
        return result.scalar_one_or_none()

    async def list_modules(self, course_id: uuid.UUID) -> list[CourseModule]:
        result = await self.db.execute(
            select(CourseModule)
            .where(CourseModule.course_id == course_id)
            .order_by(CourseModule.order_index.asc())
        )
        return list(result.scalars().all())

    async def create_module(self, module: CourseModule) -> CourseModule:
        self.db.add(module)
        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def update_module(self, module: CourseModule) -> CourseModule:
        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def delete_module(self, module_id: uuid.UUID) -> bool:
        module = await self.get_module_by_id(module_id)
        if module:
            # Also delete lessons associated with this module
            await self.db.execute(
                update(Lesson).where(Lesson.module_id == module_id).values(is_published=False)
            ) # Or just delete lessons
            from sqlalchemy import delete
            await self.db.execute(delete(Lesson).where(Lesson.module_id == module_id))
            await self.db.delete(module)
            await self.db.commit()
            return True
        return False

    async def reorder_modules(self, module_orders: dict[uuid.UUID, int]) -> None:
        for module_id, order in module_orders.items():
            await self.db.execute(
                update(CourseModule)
                .where(CourseModule.id == module_id)
                .values(order_index=order)
            )
        await self.db.commit()

    # ------------------ LESSONS ------------------

    async def get_lesson_by_id(self, lesson_id: uuid.UUID) -> Lesson | None:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        return result.scalar_one_or_none()

    async def list_lessons(self, module_id: uuid.UUID) -> list[Lesson]:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.order_index.asc())
        )
        return list(result.scalars().all())

    async def list_course_lessons(self, course_id: uuid.UUID) -> list[Lesson]:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.order_index.asc())
        )
        return list(result.scalars().all())

    async def create_lesson(self, lesson: Lesson) -> Lesson:
        self.db.add(lesson)
        await self.db.commit()
        await self.db.refresh(lesson)
        return lesson

    async def update_lesson(self, lesson: Lesson) -> Lesson:
        await self.db.commit()
        await self.db.refresh(lesson)
        return lesson

    async def delete_lesson(self, lesson_id: uuid.UUID) -> bool:
        lesson = await self.get_lesson_by_id(lesson_id)
        if lesson:
            await self.db.delete(lesson)
            await self.db.commit()
            return True
        return False

    async def reorder_lessons(self, lesson_orders: dict[uuid.UUID, int]) -> None:
        for lesson_id, order in lesson_orders.items():
            await self.db.execute(
                update(Lesson)
                .where(Lesson.id == lesson_id)
                .values(order_index=order)
            )
        await self.db.commit()
