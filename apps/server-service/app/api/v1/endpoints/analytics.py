from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.deps import get_db, require_course_admin, require_permission
from app.cache.redis_client import get_redis
from app.core.response import APIResponse
from app.schemas.analytics import CourseAnalyticsResponse, InstitutionAnalyticsResponse
from app.services.analytics_service import AnalyticsService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


def get_analytics_service(
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> AnalyticsService:
    return AnalyticsService(db, redis=redis)


@router.get(
    "/institutions/{institution_id}",
    response_model=APIResponse[InstitutionAnalyticsResponse],
    summary="Get Institution High-Level Analytics (RBAC Protected)",
)
async def get_institution_analytics(
    institution_id: UUID,
    _: bool = Depends(require_permission("analytics.view")),
    service: AnalyticsService = Depends(get_analytics_service),
):
    result = await service.get_institution_analytics(institution_id=institution_id)
    return APIResponse.ok(data=result, message="Institution analytics retrieved")


@router.get(
    "/courses/{course_id}",
    response_model=APIResponse[CourseAnalyticsResponse],
    summary="Get Deep Course Analytics (Admin)",
)
async def get_course_analytics(
    course_id: UUID,
    _: bool = Depends(require_course_admin("course.analytics")),
    service: AnalyticsService = Depends(get_analytics_service),
):
    result = await service.get_course_analytics(course_id=course_id)
    return APIResponse.ok(data=result, message="Course analytics retrieved")
