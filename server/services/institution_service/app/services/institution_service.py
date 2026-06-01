import uuid
import httpx
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.institution import Institution, InstitutionStatus, InstitutionType
from app.repositories.institution_repository import InstitutionRepository
from app.services.slug_service import SlugService
from app.schemas.requests import CreateInstitutionRequest, UpdateInstitutionRequest, UpdateInstitutionBrandingRequest, UpdateInstitutionSettingsRequest

settings = get_settings()
logger = logging.getLogger(__name__)


class InstitutionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = InstitutionRepository(db)

    async def create_institution(self, user_id: uuid.UUID, request: CreateInstitutionRequest) -> Institution:
        slug = SlugService.slugify(request.slug)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution slug is already taken"
            )

        inst_type = InstitutionType(request.institution_type)

        institution = Institution(
            name=request.name,
            slug=slug,
            tagline=request.tagline,
            description=request.description,
            institution_type=inst_type,
            status=InstitutionStatus.ACTIVE,
            owner_user_id=str(user_id),
            is_verified=False,
            settings={},
            branding={}
        )

        created_inst = await self.repo.create(institution)

        # Call RBAC Service to set up initial owner
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Authorization": f"Bearer {settings.INTERNAL_API_KEY}"}
                response = await client.post(
                    f"{settings.RBAC_SERVICE_URL}/api/v1/members/initial-owner/{created_inst.id}?user_id={user_id}",
                    headers=headers
                )
                if response.status_code not in (200, 201):
                    logger.error(f"Failed to assign initial owner in RBAC service. Status: {response.status_code}, Body: {response.text}")
        except Exception as e:
            logger.error(f"Failed to connect to RBAC service: {str(e)}")

        return created_inst

    async def get_by_id(self, institution_id: uuid.UUID) -> Institution:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found"
            )
        return inst

    async def get_by_slug(self, slug: str) -> Institution:
        inst = await self.repo.get_by_slug(slug)
        if not inst:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Institution not found"
            )
        return inst

    async def update_institution(self, institution_id: uuid.UUID, request: UpdateInstitutionRequest) -> Institution:
        inst = await self.get_by_id(institution_id)
        if request.name is not None:
            inst.name = request.name
        if request.tagline is not None:
            inst.tagline = request.tagline
        if request.description is not None:
            inst.description = request.description
        if request.category is not None:
            inst.category = request.category
        if request.website_url is not None:
            inst.website_url = request.website_url

        return await self.repo.update(inst)

    async def update_branding(self, institution_id: uuid.UUID, request: UpdateInstitutionBrandingRequest) -> Institution:
        inst = await self.get_by_id(institution_id)
        if request.logo_url is not None:
            inst.logo_url = request.logo_url
        if request.banner_url is not None:
            inst.banner_url = request.banner_url

        branding = inst.branding or {}
        if request.primary_color is not None:
            branding["primary_color"] = request.primary_color
        if request.accent_color is not None:
            branding["accent_color"] = request.accent_color
        if request.theme is not None:
            branding["theme"] = request.theme

        inst.branding = branding
        return await self.repo.update(inst)

    async def update_settings(self, institution_id: uuid.UUID, request: UpdateInstitutionSettingsRequest) -> Institution:
        inst = await self.get_by_id(institution_id)
        inst.settings = request.settings
        return await self.repo.update(inst)

    async def list_all(
        self, page: int, limit: int, owner_user_id: uuid.UUID | None = None
    ) -> tuple[list[Institution], int]:
        return await self.repo.list_all(page, limit, owner_user_id)

    async def delete_institution(self, institution_id: uuid.UUID) -> None:
        inst = await self.get_by_id(institution_id)
        await self.repo.delete(inst)

    async def submit_verification(self, institution_id: uuid.UUID) -> Institution:
        inst = await self.get_by_id(institution_id)
        if inst.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution is already verified"
            )
        # Mark status as under review — admin will approve via admin_service
        inst.status = InstitutionStatus.UNDER_REVIEW if hasattr(InstitutionStatus, "UNDER_REVIEW") else inst.status
        return await self.repo.update(inst)

