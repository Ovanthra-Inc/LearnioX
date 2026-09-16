from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CreateDiscussionRequest(BaseModel):
    lesson_id: UUID
    course_id: UUID
    content: str = Field(..., min_length=2, max_length=5000)
    parent_id: Optional[UUID] = None


class DiscussionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    course_id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    parent_id: Optional[UUID] = None
    content: str
    is_resolved: bool
    upvotes: int
    created_at: datetime
    replies: List["DiscussionResponse"] = Field(default_factory=list)


class DiscussionListResponse(BaseModel):
    items: List[DiscussionResponse]
    total: int
