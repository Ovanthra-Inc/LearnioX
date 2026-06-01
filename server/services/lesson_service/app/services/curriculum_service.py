import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.course_module import CourseModule
from app.models.lesson import Lesson, LessonType, LessonAccessType
from app.repositories.curriculum_repository import CurriculumRepository
from app.schemas.requests import (
    CreateModuleRequest,
    UpdateModuleRequest,
    CreateLessonRequest,
    UpdateLessonRequest,
    ReorderCurriculumRequest
)


class CurriculumService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CurriculumRepository(db)

    # ------------------ CURRICULUM ------------------

    async def get_curriculum(self, course_id: uuid.UUID) -> tuple[list[CourseModule], list[Lesson]]:
        modules = await self.repo.list_modules(course_id)
        lessons = await self.repo.list_course_lessons(course_id)
        return modules, lessons

    async def reorder_curriculum(self, course_id: uuid.UUID, request: ReorderCurriculumRequest) -> tuple[list[CourseModule], list[Lesson]]:
        # The request.modules list contains dictionaries representing module order and their nested lessons order
        # Example format: [{"module_id": "...", "order_index": 0, "lessons": [{"lesson_id": "...", "order_index": 0}]}]
        module_orders = {}
        lesson_orders = {}
        for m in request.modules:
            m_id = uuid.UUID(str(m["module_id"]))
            module_orders[m_id] = int(m["order_index"])
            for l in m.get("lessons", []):
                l_id = uuid.UUID(str(l["lesson_id"]))
                lesson_orders[l_id] = int(l["order_index"])

        if module_orders:
            await self.repo.reorder_modules(module_orders)
        if lesson_orders:
            await self.repo.reorder_lessons(lesson_orders)

        return await self.get_curriculum(course_id)

    # ------------------ MODULES ------------------

    async def create_module(self, course_id: uuid.UUID, request: CreateModuleRequest) -> CourseModule:
        module = CourseModule(
            course_id=course_id,
            title=request.title,
            description=request.description,
            order_index=request.order_index
        )
        return await self.repo.create_module(module)

    async def get_module_by_id(self, module_id: uuid.UUID) -> CourseModule:
        module = await self.repo.get_module_by_id(module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        return module

    async def list_modules(self, course_id: uuid.UUID) -> list[CourseModule]:
        return await self.repo.list_modules(course_id)

    async def update_module(self, module_id: uuid.UUID, request: UpdateModuleRequest) -> CourseModule:
        module = await self.get_module_by_id(module_id)
        if request.title is not None:
            module.title = request.title
        if request.description is not None:
            module.description = request.description
        if request.order_index is not None:
            module.order_index = request.order_index
        return await self.repo.update_module(module)

    async def delete_module(self, module_id: uuid.UUID) -> bool:
        return await self.repo.delete_module(module_id)

    async def reorder_modules(self, module_orders: dict[uuid.UUID, int]) -> None:
        await self.repo.reorder_modules(module_orders)

    # ------------------ LESSONS ------------------

    async def create_lesson(self, course_id: uuid.UUID, module_id: uuid.UUID, request: CreateLessonRequest) -> Lesson:
        # Verify module exists
        await self.get_module_by_id(module_id)

        lesson = Lesson(
            course_id=course_id,
            module_id=module_id,
            title=request.title,
            description=request.description,
            lesson_type=LessonType(request.lesson_type),
            access_type=LessonAccessType(request.access_type),
            order_index=request.order_index,
            video_id=request.video_id,
            asset_id=request.asset_id,
            content=request.content,
            external_url=request.external_url,
            duration_seconds=request.duration_seconds,
            is_published=False,
            metadata_json={}
        )
        return await self.repo.create_lesson(lesson)

    async def get_lesson_by_id(self, lesson_id: uuid.UUID) -> Lesson:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        return lesson

    async def list_lessons(self, module_id: uuid.UUID) -> list[Lesson]:
        return await self.repo.list_lessons(module_id)

    async def update_lesson(self, lesson_id: uuid.UUID, request: UpdateLessonRequest) -> Lesson:
        lesson = await self.get_lesson_by_id(lesson_id)
        
        if request.title is not None:
            lesson.title = request.title
        if request.description is not None:
            lesson.description = request.description
        if request.access_type is not None:
            lesson.access_type = LessonAccessType(request.access_type)
        if request.video_id is not None:
            lesson.video_id = request.video_id
        if request.asset_id is not None:
            lesson.asset_id = request.asset_id
        if request.content is not None:
            lesson.content = request.content
        if request.external_url is not None:
            lesson.external_url = request.external_url
        if request.duration_seconds is not None:
            lesson.duration_seconds = request.duration_seconds

        return await self.repo.update_lesson(lesson)

    async def delete_lesson(self, lesson_id: uuid.UUID) -> bool:
        return await self.repo.delete_lesson(lesson_id)

    async def reorder_lessons(self, lesson_orders: dict[uuid.UUID, int]) -> None:
        await self.repo.reorder_lessons(lesson_orders)

    # ------------------ SPECIALIZED OPERATIONS ------------------

    async def patch_lesson_access(self, lesson_id: uuid.UUID, access_type: str) -> Lesson:
        lesson = await self.get_lesson_by_id(lesson_id)
        lesson.access_type = LessonAccessType(access_type)
        return await self.repo.update_lesson(lesson)

    async def patch_lesson_drip(self, lesson_id: uuid.UUID, drip_config: dict) -> Lesson:
        lesson = await self.get_lesson_by_id(lesson_id)
        if lesson.metadata_json is None:
            lesson.metadata_json = {}
        lesson.metadata_json["drip_schedule"] = drip_config
        # We need to flag SQLAlchemy that metadata_json changed if using mutable JSON
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(lesson, "metadata_json")
        return await self.repo.update_lesson(lesson)

    async def mark_preview(self, lesson_id: uuid.UUID) -> Lesson:
        lesson = await self.get_lesson_by_id(lesson_id)
        lesson.access_type = LessonAccessType.FREE_PREVIEW
        return await self.repo.update_lesson(lesson)

    async def remove_preview(self, lesson_id: uuid.UUID) -> Lesson:
        lesson = await self.get_lesson_by_id(lesson_id)
        lesson.access_type = LessonAccessType.ENROLLED_ONLY
        return await self.repo.update_lesson(lesson)
