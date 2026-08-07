from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.course import (
    Course,
    CourseAccessType,
    CourseCategory,
    CourseLevel,
    CourseStatus,
    CourseTag,
    CourseVisibility,
)
from app.repositories.course_repository import CourseRepository
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.member_repository import MemberRepository
from app.models.member import MemberStatus
from app.utils.text import slugify
from app.schemas.course import (
    CategoryRequest,
    CategoryResponse,
    CourseDetailResponse,
    CourseListResponse,
    CourseResponse,
    CourseStatisticsResponse,
    CreateCourseRequest,
    PricingRequest,
    TagCreateRequest,
    TagResponse,
    UpdateCourseRequest,
)



class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CourseRepository(db)
        self.inst_repo = InstitutionRepository(db)
        self.member_repo = MemberRepository(db)

    async def _check_institution_access(self, institution_id: UUID, user_id: UUID) -> None:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id == user_id:
            return
        member = await self.member_repo.get_member_by_user_and_inst(user_id, institution_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenException(message="Access denied to institution resources", error_code="FORBIDDEN")

    def _resolve_file_url(self, file_id: Optional[UUID]) -> Optional[str]:
        if not file_id:
            return None
        return f"/api/v1/storage/files/{file_id}/preview"

    async def _to_course_response(self, course: Course) -> CourseResponse:
        return CourseResponse(
            id=course.id,
            institution_id=course.institution_id,
            title=course.title,
            slug=course.slug,
            subtitle=course.subtitle,
            description=course.description,
            level=course.level.value if hasattr(course.level, "value") else str(course.level),
            status=course.status.value if hasattr(course.status, "value") else str(course.status),
            access_type=course.access_type.value if hasattr(course.access_type, "value") else str(course.access_type),
            visibility=course.visibility.value if hasattr(course.visibility, "value") else str(course.visibility),
            price=course.price,
            discount_price=course.discount_price,
            currency=course.currency,
            thumbnail_url=self._resolve_file_url(course.thumbnail_file_id),
            intro_video_url=self._resolve_file_url(course.intro_video_file_id),
            created_at=course.created_at,
        )

    async def _to_course_detail_response(self, course: Course) -> CourseDetailResponse:
        base = await self._to_course_response(course)

        cat_resp = None
        if course.category_id:
            cat = await self.repo.get_category_by_id(course.category_id)
            if cat:
                cat_resp = CategoryResponse(
                    id=cat.id, name=cat.name, slug=cat.slug, parent_id=cat.parent_id
                )

        tags_resp = [
            TagResponse(id=t.id, name=t.name) for t in (course.tags or [])
        ]

        return CourseDetailResponse(
            **base.model_dump(),
            category=cat_resp,
            tags=tags_resp,
            estimated_duration=float(course.estimated_duration or 0),
            certificate_enabled=course.certificate_enabled,
            allow_reviews=course.allow_reviews,
            allow_download=course.allow_download,
            published_at=course.published_at,
        )

    # Course Core Operations
    async def create_course(
        self, user_id: UUID, payload: CreateCourseRequest
    ) -> CourseResponse:
        await self._check_institution_access(payload.institution_id, user_id)

        base_slug = slugify(payload.title)
        slug = base_slug
        existing = await self.repo.get_course_by_slug(slug)
        counter = 1
        while existing:
            slug = f"{base_slug}-{counter}"
            existing = await self.repo.get_course_by_slug(slug)
            counter += 1

        course = await self.repo.create_course(
            institution_id=payload.institution_id,
            created_by=user_id,
            title=payload.title,
            slug=slug,
            subtitle=payload.subtitle,
            description=payload.description,
            category_id=payload.category_id,
            language=payload.language,
            level=CourseLevel(payload.level),
            access_type=CourseAccessType(payload.access_type),
            price=float(payload.price),
            currency=payload.currency,
            certificate_enabled=payload.certificate_enabled,
            allow_reviews=payload.allow_reviews,
            allow_download=payload.allow_download,
        )
        return await self._to_course_response(course)

    async def get_course(self, course_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")
        return await self._to_course_detail_response(course)

    async def get_course_by_slug(self, slug: str) -> CourseDetailResponse:
        course = await self.repo.get_course_by_slug(slug)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")
        return await self._to_course_detail_response(course)

    async def list_courses(
        self,
        page: int = 1,
        limit: int = 20,
        institution_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        level: Optional[str] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        access_type: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> CourseListResponse:
        courses, total = await self.repo.list_courses(
            page=page,
            limit=limit,
            institution_id=institution_id,
            category_id=category_id,
            level=level,
            status=status,
            visibility=visibility,
            access_type=access_type,
            search=search,
            sort=sort,
        )
        responses = [await self._to_course_response(c) for c in courses]
        return CourseListResponse(total=total, page=page, limit=limit, items=responses)

    async def update_course(
        self, course_id: UUID, user_id: UUID, payload: UpdateCourseRequest
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")
        await self._check_institution_access(course.institution_id, user_id)

        update_dict = payload.model_dump(exclude_unset=True)
        if "title" in update_dict and update_dict["title"]:
            base_slug = slugify(update_dict["title"])
            if base_slug != course.slug:
                slug = base_slug
                existing = await self.repo.get_course_by_slug(slug)
                counter = 1
                while existing and existing.id != course.id:
                    slug = f"{base_slug}-{counter}"
                    existing = await self.repo.get_course_by_slug(slug)
                    counter += 1
                update_dict["slug"] = slug

        updated = await self.repo.update_course(course, update_dict)
        return await self._to_course_detail_response(updated)

    async def soft_delete_course(self, course_id: UUID, user_id: UUID) -> None:
        success = await self.repo.soft_delete_course(course_id)
        if not success:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

    async def publish_course(self, course_id: UUID, user_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")
        if not course.description or len(course.description) < 10:
            raise ValidationException(
                message="Course description is too short to publish",
                error_code="PUBLISH_VALIDATION_FAILED",
            )

        now = datetime.now(timezone.utc)
        updated = await self.repo.update_course(
            course, {"status": CourseStatus.PUBLISHED, "published_at": now}
        )
        return await self._to_course_detail_response(updated)

    async def draft_course(self, course_id: UUID, user_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(course, {"status": CourseStatus.DRAFT})
        return await self._to_course_detail_response(updated)

    async def archive_course(self, course_id: UUID, user_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(course, {"status": CourseStatus.ARCHIVED})
        return await self._to_course_detail_response(updated)

    async def restore_course(self, course_id: UUID, user_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id, include_deleted=True)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(
            course, {"is_deleted": False, "deleted_at": None, "status": CourseStatus.DRAFT}
        )
        return await self._to_course_detail_response(updated)

    async def duplicate_course(self, course_id: UUID, user_id: UUID) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        new_title = f"Copy of {course.title}"
        base_slug = slugify(new_title)
        slug = base_slug
        existing = await self.repo.get_course_by_slug(slug)
        counter = 1
        while existing:
            slug = f"{base_slug}-{counter}"
            existing = await self.repo.get_course_by_slug(slug)
            counter += 1

        new_course = await self.repo.create_course(
            institution_id=course.institution_id,
            created_by=user_id,
            title=new_title,
            slug=slug,
            subtitle=course.subtitle,
            description=course.description,
            category_id=course.category_id,
            language=course.language,
            level=course.level,
            access_type=course.access_type,
            price=float(course.price),
            currency=course.currency,
            certificate_enabled=course.certificate_enabled,
            allow_reviews=course.allow_reviews,
            allow_download=course.allow_download,
        )
        return await self._to_course_detail_response(new_course)

    # Media & Pricing Updates
    async def set_thumbnail(
        self, course_id: UUID, file_id: Optional[UUID], user_id: UUID
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(course, {"thumbnail_file_id": file_id})
        return await self._to_course_detail_response(updated)

    async def set_intro_video(
        self, course_id: UUID, file_id: Optional[UUID], user_id: UUID
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(course, {"intro_video_file_id": file_id})
        return await self._to_course_detail_response(updated)

    async def update_pricing(
        self, course_id: UUID, user_id: UUID, payload: PricingRequest
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(
            course,
            {
                "access_type": CourseAccessType(payload.access_type),
                "price": float(payload.price),
                "discount_price": float(payload.discount_price) if payload.discount_price is not None else None,
                "currency": payload.currency,
            },
        )
        return await self._to_course_detail_response(updated)

    async def update_visibility(
        self, course_id: UUID, user_id: UUID, visibility: str
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.update_course(
            course, {"visibility": CourseVisibility(visibility)}
        )
        return await self._to_course_detail_response(updated)

    # Categories & Tags
    async def create_category(self, payload: CategoryRequest) -> CategoryResponse:
        slug = slugify(payload.name)
        existing = await self.repo.get_category_by_slug(slug)
        if existing:
            return CategoryResponse(
                id=existing.id, name=existing.name, slug=existing.slug, parent_id=existing.parent_id
            )

        cat = await self.repo.create_category(
            name=payload.name, slug=slug, parent_id=payload.parent_id
        )
        return CategoryResponse(
            id=cat.id, name=cat.name, slug=cat.slug, parent_id=cat.parent_id
        )

    async def list_categories(self) -> List[CategoryResponse]:
        cats = await self.repo.list_categories()
        return [
            CategoryResponse(id=c.id, name=c.name, slug=c.slug, parent_id=c.parent_id)
            for c in cats
        ]

    async def update_category(
        self, category_id: UUID, payload: CategoryRequest
    ) -> CategoryResponse:
        cat = await self.repo.get_category_by_id(category_id)
        if not cat:
            raise NotFoundException(message="Category not found", error_code="CATEGORY_NOT_FOUND")

        slug = slugify(payload.name)
        updated = await self.repo.update_category(
            cat, {"name": payload.name, "slug": slug, "parent_id": payload.parent_id}
        )
        return CategoryResponse(
            id=updated.id, name=updated.name, slug=updated.slug, parent_id=updated.parent_id
        )

    async def delete_category(self, category_id: UUID) -> None:
        success = await self.repo.delete_category(category_id)
        if not success:
            raise NotFoundException(message="Category not found", error_code="CATEGORY_NOT_FOUND")

    async def create_tag(self, payload: TagCreateRequest) -> TagResponse:
        tag = await self.repo.create_tag(name=payload.name)
        return TagResponse(id=tag.id, name=tag.name)

    async def list_tags(self) -> List[TagResponse]:
        tags = await self.repo.list_tags()
        return [TagResponse(id=t.id, name=t.name) for t in tags]

    async def update_tag(self, tag_id: UUID, payload: TagCreateRequest) -> TagResponse:
        tag = await self.repo.get_tag_by_id(tag_id)
        if not tag:
            raise NotFoundException(message="Tag not found", error_code="TAG_NOT_FOUND")
        updated = await self.repo.update_tag(tag, payload.name)
        return TagResponse(id=updated.id, name=updated.name)

    async def delete_tag(self, tag_id: UUID) -> None:
        success = await self.repo.delete_tag(tag_id)
        if not success:
            raise NotFoundException(message="Tag not found", error_code="TAG_NOT_FOUND")

    async def assign_course_tags(
        self, course_id: UUID, tag_ids: List[UUID], user_id: UUID
    ) -> CourseDetailResponse:
        course = await self.repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        updated = await self.repo.assign_course_tags(course, tag_ids)
        return await self._to_course_detail_response(updated)

    async def remove_course_tag(
        self, course_id: UUID, tag_id: UUID, user_id: UUID
    ) -> None:
        await self.repo.remove_course_tag(course_id, tag_id)

    # Discovery Feeds
    async def get_public_courses(
        self,
        page: int = 1,
        limit: int = 20,
        access_type: Optional[str] = None,
        sort: str = "desc",
    ) -> CourseListResponse:
        return await self.list_courses(
            page=page,
            limit=limit,
            status="PUBLISHED",
            visibility="PUBLIC",
            access_type=access_type,
            sort=sort,
        )

    async def get_course_statistics(self, course_id: UUID) -> CourseStatisticsResponse:
        stats = await self.repo.get_course_statistics(course_id)
        return CourseStatisticsResponse(**stats)
