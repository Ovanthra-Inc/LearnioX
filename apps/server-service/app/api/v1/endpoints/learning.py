from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_enrollment_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.enrollment import (
    CompletionResponse,
    ContinueLearningResponse,
    CourseProgressResponse,
    LearningHistoryItem,
    LessonProgressResponse,
    StartLessonRequest,
    UpdateProgressRequest,
)
from app.services.enrollment_service import EnrollmentService

router = APIRouter(tags=["Learning Progress & Resume Engine"])


@router.post(
    "/lessons/{lesson_id}/start",
    summary="Mark Lesson Started",
    response_model=APIResponse[LessonProgressResponse],
)
async def start_lesson(
    lesson_id: UUID,
    body: Optional[StartLessonRequest] = None,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.start_lesson(user_id=current_user.id, lesson_id=lesson_id, payload=body)
    return APIResponse.ok(data=result, message="Lesson marked as started")


@router.patch(
    "/lessons/{lesson_id}/progress",
    summary="Update Lesson Video Progress (Watch Time & Position)",
    response_model=APIResponse[LessonProgressResponse],
)
async def update_progress(
    lesson_id: UUID,
    body: UpdateProgressRequest,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.update_progress(user_id=current_user.id, lesson_id=lesson_id, payload=body)
    return APIResponse.ok(data=result, message="Lesson progress updated successfully")


@router.post(
    "/lessons/{lesson_id}/complete",
    summary="Mark Lesson Completed",
    response_model=APIResponse[LessonProgressResponse],
)
async def complete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.complete_lesson(user_id=current_user.id, lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson marked as completed")


@router.get(
    "/lessons/{lesson_id}/progress",
    summary="Get Learner's Progress for Lesson",
    response_model=APIResponse[LessonProgressResponse],
)
async def get_lesson_progress(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_lesson_progress(user_id=current_user.id, lesson_id=lesson_id)
    return APIResponse.ok(data=result, message="Lesson progress retrieved")


@router.get(
    "/courses/{course_id}/progress",
    summary="Get Learner's Progress for Course",
    response_model=APIResponse[CourseProgressResponse],
)
async def get_course_progress(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_course_progress(user_id=current_user.id, course_id=course_id)
    return APIResponse.ok(data=result, message="Course progress retrieved")


@router.get(
    "/users/me/continue-learning",
    summary="Get Continue Learning Resume Feed",
    response_model=APIResponse[ContinueLearningResponse],
)
async def get_continue_learning(
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_continue_learning(user_id=current_user.id)
    return APIResponse.ok(data=result, message="Continue learning feed compiled")


@router.get(
    "/users/me/history",
    summary="Get Learner Recently Viewed Lessons History",
    response_model=APIResponse[List[LearningHistoryItem]],
)
async def get_learning_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_learning_history(user_id=current_user.id, limit=limit)
    return APIResponse.ok(data=result, message="Learning history retrieved")


@router.get(
    "/courses/{course_id}/completion",
    summary="Get Learner Course Completion Status",
    response_model=APIResponse[CompletionResponse],
)
async def get_course_completion(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: EnrollmentService = Depends(get_enrollment_service),
):
    result = await service.get_course_completion(user_id=current_user.id, course_id=course_id)
    return APIResponse.ok(data=result, message="Course completion status retrieved")
