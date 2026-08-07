from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_current_active_user,
    get_enrollment_service,
    require_course_admin,
)
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.enrollment import (
    EnrollRequest,
    EnrollmentListResponse,
    EnrollmentResponse,
    EnrollmentStatisticsResponse,
    UpdateEnrollmentRequest,
)
from app.services.enrollment_service import EnrollmentService

router = APIRouter(tags=["Course Enrollments"])


@router.post(
    "/courses/{course_id}/enroll",
    summary="Enroll Logged-in User in Course",
    response_model=APIResponse[EnrollmentResponse],
    status_code=status.HTTP_201_CREATED,
)
async def enroll_course(
    course_id: UUID,
    body: EnrollRequest = EnrollRequest(),
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.enroll_course(
        user_id=current_user.id, course_id=course_id, payload=body
    )
    return APIResponse.ok(data=result, message="Enrolled in course successfully")


@router.delete(
    "/courses/{course_id}/enroll",
    summary="Cancel / Unenroll from Course",
    response_model=APIResponse[None],
)
async def cancel_enrollment(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    await service.cancel_enrollment(user_id=current_user.id, course_id=course_id)
    return APIResponse.ok(message="Enrollment cancelled successfully")


@router.get(
    "/enrollments",
    summary="List Enrollments (System / Learner View)",
    response_model=APIResponse[EnrollmentListResponse],
)
async def list_enrollments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.list_user_enrollments(
        user_id=current_user.id, page=page, limit=limit, status=status
    )
    return APIResponse.ok(data=result, message="Enrollments retrieved")


@router.get(
    "/enrollments/{enrollment_id}",
    summary="Get Enrollment Details",
    response_model=APIResponse[EnrollmentResponse],
)
async def get_enrollment_by_id(
    enrollment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_enrollment(enrollment_id=enrollment_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Enrollment details retrieved")


@router.get(
    "/users/me/enrollments",
    summary="List Logged-in User's Active Courses",
    response_model=APIResponse[EnrollmentListResponse],
)
async def get_my_enrollments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.list_user_enrollments(
        user_id=current_user.id, page=page, limit=limit, status=status
    )
    return APIResponse.ok(data=result, message="My enrollments retrieved")


# ─── Admin Student Management Endpoints ───────────────────────────────────────
# CRIT-04: All admin routes now require the caller to be an institution owner/admin
# for the course being accessed, via require_course_admin().

@router.get(
    "/courses/{course_id}/students",
    summary="List Enrolled Learners in Course (Admin)",
    response_model=APIResponse[EnrollmentListResponse],
)
async def list_course_students(
    course_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None, max_length=100),
    _: bool = Depends(require_course_admin("student.view")),  # CRIT-04
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.list_course_enrollments(
        course_id=course_id, page=page, limit=limit, status=status, search=search
    )
    return APIResponse.ok(data=result, message="Enrolled students listed")


@router.get(
    "/courses/{course_id}/students/{user_id}",
    summary="Get Student Enrollment Details (Admin)",
    response_model=APIResponse[EnrollmentResponse],
)
async def get_student_enrollment(
    course_id: UUID,
    user_id: UUID,
    _: bool = Depends(require_course_admin("student.view")),  # CRIT-04
    service: EnrollmentService = Depends(get_enrollment_service),
):
    from app.core.exceptions import NotFoundException
    enr = await service.repo.find_enrollment(user_id, course_id)
    if not enr:
        raise NotFoundException(
            message="Student enrollment not found",
            error_code="ENROLLMENT_NOT_FOUND",
        )

    resp = EnrollmentResponse(
        enrollment_id=enr.id,
        course_id=enr.course_id,
        user_id=enr.user_id,
        status=enr.status.value if hasattr(enr.status, "value") else str(enr.status),
        access_type=enr.access_type.value if hasattr(enr.access_type, "value") else str(enr.access_type),
        enrolled_at=enr.enrolled_at,
        completed_at=enr.completed_at,
        expires_at=enr.expires_at,
    )
    return APIResponse.ok(data=resp, message="Student enrollment details retrieved")


@router.patch(
    "/courses/{course_id}/students/{user_id}",
    summary="Update Student Enrollment Access & Expiry (Admin)",
    response_model=APIResponse[EnrollmentResponse],
)
async def update_student_enrollment(
    course_id: UUID,
    user_id: UUID,
    body: UpdateEnrollmentRequest,
    _: bool = Depends(require_course_admin("student.manage")),  # CRIT-04
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.update_student_enrollment(
        course_id=course_id, target_user_id=user_id, payload=body
    )
    return APIResponse.ok(data=result, message="Student enrollment updated successfully")


@router.get(
    "/courses/{course_id}/enrollment-statistics",
    summary="Get Course Enrollment Statistics (Admin)",
    response_model=APIResponse[EnrollmentStatisticsResponse],
)
async def get_enrollment_statistics(
    course_id: UUID,
    _: bool = Depends(require_course_admin("course.analytics")),  # CRIT-04
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_enrollment_statistics(course_id=course_id)
    return APIResponse.ok(data=result, message="Enrollment statistics retrieved")
