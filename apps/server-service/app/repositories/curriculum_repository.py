from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, and_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.curriculum import (
    ContentType,
    CourseModule,
    Lesson,
    LessonContent,
    LessonResource,
    LessonStatus,
    LessonType,
    LessonVisibility,
)


class CurriculumRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Module Operations
    async def create_module(
        self,
        course_id: UUID,
        title: str,
        description: Optional[str] = None,
        is_free: bool = False,
        created_by: Optional[UUID] = None,
    ) -> CourseModule:
        max_pos_res = await self.db.execute(
            select(func.coalesce(func.max(CourseModule.position), 0)).where(
                CourseModule.course_id == course_id
            )
        )
        max_pos = max_pos_res.scalar_one()

        module = CourseModule(
            course_id=course_id,
            title=title.strip(),
            description=description,
            position=max_pos + 1,
            is_free=is_free,
            is_published=True,
            created_by=created_by,
        )
        self.db.add(module)
        await self.db.flush()
        await self.db.refresh(module)
        return module

    async def get_module_by_id(self, module_id: UUID) -> Optional[CourseModule]:
        res = await self.db.execute(
            select(CourseModule).where(CourseModule.id == module_id)
        )
        return res.scalars().first()

    async def list_modules(self, course_id: UUID) -> List[CourseModule]:
        res = await self.db.execute(
            select(CourseModule)
            .where(CourseModule.course_id == course_id)
            .order_by(CourseModule.position.asc())
        )
        return list(res.scalars().all())

    async def update_module(
        self, module: CourseModule, update_dict: dict
    ) -> CourseModule:
        for k, v in update_dict.items():
            if v is not None:
                setattr(module, k, v)
        await self.db.flush()
        await self.db.refresh(module)
        return module

    async def delete_module(self, module_id: UUID) -> bool:
        mod = await self.get_module_by_id(module_id)
        if not mod:
            return False
        await self.db.delete(mod)
        await self.db.flush()
        return True

    async def reorder_modules(self, course_id: UUID, module_ids: List[UUID]) -> bool:
        for index, m_id in enumerate(module_ids, start=1):
            await self.db.execute(
                update(CourseModule)
                .where(
                    and_(
                        CourseModule.id == m_id,
                        CourseModule.course_id == course_id,
                    )
                )
                .values(position=index)
            )
        await self.db.flush()
        return True

    # Lesson Operations
    async def create_lesson(
        self,
        module_id: UUID,
        title: str,
        description: Optional[str] = None,
        lesson_type: LessonType = LessonType.VIDEO,
        visibility: LessonVisibility = LessonVisibility.ENROLLED,
        is_preview: bool = False,
        created_by: Optional[UUID] = None,
    ) -> Lesson:
        max_pos_res = await self.db.execute(
            select(func.coalesce(func.max(Lesson.position), 0)).where(
                Lesson.module_id == module_id
            )
        )
        max_pos = max_pos_res.scalar_one()

        lesson = Lesson(
            module_id=module_id,
            title=title.strip(),
            description=description,
            lesson_type=lesson_type,
            visibility=visibility,
            is_preview=is_preview,
            position=max_pos + 1,
            status=LessonStatus.DRAFT,
            created_by=created_by,
        )
        self.db.add(lesson)
        await self.db.flush()
        await self.db.refresh(lesson)
        return lesson

    async def get_lesson_by_id(self, lesson_id: UUID) -> Optional[Lesson]:
        res = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        return res.scalars().first()

    async def list_lessons(self, module_id: UUID) -> List[Lesson]:
        res = await self.db.execute(
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.position.asc())
        )
        return list(res.scalars().all())

    async def search_lessons(
        self,
        keyword: Optional[str] = None,
        course_id: Optional[UUID] = None,
        module_id: Optional[UUID] = None,
        lesson_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Lesson]:
        conditions = []
        if module_id:
            conditions.append(Lesson.module_id == module_id)
        elif course_id:
            conditions.append(
                Lesson.module_id.in_(
                    select(CourseModule.id).where(CourseModule.course_id == course_id)
                )
            )

        if lesson_type:
            conditions.append(Lesson.lesson_type == lesson_type)
        if status:
            conditions.append(Lesson.status == status)
        if keyword:
            conditions.append(
                (Lesson.title.ilike(f"%{keyword}%"))
                | (Lesson.description.ilike(f"%{keyword}%"))
            )

        query = select(Lesson)
        if conditions:
            query = query.where(and_(*conditions))

        res = await self.db.execute(query.order_by(Lesson.position.asc()))
        return list(res.scalars().all())

    async def update_lesson(self, lesson: Lesson, update_dict: dict) -> Lesson:
        for k, v in update_dict.items():
            if v is not None:
                setattr(lesson, k, v)
        await self.db.flush()
        await self.db.refresh(lesson)
        return lesson

    async def delete_lesson(self, lesson_id: UUID) -> bool:
        les = await self.get_lesson_by_id(lesson_id)
        if not les:
            return False
        await self.db.delete(les)
        await self.db.flush()
        return True

    async def reorder_lessons(self, module_id: UUID, lesson_ids: List[UUID]) -> bool:
        for index, l_id in enumerate(lesson_ids, start=1):
            await self.db.execute(
                update(Lesson)
                .where(
                    and_(
                        Lesson.id == l_id,
                        Lesson.module_id == module_id,
                    )
                )
                .values(position=index)
            )
        await self.db.flush()
        return True

    # Content Operations
    async def save_lesson_content(
        self,
        lesson_id: UUID,
        file_id: Optional[UUID] = None,
        external_url: Optional[str] = None,
        text_content: Optional[str] = None,
        content_type: ContentType = ContentType.VIDEO,
    ) -> LessonContent:
        res = await self.db.execute(
            select(LessonContent).where(LessonContent.lesson_id == lesson_id)
        )
        content = res.scalars().first()

        if not content:
            content = LessonContent(
                lesson_id=lesson_id,
                file_id=file_id,
                external_url=external_url,
                text_content=text_content,
                content_type=content_type,
            )
            self.db.add(content)
        else:
            content.file_id = file_id
            content.external_url = external_url
            content.text_content = text_content
            content.content_type = content_type

        await self.db.flush()
        await self.db.refresh(content)
        return content

    async def get_lesson_content(self, lesson_id: UUID) -> Optional[LessonContent]:
        res = await self.db.execute(
            select(LessonContent).where(LessonContent.lesson_id == lesson_id)
        )
        return res.scalars().first()

    async def delete_lesson_content(self, lesson_id: UUID) -> bool:
        content = await self.get_lesson_content(lesson_id)
        if not content:
            return False
        await self.db.delete(content)
        await self.db.flush()
        return True

    # Resource Operations
    async def add_resource(
        self, lesson_id: UUID, file_id: UUID, title: str
    ) -> LessonResource:
        resource = LessonResource(lesson_id=lesson_id, file_id=file_id, title=title.strip())
        self.db.add(resource)
        await self.db.flush()
        await self.db.refresh(resource)
        return resource

    async def get_resource_by_id(self, resource_id: UUID) -> Optional[LessonResource]:
        res = await self.db.execute(
            select(LessonResource).where(LessonResource.id == resource_id)
        )
        return res.scalars().first()

    async def list_resources(self, lesson_id: UUID) -> List[LessonResource]:
        res = await self.db.execute(
            select(LessonResource).where(LessonResource.lesson_id == lesson_id)
        )
        return list(res.scalars().all())

    async def delete_resource(self, resource_id: UUID, lesson_id: UUID) -> bool:
        res = await self.db.execute(
            select(LessonResource).where(
                and_(
                    LessonResource.id == resource_id,
                    LessonResource.lesson_id == lesson_id,
                )
            )
        )
        resource = res.scalars().first()
        if not resource:
            return False
        await self.db.delete(resource)
        await self.db.flush()
        return True

    # Structure & Statistics
    async def get_content_statistics(self, course_id: UUID) -> dict:
        modules = await self.list_modules(course_id)
        module_ids = [m.id for m in modules]

        if not module_ids:
            return {
                "total_modules": 0,
                "total_lessons": 0,
                "total_videos": 0,
                "total_pdfs": 0,
                "total_resources": 0,
                "total_duration": 0,
            }

        lessons_res = await self.db.execute(
            select(Lesson).where(Lesson.module_id.in_(module_ids))
        )
        lessons = list(lessons_res.scalars().all())
        lesson_ids = [l.id for l in lessons]

        total_videos = sum(1 for l in lessons if l.lesson_type == LessonType.VIDEO)
        total_pdfs = sum(1 for l in lessons if l.lesson_type == LessonType.PDF)
        total_duration = sum(l.duration or 0 for l in lessons)

        total_resources = 0
        if lesson_ids:
            res_count_res = await self.db.execute(
                select(func.count(LessonResource.id)).where(
                    LessonResource.lesson_id.in_(lesson_ids)
                )
            )
            total_resources = res_count_res.scalar_one()

        return {
            "total_modules": len(modules),
            "total_lessons": len(lessons),
            "total_videos": total_videos,
            "total_pdfs": total_pdfs,
            "total_resources": total_resources,
            "total_duration": total_duration,
        }
