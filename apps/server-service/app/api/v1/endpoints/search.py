from decimal import Decimal
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_search_service
from app.core.response import APIResponse
from app.schemas.search import (
    GlobalSearchResponse,
    PaginatedSearchResponse,
    SearchResultCourseItem,
    SearchResultInstitutionItem,
    SearchResultTeacherItem,
    SearchSuggestionsResponse,
)
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Marketplace Search Engine"])


@router.get(
    "",
    summary="Unified Global Search (Courses, Institutions, Instructors)",
    response_model=APIResponse[GlobalSearchResponse],
)
async def global_search(
    q: str = Query(..., min_length=1),
    service: SearchService = Depends(get_search_service),
):
    result = await service.global_search(q=q)
    return APIResponse.ok(data=result, message="Global search completed")


@router.get(
    "/courses",
    summary="Advanced Multi-Facet Course Search",
    response_model=APIResponse[PaginatedSearchResponse[SearchResultCourseItem]],
)
async def search_courses(
    q: Optional[str] = Query(None),
    category_id: Optional[UUID] = Query(None),
    tag_id: Optional[UUID] = Query(None),
    institution_id: Optional[UUID] = Query(None),
    level: Optional[str] = Query(None, pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$"),
    access_type: Optional[str] = Query(None, pattern="^(FREE|PAID|MEMBERSHIP|INVITE_ONLY)$"),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    sort_by: str = Query("newest", pattern="^(popular|newest|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: SearchService = Depends(get_search_service),
):
    result = await service.search_courses(
        q=q, category_id=category_id, tag_id=tag_id, institution_id=institution_id,
        level=level, access_type=access_type, min_price=min_price, max_price=max_price,
        sort_by=sort_by, page=page, limit=limit,
    )
    return APIResponse.ok(data=result, message="Course search completed")


@router.get(
    "/institutions",
    summary="Search Institutions",
    response_model=APIResponse[PaginatedSearchResponse[SearchResultInstitutionItem]],
)
async def search_institutions(
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: SearchService = Depends(get_search_service),
):
    result = await service.search_institutions(q=q, page=page, limit=limit)
    return APIResponse.ok(data=result, message="Institution search completed")


@router.get(
    "/teachers",
    summary="Search Instructors / Teachers",
    response_model=APIResponse[PaginatedSearchResponse[SearchResultTeacherItem]],
)
async def search_teachers(
    q: Optional[str] = Query(None),
    institution_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: SearchService = Depends(get_search_service),
):
    result = await service.search_teachers(q=q, institution_id=institution_id, page=page, limit=limit)
    return APIResponse.ok(data=result, message="Teacher search completed")


@router.get(
    "/suggestions",
    summary="Instant Search Autocomplete & Keyword Suggestions",
    response_model=APIResponse[SearchSuggestionsResponse],
)
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    service: SearchService = Depends(get_search_service),
):
    result = await service.get_suggestions(q=q)
    return APIResponse.ok(data=result, message="Search suggestions generated")
