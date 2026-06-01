from pydantic import BaseModel, Field
from uuid import UUID


class CreateInstitutionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=3, max_length=120)
    tagline: str | None = None
    description: str | None = None
    institution_type: str = "solo_creator"
    category: str | None = None


class UpdateInstitutionRequest(BaseModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    category: str | None = None
    website_url: str | None = None


class UpdateInstitutionBrandingRequest(BaseModel):
    logo_url: str | None = None
    banner_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    theme: dict | None = None


class UpdateInstitutionSettingsRequest(BaseModel):
    settings: dict


class SubmitVerificationRequest(BaseModel):
    document_url: str
    notes: str | None = None
