from datetime import datetime
from decimal import Decimal
from typing import Generic, List, Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class SearchResultCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    subtitle: Optional[str] = None
    description: str
    institution_id: UUID
    institution_name: Optional[str] = None
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    price: Decimal
    currency: str
    level: str
    access_type: str
    enrollment_count: int = 0
    created_at: datetime


class SearchResultInstitutionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    course_count: int = 0
    member_count: int = 0
    created_at: datetime


class SearchResultTeacherItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    name: str
    email: str
    institution_id: UUID
    institution_name: Optional[str] = None
    role_name: Optional[str] = None


class GlobalSearchResponse(BaseModel):
    courses: List[SearchResultCourseItem] = Field(default_factory=list)
    institutions: List[SearchResultInstitutionItem] = Field(default_factory=list)
    teachers: List[SearchResultTeacherItem] = Field(default_factory=list)
    total_courses: int = 0
    total_institutions: int = 0
    total_teachers: int = 0


class SearchSuggestionsResponse(BaseModel):
    courses: List[str] = Field(default_factory=list)
    institutions: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class PaginatedSearchResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
