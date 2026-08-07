from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
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
from app.repositories.course_repository import CourseRepository
from app.repositories.curriculum_repository import CurriculumRepository
from app.schemas.curriculum import (
    AttachContentRequest,
    ContentStatisticsResponse,
    CourseStructureModuleResponse,
    CourseStructureResponse,
    CreateLessonRequest,
    CreateModuleRequest,
    LessonContentResponse,
    LessonResponse,
    ModuleResponse,
    ReorderLessonsRequest,
    ReorderModulesRequest,
    ResourceRequest,
    ResourceResponse,
    ScheduleLessonRequest,
    UpdateLessonRequest,
    UpdateModuleRequest,
)


class CurriculumService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CurriculumRepository(db)
        self.course_repo = CourseRepository(db)

    def _resolve_file_url(self, file_id: Optional[UUID]) -> Optional[str]:
        if not file_id:
            return None
        return f"/api/v1/storage/files/{file_id}/preview"

    async def _to_module_response(self, module: CourseModule) -> ModuleResponse:
        return ModuleResponse(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            description=module.description,
            position=module.position,
            is_free=module.is_free,
            is_published=module.is_published,
            created_at=module.created_at,
        )

    async def _to_lesson_content_response(
        self, content: Optional[LessonContent]
    ) -> Optional[LessonContentResponse]:
        if not content:
            return None
        return LessonContentResponse(
            id=content.id,
            lesson_id=content.lesson_id,
            file_id=content.file_id,
            file_url=self._resolve_file_url(content.file_id),
            external_url=content.external_url,
            text_content=content.text_content,
            content_type=content.content_type.value if hasattr(content.content_type, "value") else str(content.content_type),
            created_at=content.created_at,
        )

    async def _to_resource_response(self, resource: LessonResource) -> ResourceResponse:
        return ResourceResponse(
            id=resource.id,
            lesson_id=resource.lesson_id,
            file_id=resource.file_id,
            file_url=self._resolve_file_url(resource.file_id),
            title=resource.title,
            created_at=resource.created_at,
        )

    async def _to_lesson_response(self, lesson: Lesson) -> LessonResponse:
        content = await self.repo.get_lesson_content(lesson.id)
        resources = await self.repo.list_resources(lesson.id)

        content_resp = await self._to_lesson_content_response(content)
        resources_resp = [await self._to_resource_response(r) for r in resources]

        return LessonResponse(
            id=lesson.id,
            module_id=lesson.module_id,
            title=lesson.title,
            description=lesson.description,
            lesson_type=lesson.lesson_type.value if hasattr(lesson.lesson_type, "value") else str(lesson.lesson_type),
            duration=lesson.duration,
            visibility=lesson.visibility.value if hasattr(lesson.visibility, "value") else str(lesson.visibility),
            status=lesson.status.value if hasattr(lesson.status, "value") else str(lesson.status),
            scheduled_at=lesson.scheduled_at,
            is_preview=lesson.is_preview,
            position=lesson.position,
            content=content_resp,
            resources=resources_resp,
            created_at=lesson.created_at,
        )

    # Module Services
    async def create_module(
        self, course_id: UUID, user_id: UUID, payload: CreateModuleRequest
    ) -> ModuleResponse:
        course = await self.course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        module = await self.repo.create_module(
            course_id=course_id,
            title=payload.title,
            description=payload.description,
            is_free=payload.is_free,
            created_by=user_id,
        )
        return await self._to_module_response(module)

    async def get_module(self, module_id: UUID) -> ModuleResponse:
        module = await self.repo.get_module_by_id(module_id)
        if not module:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")
        return await self._to_module_response(module)

    async def list_modules(self, course_id: UUID) -> List[ModuleResponse]:
        modules = await self.repo.list_modules(course_id)
        return [await self._to_module_response(m) for m in modules]

    async def update_module(
        self, module_id: UUID, user_id: UUID, payload: UpdateModuleRequest
    ) -> ModuleResponse:
        module = await self.repo.get_module_by_id(module_id)
        if not module:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")

        update_dict = payload.model_dump(exclude_unset=True)
        updated = await self.repo.update_module(module, update_dict)
        return await self._to_module_response(updated)

    async def delete_module(self, module_id: UUID, user_id: UUID) -> None:
        success = await self.repo.delete_module(module_id)
        if not success:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")

    async def reorder_modules(
        self, course_id: UUID, user_id: UUID, payload: ReorderModulesRequest
    ) -> None:
        await self.repo.reorder_modules(course_id, payload.module_ids)

    # Lesson Services
    async def create_lesson(
        self, module_id: UUID, user_id: UUID, payload: CreateLessonRequest
    ) -> LessonResponse:
        module = await self.repo.get_module_by_id(module_id)
        if not module:
            raise NotFoundException(message="Module not found", error_code="MODULE_NOT_FOUND")

        lesson = await self.repo.create_lesson(
            module_id=module_id,
            title=payload.title,
            description=payload.description,
            lesson_type=LessonType(payload.lesson_type),
            visibility=LessonVisibility(payload.visibility),
            is_preview=payload.is_preview,
            created_by=user_id,
        )
        return await self._to_lesson_response(lesson)

    async def get_lesson(self, lesson_id: UUID) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")
        return await self._to_lesson_response(lesson)

    async def list_lessons(self, module_id: UUID) -> List[LessonResponse]:
        lessons = await self.repo.list_lessons(module_id)
        return [await self._to_lesson_response(l) for l in lessons]

    async def search_lessons(
        self,
        keyword: Optional[str] = None,
        course_id: Optional[UUID] = None,
        module_id: Optional[UUID] = None,
        lesson_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[LessonResponse]:
        lessons = await self.repo.search_lessons(
            keyword=keyword,
            course_id=course_id,
            module_id=module_id,
            lesson_type=lesson_type,
            status=status,
        )
        return [await self._to_lesson_response(l) for l in lessons]

    async def update_lesson(
        self, lesson_id: UUID, user_id: UUID, payload: UpdateLessonRequest
    ) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        update_dict = payload.model_dump(exclude_unset=True)
        if "visibility" in update_dict and update_dict["visibility"]:
            update_dict["visibility"] = LessonVisibility(update_dict["visibility"])

        updated = await self.repo.update_lesson(lesson, update_dict)
        return await self._to_lesson_response(updated)

    async def delete_lesson(self, lesson_id: UUID, user_id: UUID) -> None:
        success = await self.repo.delete_lesson(lesson_id)
        if not success:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

    async def reorder_lessons(
        self, module_id: UUID, user_id: UUID, payload: ReorderLessonsRequest
    ) -> None:
        await self.repo.reorder_lessons(module_id, payload.lesson_ids)

    async def publish_lesson(self, lesson_id: UUID, user_id: UUID) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        content = await self.repo.get_lesson_content(lesson_id)
        if not content:
            raise ValidationException(
                message="Cannot publish lesson without content attached",
                error_code="PUBLISH_VALIDATION_FAILED",
            )

        updated = await self.repo.update_lesson(lesson, {"status": LessonStatus.PUBLISHED})
        return await self._to_lesson_response(updated)

    async def draft_lesson(self, lesson_id: UUID, user_id: UUID) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        updated = await self.repo.update_lesson(lesson, {"status": LessonStatus.DRAFT})
        return await self._to_lesson_response(updated)

    async def schedule_lesson(
        self, lesson_id: UUID, user_id: UUID, payload: ScheduleLessonRequest
    ) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        updated = await self.repo.update_lesson(
            lesson,
            {"status": LessonStatus.SCHEDULED, "scheduled_at": payload.publish_at},
        )
        return await self._to_lesson_response(updated)

    async def update_visibility(
        self, lesson_id: UUID, user_id: UUID, visibility: str
    ) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        updated = await self.repo.update_lesson(
            lesson, {"visibility": LessonVisibility(visibility)}
        )
        return await self._to_lesson_response(updated)

    async def update_preview(
        self, lesson_id: UUID, user_id: UUID, is_preview: bool
    ) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        updated = await self.repo.update_lesson(lesson, {"is_preview": is_preview})
        return await self._to_lesson_response(updated)

    async def update_duration(
        self, lesson_id: UUID, user_id: UUID, duration: int
    ) -> LessonResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        updated = await self.repo.update_lesson(lesson, {"duration": duration})
        return await self._to_lesson_response(updated)

    # Content & Resource Services
    async def attach_content(
        self, lesson_id: UUID, user_id: UUID, payload: AttachContentRequest
    ) -> LessonContentResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        ctype = ContentType(payload.content_type)
        if ctype in [ContentType.VIDEO, ContentType.PDF, ContentType.FILE] and not payload.file_id:
            raise ValidationException(
                message=f"file_id required for {payload.content_type} content",
                error_code="MISSING_FILE_ID",
            )
        if ctype == ContentType.LINK and not payload.external_url:
            raise ValidationException(
                message="external_url required for LINK content", error_code="MISSING_EXTERNAL_URL"
            )
        if ctype == ContentType.TEXT and not payload.text_content:
            raise ValidationException(
                message="text_content required for TEXT content", error_code="MISSING_TEXT_CONTENT"
            )

        content = await self.repo.save_lesson_content(
            lesson_id=lesson_id,
            file_id=payload.file_id,
            external_url=payload.external_url,
            text_content=payload.text_content,
            content_type=ctype,
        )
        return await self._to_lesson_content_response(content)

    async def get_content(self, lesson_id: UUID) -> LessonContentResponse:
        content = await self.repo.get_lesson_content(lesson_id)
        if not content:
            raise NotFoundException(message="Content not found", error_code="CONTENT_NOT_FOUND")
        return await self._to_lesson_content_response(content)

    async def remove_content(self, lesson_id: UUID, user_id: UUID) -> None:
        success = await self.repo.delete_lesson_content(lesson_id)
        if not success:
            raise NotFoundException(message="Content not found", error_code="CONTENT_NOT_FOUND")

    async def add_resource(
        self, lesson_id: UUID, user_id: UUID, payload: ResourceRequest
    ) -> ResourceResponse:
        lesson = await self.repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        resource = await self.repo.add_resource(
            lesson_id=lesson_id, file_id=payload.file_id, title=payload.title
        )
        return await self._to_resource_response(resource)

    async def list_resources(self, lesson_id: UUID) -> List[ResourceResponse]:
        resources = await self.repo.list_resources(lesson_id)
        return [await self._to_resource_response(r) for r in resources]

    async def remove_resource(self, resource_id: UUID, lesson_id: UUID, user_id: UUID) -> None:
        success = await self.repo.delete_resource(resource_id=resource_id, lesson_id=lesson_id)
        if not success:
            raise NotFoundException(message="Resource not found", error_code="RESOURCE_NOT_FOUND")

    # Structure & Statistics Services
    async def get_course_structure(self, course_id: UUID) -> CourseStructureResponse:
        course = await self.course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        modules = await self.repo.list_modules(course_id)
        module_responses = []

        for m in modules:
            m_resp = await self._to_module_response(m)
            lessons = await self.repo.list_lessons(m.id)
            lesson_responses = [await self._to_lesson_response(l) for l in lessons]

            module_responses.append(
                CourseStructureModuleResponse(
                    **m_resp.model_dump(), lessons=lesson_responses
                )
            )

        return CourseStructureResponse(course_id=course_id, modules=module_responses)

    async def get_content_statistics(self, course_id: UUID) -> ContentStatisticsResponse:
        stats = await self.repo.get_content_statistics(course_id)
        return ContentStatisticsResponse(**stats)
