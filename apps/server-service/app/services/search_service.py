import math
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

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
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SearchRepository(db)

    async def global_search(self, q: str) -> GlobalSearchResponse:
        courses, c_total = await self.repo.search_courses(q=q, page=1, limit=5)
        institutions, i_total = await self.repo.search_institutions(q=q, page=1, limit=5)
        teachers, t_total = await self.repo.search_teachers(q=q, page=1, limit=5)

        return GlobalSearchResponse(
            courses=[SearchResultCourseItem(**c) for c in courses],
            institutions=[SearchResultInstitutionItem(**i) for i in institutions],
            teachers=[SearchResultTeacherItem(**t) for t in teachers],
            total_courses=c_total,
            total_institutions=i_total,
            total_teachers=t_total,
        )

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
        return PaginatedSearchResponse(
            items=[SearchResultCourseItem(**item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

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
        suggs = await self.repo.get_suggestions(q=q)
        return SearchSuggestionsResponse(**suggs)

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
