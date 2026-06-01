from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class InstitutionResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    tagline: str | None
    description: str | None
    institution_type: str
    status: str
    owner_user_id: UUID | str
    logo_url: str | None
    banner_url: str | None
    category: str | None
    website_url: str | None
    branding: dict | None
    settings: dict | None
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class InstitutionPublicResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    tagline: str | None
    description: str | None
    logo_url: str | None
    banner_url: str | None
    category: str | None
    is_verified: bool


class InstitutionVerificationResponse(BaseModel):
    id: UUID
    institution_id: UUID
    status: str
    document_url: str | None
    rejection_reason: str | None
    created_at: datetime
