from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    name: str
    picture: Optional[str] = None
    avatar_file_id: Optional[UUID] = None
    provider: str = "google"
    is_active: bool = True
    is_verified: bool = True
    language: str = "en"
    theme: str = "light"
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None


class AvatarRequest(BaseModel):
    file_id: UUID


class UserPreferencesRequest(BaseModel):
    language: Optional[str] = Field(None, max_length=10)
    theme: Optional[str] = Field(None, max_length=20)
