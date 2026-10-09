import math
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.redis_client import cache_get, cache_set, search_key
from app.core.config import settings
from app.repositories.search_repository import SearchRepository
from app.schemas.search import (
    GlobalSearchResponse,
    PaginatedSearchResponse,
    SearchResultCourseItem,
    SearchResultInstitutionItem,
    SearchResultTeacherItem,
    SearchSuggestionsResponse,
)


class SearchService:
    def __init__(self, db: AsyncSession, redis: Optional[Redis] = None):
        self.db = db
        self.repo = SearchRepository(db)
        self.redis = redis

    async def global_search(self, q: str) -> GlobalSearchResponse:
        cache_k = search_key("global", q=q)
        cached = await cache_get(self.redis, cache_k)
        if cached:
            return GlobalSearchResponse.model_validate(cached)

        courses, c_total = await self.repo.search_courses(q=q, page=1, limit=5)
        institutions, i_total = await self.repo.search_institutions(q=q, page=1, limit=5)
        teachers, t_total = await self.repo.search_teachers(q=q, page=1, limit=5)

        res = GlobalSearchResponse(
            courses=[SearchResultCourseItem(**c) for c in courses],
            institutions=[SearchResultInstitutionItem(**i) for i in institutions],
            teachers=[SearchResultTeacherItem(**t) for t in teachers],
            total_courses=c_total,
            total_institutions=i_total,
            total_teachers=t_total,
        )
        await cache_set(self.redis, cache_k, res.model_dump(mode="json"), ttl=settings.CACHE_TTL_SEARCH)
        return res

    async def search_courses(
        self,
        q: Optional[str] = None,
        category_id: Optional[UUID] = None,
        tag_id: Optional[UUID] = None,
        institution_id: Optional[UUID] = None,
        level: Optional[str] = None,
        access_type: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sort_by: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedSearchResponse[SearchResultCourseItem]:
        cache_k = search_key(
            "courses",
            q=q,
            category_id=str(category_id) if category_id else None,
            tag_id=str(tag_id) if tag_id else None,
            institution_id=str(institution_id) if institution_id else None,
            level=level,
            access_type=access_type,
            min_price=str(min_price) if min_price else None,
            max_price=str(max_price) if max_price else None,
            sort_by=sort_by,
            page=page,
            limit=limit,
        )
        cached = await cache_get(self.redis, cache_k)
        if cached:
            return PaginatedSearchResponse[SearchResultCourseItem].model_validate(cached)

        items, total = await self.repo.search_courses(
            q=q,
            category_id=category_id,
            tag_id=tag_id,
            institution_id=institution_id,
            level=level,
            access_type=access_type,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            page=page,
            limit=limit,
        )
        total_pages = math.ceil(total / limit) if limit > 0 else 1
        res = PaginatedSearchResponse(
            items=[SearchResultCourseItem(**item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
        await cache_set(self.redis, cache_k, res.model_dump(mode="json"), ttl=settings.CACHE_TTL_SEARCH)
        return res

    async def search_institutions(
        self, q: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> PaginatedSearchResponse[SearchResultInstitutionItem]:
        items, total = await self.repo.search_institutions(q=q, page=page, limit=limit)
        total_pages = math.ceil(total / limit) if limit > 0 else 1
        return PaginatedSearchResponse(
            items=[SearchResultInstitutionItem(**item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def search_teachers(
        self,
        q: Optional[str] = None,
        institution_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedSearchResponse[SearchResultTeacherItem]:
        items, total = await self.repo.search_teachers(
            q=q, institution_id=institution_id, page=page, limit=limit
        )
        total_pages = math.ceil(total / limit) if limit > 0 else 1
        return PaginatedSearchResponse(
            items=[SearchResultTeacherItem(**item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def get_suggestions(self, q: str) -> SearchSuggestionsResponse:
        cache_k = search_key("suggestions", q=q)
        cached = await cache_get(self.redis, cache_k)
        if cached:
            return SearchSuggestionsResponse.model_validate(cached)

        suggs = await self.repo.get_suggestions(q=q)
        res = SearchSuggestionsResponse(**suggs)
        await cache_set(self.redis, cache_k, res.model_dump(mode="json"), ttl=settings.CACHE_TTL_SEARCH)
        return res

    # Discovery Services
    async def get_trending_courses(self, limit: int = 10) -> List[SearchResultCourseItem]:
        res = await self.search_courses(sort_by="popular", page=1, limit=limit)
        return res.items

    async def get_popular_courses(self, limit: int = 10) -> List[SearchResultCourseItem]:
        res = await self.search_courses(sort_by="popular", page=1, limit=limit)
        return res.items

    async def get_latest_courses(self, limit: int = 10) -> List[SearchResultCourseItem]:
        res = await self.search_courses(sort_by="newest", page=1, limit=limit)
        return res.items

    async def get_featured_courses(self, limit: int = 10) -> List[SearchResultCourseItem]:
        res = await self.search_courses(sort_by="newest", page=1, limit=limit)
        return res.items

    async def get_trending_institutions(self, limit: int = 10) -> List[SearchResultInstitutionItem]:
        res = await self.search_institutions(page=1, limit=limit)
        return res.items

    async def get_popular_institutions(self, limit: int = 10) -> List[SearchResultInstitutionItem]:
        res = await self.search_institutions(page=1, limit=limit)
        return res.items
