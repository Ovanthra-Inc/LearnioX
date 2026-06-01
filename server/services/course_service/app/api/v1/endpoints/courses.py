import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.models.course import CourseStatus
from app.schemas.requests import (
    CreateCourseRequest,
    UpdateCourseRequest,
    UpdateCoursePricingRequest,
    UpdateCourseSEORequest,
    UpdateCourseOutcomesRequest,
    AddCourseInstructorRequest
)
from app.schemas.responses import CourseResponse, CoursePublicResponse, CourseInstructorResponse
from app.services.course_service import CourseService
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta, EmptyResponse

router = APIRouter()


def _to_course_response(c) -> CourseResponse:
    return CourseResponse(
        id=c.id,
        institution_id=c.institution_id,
        title=c.title,
        slug=c.slug,
        subtitle=c.subtitle,
        description=c.description,
        thumbnail_url=c.thumbnail_url,
        promo_video_id=c.promo_video_id,
        category=c.category,
        subcategory=c.subcategory,
        language=c.language,
        level=c.level.value,
        status=c.status.value,
        access_type=c.access_type.value,
        price_amount=float(c.price_amount) if c.price_amount is not None else None,
        currency=c.currency,
        learning_outcomes=c.learning_outcomes or {},
        prerequisites=c.prerequisites or {},
        seo=c.seo or {},
        is_featured=c.is_featured,
        created_at=c.created_at,
        updated_at=c.updated_at
    )


def _to_public_course_response(c) -> CoursePublicResponse:
    return CoursePublicResponse(
        id=c.id,
        institution_id=c.institution_id,
        title=c.title,
        slug=c.slug,
        subtitle=c.subtitle,
        thumbnail_url=c.thumbnail_url,
        category=c.category,
        level=c.level.value,
        language=c.language,
        access_type=c.access_type.value,
        price_amount=float(c.price_amount) if c.price_amount is not None else None,
        currency=c.currency
    )


# ------------------ STUDIO / INSTITUTION COURSES ------------------

@router.post("/institutions/{institution_id}/courses", response_model=APIResponse[CourseResponse])
async def create_course(
    institution_id: uuid.UUID,
    request: CreateCourseRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.create_course(institution_id, request)
    return APIResponse(
        success=True,
        message="Course created successfully",
        data=_to_course_response(course)
    )


@router.get("/institutions/{institution_id}/courses", response_model=PaginatedResponse[CourseResponse])
async def list_institution_courses(
    institution_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    courses, total = await service.list_institution_courses(institution_id, page, limit)
    
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Institution courses retrieved",
        data=[_to_course_response(c) for c in courses],
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages
        )
    )


# ------------------ COURSE CRUD ------------------

@router.get("/courses/{course_id}", response_model=APIResponse[CourseResponse])
async def get_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.get_course_by_id(course_id)
    return APIResponse(
        success=True,
        message="Course retrieved",
        data=_to_course_response(course)
    )


