from typing import List
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_search_service
from app.core.response import APIResponse
from app.schemas.search import SearchResultInstitutionItem
from app.services.search_service import SearchService

router = APIRouter(prefix="/institutions", tags=["Public Discovery Feeds"])


@router.get(
    "/trending",
    summary="Get Trending Institutions Feed",
    response_model=APIResponse[List[SearchResultInstitutionItem]],
)
async def get_trending_institutions(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_trending_institutions(limit=limit)
    return APIResponse.ok(data=result, message="Trending institutions retrieved")


@router.get(
    "/popular",
    summary="Get Popular Institutions Feed",
    response_model=APIResponse[List[SearchResultInstitutionItem]],
)
async def get_popular_institutions(
    limit: int = Query(10, ge=1, le=50),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_popular_institutions(limit=limit)
    return APIResponse.ok(data=result, message="Popular institutions retrieved")
