from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class CourseResponse(BaseModel):
    id: UUID
    institution_id: UUID
    title: str
    slug: str
    subtitle: str | None
    description: str | None
    thumbnail_url: str | None
    promo_video_id: UUID | None
    category: str | None
    subcategory: str | None
    language: str | None
    level: str
    status: str
    access_type: str
    price_amount: float | None
    currency: str
    learning_outcomes: dict | None
    prerequisites: dict | None
    seo: dict | None
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class CoursePublicResponse(BaseModel):
    id: UUID
    institution_id: UUID
    title: str
    slug: str
    subtitle: str | None
    thumbnail_url: str | None
    category: str | None
    level: str
    language: str | None
    access_type: str
    price_amount: float | None
    currency: str


class CourseInstructorResponse(BaseModel):
    id: UUID
    course_id: UUID
    user_id: UUID
    created_at: datetime
