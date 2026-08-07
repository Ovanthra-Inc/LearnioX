from typing import List
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_search_service
from app.core.response import APIResponse
from app.schemas.search import SearchResultCourseItem
from app.services.search_service import SearchService

router = APIRouter(prefix="/courses", tags=["Public Discovery Feeds"])


@router.get(
    "/trending",
    summary="Get Trending Courses Discovery Feed",
    response_model=APIResponse[List[SearchResultCourseItem]],
)
async def get_trending_courses(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_trending_courses(limit=limit)
    return APIResponse.ok(data=result, message="Trending courses retrieved")


@router.get(
    "/popular",
    summary="Get Popular Courses Discovery Feed",
    response_model=APIResponse[List[SearchResultCourseItem]],
)
async def get_popular_courses(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_popular_courses(limit=limit)
    return APIResponse.ok(data=result, message="Popular courses retrieved")


@router.get(
    "/latest",
    summary="Get Latest Published Courses Feed",
    response_model=APIResponse[List[SearchResultCourseItem]],
)
async def get_latest_courses(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_latest_courses(limit=limit)
    return APIResponse.ok(data=result, message="Latest courses retrieved")


@router.get(
    "/featured",
    summary="Get Featured Courses Feed",
    response_model=APIResponse[List[SearchResultCourseItem]],
)
async def get_featured_courses(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_featured_courses(limit=limit)
    return APIResponse.ok(data=result, message="Featured courses retrieved")
