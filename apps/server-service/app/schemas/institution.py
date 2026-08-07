from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CreateInstitutionRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Institution name")
    slug: Optional[str] = Field(None, min_length=3, max_length=100, description="URL-safe unique slug (auto-generated if omitted)")
    tagline: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    language: str = "en"
    currency: str = "INR"



class UpdateInstitutionRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    tagline: Optional[str] = None
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    currency: Optional[str] = None


class InstitutionBrandingRequest(BaseModel):
    file_id: UUID = Field(..., description="File storage UUID")


class InstitutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    name: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    status: str
    visibility: str
    is_verified: bool = False
    logo_file_id: Optional[UUID] = None
    banner_file_id: Optional[UUID] = None
    favicon_file_id: Optional[UUID] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    favicon_url: Optional[str] = None
    created_at: datetime


class InstitutionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[InstitutionResponse]


class InstitutionSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    allow_comments: bool = True
    allow_reviews: bool = True
    allow_public_courses: bool = True
    allow_memberships: bool = True
    allow_certificates: bool = True
    enable_ai: bool = True


class UpdateInstitutionSettingsRequest(BaseModel):
    allow_comments: Optional[bool] = None
    allow_reviews: Optional[bool] = None
    allow_public_courses: Optional[bool] = None
    allow_memberships: Optional[bool] = None
    allow_certificates: Optional[bool] = None
    enable_ai: Optional[bool] = None


class SocialLinkRequest(BaseModel):
    platform: Literal[
        "youtube",
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
        "telegram",
        "whatsapp",
    ]
    url: str


class SocialLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    platform: str
    url: str


class InstitutionStatisticsResponse(BaseModel):
    total_courses: int = 0
    total_students: int = 0
    total_instructors: int = 1
    total_views: int = 0
    total_lessons: int = 0
    total_reviews: int = 0
    average_rating: float = 0.0


class InstitutionLandingPageResponse(BaseModel):
    institution: InstitutionResponse
    settings: InstitutionSettingsResponse
    social_links: List[SocialLinkResponse]
    statistics: InstitutionStatisticsResponse
