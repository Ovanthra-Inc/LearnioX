from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CreateCourseRequest(BaseModel):
    institution_id: UUID
    title: str = Field(..., min_length=5, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., min_length=10)
    category_id: Optional[UUID] = None
    language: str = Field("en", max_length=30)
    level: str = Field("BEGINNER", pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$")
    access_type: str = Field("FREE", pattern="^(FREE|PAID|MEMBERSHIP|INVITE_ONLY)$")
    price: Decimal = Field(Decimal("0.00"), ge=0)
    currency: str = Field("INR", max_length=10)
    certificate_enabled: bool = True
    allow_reviews: bool = True
    allow_download: bool = False


class UpdateCourseRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    category_id: Optional[UUID] = None
    language: Optional[str] = Field(None, max_length=30)
    level: Optional[str] = Field(None, pattern="^(BEGINNER|INTERMEDIATE|ADVANCED)$")
    visibility: Optional[str] = Field(None, pattern="^(PUBLIC|PRIVATE|UNLISTED)$")


class ThumbnailRequest(BaseModel):
    file_id: Optional[UUID] = None


class IntroVideoRequest(BaseModel):
    file_id: Optional[UUID] = None


class PricingRequest(BaseModel):
    access_type: str = Field(..., pattern="^(FREE|PAID|MEMBERSHIP|INVITE_ONLY)$")
    price: Decimal = Field(Decimal("0.00"), ge=0)
    discount_price: Optional[Decimal] = Field(None, ge=0)
    currency: str = Field("INR", max_length=10)


class VisibilityRequest(BaseModel):
    visibility: str = Field(..., pattern="^(PUBLIC|PRIVATE|UNLISTED)$")


class CategoryRequest(BaseModel):
    name: str = Field(..., max_length=150)
    parent_id: Optional[UUID] = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    parent_id: Optional[UUID] = None


class TagCreateRequest(BaseModel):
    name: str = Field(..., max_length=100)


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class TagRequest(BaseModel):
    tag_ids: List[UUID] = Field(..., description="List of tag UUIDs to attach")


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    institution_id: UUID
    title: str
    slug: str
    subtitle: Optional[str] = None
    description: str
    level: str
    status: str
    access_type: str
    visibility: str
    price: Decimal
    discount_price: Optional[Decimal] = None
    currency: str
    thumbnail_url: Optional[str] = None
    intro_video_url: Optional[str] = None
    created_at: datetime


class CourseDetailResponse(CourseResponse):
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = Field(default_factory=list)
    estimated_duration: float = 0.0
    certificate_enabled: bool = True
    allow_reviews: bool = True
    allow_download: bool = False
    published_at: Optional[datetime] = None


class CourseListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[CourseResponse]


class CourseStatisticsResponse(BaseModel):
    total_students: int = 0
    total_lessons: int = 0
    total_modules: int = 0
    total_reviews: int = 0
    average_rating: float = 0.0
    completion_rate: float = 0.0
    total_watch_hours: float = 0.0
