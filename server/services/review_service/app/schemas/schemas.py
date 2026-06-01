from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class CreateReviewRequest(BaseModel):
    course_id: UUID | None = None
    institution_id: UUID | None = None
    rating: int = Field(..., ge=1, le=5)
    title: str | None = None
    body: str | None = None


class UpdateReviewRequest(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    title: str | None = None
    body: str | None = None


class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID | None
    institution_id: UUID | None
    rating: int
    title: str | None
    body: str | None
    status: str
    created_at: datetime


class RatingSummaryResponse(BaseModel):
    average_rating: float
    total_reviews: int
    distribution: dict[str, int]
