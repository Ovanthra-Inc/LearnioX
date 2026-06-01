from pydantic import BaseModel, EmailStr
from uuid import UUID


class CreateUserProfileRequest(BaseModel):
    auth_user_id: UUID
    full_name: str
    email: EmailStr | None = None


class UpdateUserProfileRequest(BaseModel):
    full_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    language: str | None = None
    country: str | None = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict


class UpdateInterestsRequest(BaseModel):
    interests: list[str]


class SaveCourseRequest(BaseModel):
    course_id: UUID


class FollowInstitutionRequest(BaseModel):
    institution_id: UUID
