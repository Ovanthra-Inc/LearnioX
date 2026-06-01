from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class UserProfileResponse(BaseModel):
    id: UUID
    auth_user_id: UUID
    full_name: str
    username: str | None
    avatar_url: str | None
    bio: str | None
    user_type: str
    language: str | None
    country: str | None
    interests: dict | None
    preferences: dict | None
    created_at: datetime
    updated_at: datetime


class SavedCourseResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    created_at: datetime


class FollowedInstitutionResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    created_at: datetime
