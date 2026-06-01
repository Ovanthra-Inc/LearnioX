import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.course import Course, CourseStatus, CourseAccessType, CourseLevel
from app.models.course_instructor import CourseInstructor
from app.repositories.course_repository import CourseRepository, InstructorRepository
from app.schemas.requests import (
    CreateCourseRequest,
    UpdateCourseRequest,
    UpdateCoursePricingRequest,
    UpdateCourseSEORequest,
    UpdateCourseOutcomesRequest
)


class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.instructor_repo = InstructorRepository(db)

    async def create_course(self, institution_id: uuid.UUID, request: CreateCourseRequest) -> Course:
        # Check slug uniqueness in this institution
        existing = await self.course_repo.get_by_institution_and_slug(institution_id, request.slug)
        if existing:
            # Let's generate a unique slug if taken
            import random
            random_suffix = str(random.randint(1000, 9999))
            slug = f"{request.slug}-{random_suffix}"
        else:
            slug = request.slug

        course = Course(
            institution_id=institution_id,
            title=request.title,
            slug=slug,
            subtitle=request.subtitle,
            description=request.description,
            category=request.category,
            subcategory=request.subcategory,
            language=request.language,
            level=CourseLevel(request.level),
            access_type=CourseAccessType(request.access_type),
            price_amount=request.price_amount,
            currency=request.currency,
            status=CourseStatus.DRAFT,
            learning_outcomes={"learning_outcomes": []},
            prerequisites={"prerequisites": []},
            seo={"meta_title": "", "meta_description": "", "keywords": []}
        )
        return await self.course_repo.create(course)

    async def get_course_by_id(self, course_id: uuid.UUID) -> Course:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course

    async def get_course_by_slug(self, slug: str) -> Course:
        course = await self.course_repo.get_by_slug(slug)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course

    async def list_institution_courses(
        self,
        institution_id: uuid.UUID,
        page: int = 1,
        limit: int = 20
    ) -> tuple[list[Course], int]:
        return await self.course_repo.list_by_institution(institution_id, page, limit)

    async def list_public_courses(
        self,
        page: int = 1,
        limit: int = 20,
        category: str | None = None,
        level: str | None = None,
        language: str | None = None
    ) -> tuple[list[Course], int]:
        return await self.course_repo.list_public(page, limit, category, level, language)

    async def update_course(self, course_id: uuid.UUID, request: UpdateCourseRequest) -> Course:
        course = await self.get_course_by_id(course_id)
        
        if request.title is not None:
            course.title = request.title
        if request.subtitle is not None:
            course.subtitle = request.subtitle
        if request.description is not None:
            course.description = request.description
        if request.thumbnail_url is not None:
            course.thumbnail_url = request.thumbnail_url
        if request.category is not None:
            course.category = request.category
        if request.subcategory is not None:
            course.subcategory = request.subcategory
        if request.language is not None:
            course.language = request.language
        if request.level is not None:
            course.level = CourseLevel(request.level)

        return await self.course_repo.update(course)

    async def update_pricing(self, course_id: uuid.UUID, request: UpdateCoursePricingRequest) -> Course:
        course = await self.get_course_by_id(course_id)
        course.access_type = CourseAccessType(request.access_type)
        course.price_amount = request.price_amount
        course.currency = request.currency
        return await self.course_repo.update(course)

    async def update_seo(self, course_id: uuid.UUID, request: UpdateCourseSEORequest) -> Course:
        course = await self.get_course_by_id(course_id)
        course.seo = {
            "meta_title": request.meta_title or "",
            "meta_description": request.meta_description or "",
            "keywords": request.keywords
        }
        return await self.course_repo.update(course)

    async def update_outcomes(self, course_id: uuid.UUID, request: UpdateCourseOutcomesRequest) -> Course:
        course = await self.get_course_by_id(course_id)
        course.learning_outcomes = {"learning_outcomes": request.learning_outcomes}
        course.prerequisites = {"prerequisites": request.prerequisites}
        return await self.course_repo.update(course)

    async def update_settings(self, course_id: uuid.UUID, settings_dict: dict) -> Course:
        course = await self.get_course_by_id(course_id)
        if "is_featured" in settings_dict:
            course.is_featured = bool(settings_dict["is_featured"])
        if "promo_video_id" in settings_dict:
            val = settings_dict["promo_video_id"]
            course.promo_video_id = uuid.UUID(val) if val else None
        return await self.course_repo.update(course)

    async def publish_course(self, course_id: uuid.UUID) -> Course:
        course = await self.get_course_by_id(course_id)
        course.status = CourseStatus.PUBLISHED
        return await self.course_repo.update(course)

    async def unpublish_course(self, course_id: uuid.UUID) -> Course:
        course = await self.get_course_by_id(course_id)
        course.status = CourseStatus.DRAFT
        return await self.course_repo.update(course)

    async def archive_course(self, course_id: uuid.UUID) -> Course:
        course = await self.get_course_by_id(course_id)
        course.status = CourseStatus.ARCHIVED
        return await self.course_repo.update(course)

    async def delete_course(self, course_id: uuid.UUID) -> bool:
        return await self.course_repo.delete(course_id)

    # Instructors management
    async def get_instructors(self, course_id: uuid.UUID) -> list[CourseInstructor]:
        await self.get_course_by_id(course_id) # ensure it exists
        return await self.instructor_repo.get_instructors(course_id)

    async def add_instructor(self, course_id: uuid.UUID, user_id: uuid.UUID) -> CourseInstructor:
        await self.get_course_by_id(course_id) # ensure it exists
        return await self.instructor_repo.add_instructor(course_id, user_id)

    async def remove_instructor(self, course_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        await self.get_course_by_id(course_id) # ensure it exists
        return await self.instructor_repo.remove_instructor(course_id, user_id)
