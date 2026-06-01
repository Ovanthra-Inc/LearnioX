import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.requests import (
    EnrollCourseRequest,
    CourseAccessCheckRequest,
    LessonAccessCheckRequest,
    BulkAccessCheckRequest,
)
from app.schemas.responses import EnrollmentResponse, AccessCheckResponse, BulkAccessCheckResponse
from app.services.enrollment_service import EnrollmentService
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


# ─── Auth helper ─────────────────────────────────────────────────────────────

def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header is missing")
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid x-user-id header")


# ─── Serialiser ──────────────────────────────────────────────────────────────

def _to_response(e) -> EnrollmentResponse:
    return EnrollmentResponse(
        id=e.id,
        user_id=e.user_id,
        course_id=e.course_id,
        institution_id=e.institution_id,
        source=e.source.value,
        status=e.status.value,
        payment_id=e.payment_id,
        subscription_id=e.subscription_id,
        expires_at=e.expires_at,
        created_at=e.created_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# ENROLL
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/courses/{course_id}/enroll", response_model=APIResponse[EnrollmentResponse])
async def enroll_in_course(
    course_id: uuid.UUID,
    request: EnrollCourseRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    enrollment = await svc.enroll(course_id, user_id, request)
    return APIResponse(success=True, message="Enrolled successfully", data=_to_response(enrollment))


# ─────────────────────────────────────────────────────────────────────────────
# MY ENROLLMENTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/users/me/enrollments", response_model=PaginatedResponse[EnrollmentResponse])
async def list_my_enrollments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    enrollments, total = await svc.list_my_enrollments(user_id, page, limit)
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Enrollments retrieved",
        data=[_to_response(e) for e in enrollments],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@router.get("/users/me/enrollments/{enrollment_id}", response_model=APIResponse[EnrollmentResponse])
async def get_my_enrollment(
    enrollment_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    e = await svc.get_enrollment_by_id(enrollment_id)
    if e.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return APIResponse(success=True, message="Enrollment retrieved", data=_to_response(e))


# ─────────────────────────────────────────────────────────────────────────────
# COURSE ENROLLMENTS  (admin / instructor view)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/enrollments", response_model=PaginatedResponse[EnrollmentResponse])
async def list_course_enrollments(
    course_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    enrollments, total = await svc.list_course_enrollments(course_id, page, limit)
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Course enrollments retrieved",
        data=[_to_response(e) for e in enrollments],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


@router.get("/courses/{course_id}/students", response_model=PaginatedResponse[EnrollmentResponse])
async def list_course_students(
    course_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Alias for course enrollments – returns active learners."""
    svc = EnrollmentService(db)
    enrollments, total = await svc.list_course_enrollments(course_id, page, limit)
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Course students retrieved",
        data=[_to_response(e) for e in enrollments],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


# ─────────────────────────────────────────────────────────────────────────────
# ACCESS CHECKS  (internal / BFF facing)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/access/course/check", response_model=APIResponse[AccessCheckResponse])
async def check_course_access(request: CourseAccessCheckRequest, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    result = await svc.check_course_access(request)
    return APIResponse(success=True, message="Access check completed", data=result)


@router.post("/access/lesson/check", response_model=APIResponse[AccessCheckResponse])
async def check_lesson_access(request: LessonAccessCheckRequest, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    result = await svc.check_lesson_access(request)
    return APIResponse(success=True, message="Lesson access check completed", data=result)


@router.post("/access/bulk-check", response_model=APIResponse[BulkAccessCheckResponse])
async def bulk_check_access(request: BulkAccessCheckRequest, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    result = await svc.bulk_check_access(request)
    return APIResponse(success=True, message="Bulk access check completed", data=result)


@router.get("/users/{user_id}/courses/{course_id}/access", response_model=APIResponse[AccessCheckResponse])
async def get_user_course_access(
    user_id: uuid.UUID,
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    result = await svc.get_user_course_access(user_id, course_id)
    return APIResponse(success=True, message="Access check completed", data=result)


@router.get("/users/{user_id}/lessons/{lesson_id}/access", response_model=APIResponse[AccessCheckResponse])
async def get_user_lesson_access(
    user_id: uuid.UUID,
    lesson_id: uuid.UUID,
    course_id: uuid.UUID = Query(...),
    db: AsyncSession = Depends(get_db),
):
    svc = EnrollmentService(db)
    from app.schemas.requests import LessonAccessCheckRequest
    result = await svc.check_lesson_access(
        LessonAccessCheckRequest(user_id=user_id, lesson_id=lesson_id, course_id=course_id)
    )
    return APIResponse(success=True, message="Lesson access check completed", data=result)


# ─────────────────────────────────────────────────────────────────────────────
# STATUS MUTATIONS
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/enrollments/{enrollment_id}/cancel", response_model=APIResponse[EnrollmentResponse])
async def cancel_enrollment(enrollment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    e = await svc.cancel(enrollment_id)
    return APIResponse(success=True, message="Enrollment cancelled", data=_to_response(e))


@router.post("/enrollments/{enrollment_id}/expire", response_model=APIResponse[EnrollmentResponse])
async def expire_enrollment(enrollment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    e = await svc.expire(enrollment_id)
    return APIResponse(success=True, message="Enrollment expired", data=_to_response(e))


@router.post("/enrollments/{enrollment_id}/reactivate", response_model=APIResponse[EnrollmentResponse])
async def reactivate_enrollment(enrollment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    svc = EnrollmentService(db)
    e = await svc.reactivate(enrollment_id)
    return APIResponse(success=True, message="Enrollment reactivated", data=_to_response(e))
