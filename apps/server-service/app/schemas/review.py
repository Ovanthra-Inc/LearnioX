from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CreateReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: str = Field(..., min_length=5, max_length=2000)


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    rating: int
    title: Optional[str] = None
    comment: str
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    avg_rating: Decimal
    rating_distribution: Dict[int, int]  # e.g. {5: 10, 4: 3, 3: 1, 2: 0, 1: 0}