@router.patch("/courses/{course_id}", response_model=APIResponse[CourseResponse])
async def update_course(
    course_id: uuid.UUID,
    request: UpdateCourseRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.update_course(course_id, request)
    return APIResponse(
        success=True,
        message="Course updated successfully",
        data=_to_course_response(course)
    )


@router.delete("/courses/{course_id}", response_model=APIResponse[dict])
async def delete_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    deleted = await service.delete_course(course_id)
    return APIResponse(
        success=deleted,
        message="Course deleted successfully" if deleted else "Course not found",
        data={}
    )


@router.get("/courses/slug/{course_slug}", response_model=APIResponse[CourseResponse])
async def get_course_by_slug(course_slug: str, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.get_course_by_slug(course_slug)
    return APIResponse(
        success=True,
        message="Course retrieved by slug",
        data=_to_course_response(course)
    )


# ------------------ SPECIALIZED PATCHES ------------------

@router.patch("/courses/{course_id}/pricing", response_model=APIResponse[CourseResponse])
async def update_pricing(
    course_id: uuid.UUID,
    request: UpdateCoursePricingRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.update_pricing(course_id, request)
    return APIResponse(
        success=True,
        message="Pricing updated successfully",
        data=_to_course_response(course)
    )


@router.patch("/courses/{course_id}/settings", response_model=APIResponse[CourseResponse])
async def update_settings(
    course_id: uuid.UUID,
    settings_dict: dict,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.update_settings(course_id, settings_dict)
    return APIResponse(
        success=True,
        message="Settings updated successfully",
        data=_to_course_response(course)
    )


@router.patch("/courses/{course_id}/seo", response_model=APIResponse[CourseResponse])
async def update_seo(
    course_id: uuid.UUID,
    request: UpdateCourseSEORequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.update_seo(course_id, request)
    return APIResponse(
        success=True,
        message="SEO metadata updated successfully",
        data=_to_course_response(course)
    )


@router.patch("/courses/{course_id}/outcomes", response_model=APIResponse[CourseResponse])
async def update_outcomes(
    course_id: uuid.UUID,
    request: UpdateCourseOutcomesRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    course = await service.update_outcomes(course_id, request)
    return APIResponse(
        success=True,
        message="Learning outcomes/prerequisites updated successfully",
        data=_to_course_response(course)
    )


# ------------------ PUBLISH / STATUS ------------------

@router.post("/courses/{course_id}/publish", response_model=APIResponse[CourseResponse])
async def publish_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.publish_course(course_id)
    return APIResponse(
        success=True,
        message="Course published successfully",
        data=_to_course_response(course)
    )


@router.post("/courses/{course_id}/unpublish", response_model=APIResponse[CourseResponse])
async def unpublish_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.unpublish_course(course_id)
    return APIResponse(
        success=True,
        message="Course unpublished successfully",
        data=_to_course_response(course)
    )


@router.post("/courses/{course_id}/archive", response_model=APIResponse[CourseResponse])
async def archive_course(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.archive_course(course_id)
    return APIResponse(
        success=True,
        message="Course archived successfully",
        data=_to_course_response(course)
    )


# ------------------ INSTRUCTORS ------------------

@router.get("/courses/{course_id}/instructors", response_model=APIResponse[list[CourseInstructorResponse]])
async def get_instructors(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    instructors = await service.get_instructors(course_id)
    return APIResponse(
        success=True,
        message="Instructors retrieved",
        data=[
            CourseInstructorResponse(
                id=i.id,
                course_id=i.course_id,
                user_id=i.user_id,
                created_at=i.created_at
            )
            for i in instructors
        ]
    )


@router.post("/courses/{course_id}/instructors", response_model=APIResponse[CourseInstructorResponse])
async def add_instructor(
    course_id: uuid.UUID,
    request: AddCourseInstructorRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    instructor = await service.add_instructor(course_id, request.user_id)
    return APIResponse(
        success=True,
        message="Instructor assigned successfully",
        data=CourseInstructorResponse(
            id=instructor.id,
            course_id=instructor.course_id,
            user_id=instructor.user_id,
            created_at=instructor.created_at
        )
    )


@router.delete("/courses/{course_id}/instructors/{user_id}", response_model=APIResponse[dict])
async def remove_instructor(
    course_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    removed = await service.remove_instructor(course_id, user_id)
    return APIResponse(
        success=removed,
        message="Instructor removed successfully" if removed else "Instructor mapping not found",
        data={}
    )


# ------------------ PUBLIC LISTING ------------------

@router.get("/public/courses", response_model=PaginatedResponse[CoursePublicResponse])
async def list_public_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    level: str | None = None,
    language: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    service = CourseService(db)
    courses, total = await service.list_public_courses(page, limit, category, level, language)
    
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Public courses retrieved",
        data=[_to_public_course_response(c) for c in courses],
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages
        )
    )


@router.get("/public/courses/{course_slug}", response_model=APIResponse[CoursePublicResponse])
async def get_public_course_detail(course_slug: str, db: AsyncSession = Depends(get_db)):
    service = CourseService(db)
    course = await service.get_course_by_slug(course_slug)
    if course.status != CourseStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return APIResponse(
        success=True,
        message="Public course detail retrieved",
        data=_to_public_course_response(course)
    )
