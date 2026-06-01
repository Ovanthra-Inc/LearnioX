from pydantic import BaseModel, Field
from uuid import UUID


class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    slug: str = Field(min_length=3, max_length=160)
    subtitle: str | None = None
    description: str | None = None
    category: str | None = None
    subcategory: str | None = None
    language: str | None = "English"
    level: str = "beginner"
    access_type: str = "free"
    price_amount: float | None = None
    currency: str = "INR"


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    category: str | None = None
    subcategory: str | None = None
    language: str | None = None
    level: str | None = None


class UpdateCoursePricingRequest(BaseModel):
    access_type: str
    price_amount: float | None = None
    currency: str = "INR"


class UpdateCourseSEORequest(BaseModel):
    meta_title: str | None = None
    meta_description: str | None = None
    keywords: list[str] = []


class UpdateCourseOutcomesRequest(BaseModel):
    learning_outcomes: list[str]
    prerequisites: list[str] = []


class AddCourseInstructorRequest(BaseModel):
    user_id: UUID
