from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.institution import Institution, InstitutionStatus, InstitutionVisibility
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.storage_repository import StorageRepository
from app.utils.text import slugify
from app.schemas.institution import (
    CreateInstitutionRequest,
    InstitutionLandingPageResponse,
    InstitutionListResponse,
    InstitutionResponse,
    InstitutionSettingsResponse,
    InstitutionStatisticsResponse,
    SocialLinkRequest,
    SocialLinkResponse,
    UpdateInstitutionRequest,
    UpdateInstitutionSettingsRequest,
)


class InstitutionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = InstitutionRepository(db)
        self.storage_repo = StorageRepository(db)

    async def _resolve_file_url(self, file_id: Optional[UUID]) -> Optional[str]:
        if not file_id:
            return None
        file_rec = await self.storage_repo.get_file_by_id(file_id)
        if file_rec:
            return f"/api/v1/storage/files/{file_rec.id}/preview"
        return None

    async def _to_response(self, inst: Institution) -> InstitutionResponse:
        logo_url = await self._resolve_file_url(inst.logo_file_id)
        banner_url = await self._resolve_file_url(inst.banner_file_id)
        favicon_url = await self._resolve_file_url(inst.favicon_file_id)

        resp = InstitutionResponse.model_validate(inst)
        resp.logo_url = logo_url
        resp.banner_url = banner_url
        resp.favicon_url = favicon_url
        return resp

    async def create_institution(
        self, owner_id: UUID, payload: CreateInstitutionRequest
    ) -> InstitutionResponse:
        raw_slug = payload.slug or payload.name
        slug = slugify(raw_slug)
        if not slug:
            raise ValidationException(message="Invalid slug string", error_code="INVALID_SLUG")


        existing = await self.repo.get_by_slug(slug, include_deleted=True)
        if existing:
            raise ConflictException(
                message=f"Slug '{slug}' is already registered", error_code="SLUG_EXISTS"
            )

        inst = await self.repo.create_institution(
            owner_id=owner_id,
            name=payload.name,
            slug=slug,
            tagline=payload.tagline,
            description=payload.description,
            email=payload.email,
            phone=payload.phone,
            website=str(payload.website) if payload.website else None,
            timezone_str=payload.timezone,
            language=payload.language,
            currency=payload.currency,
        )

        # Create default settings record
        await self.repo.create_default_settings(inst.id)
        return await self._to_response(inst)

    async def get_institution_by_id(self, institution_id: UUID) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        return await self._to_response(inst)

    async def get_institution_by_slug(self, slug: str) -> InstitutionResponse:
        formatted_slug = slugify(slug)
        inst = await self.repo.get_by_slug(formatted_slug)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        return await self._to_response(inst)

    async def list_my_institutions(self, owner_id: UUID) -> List[InstitutionResponse]:
        institutions = await self.repo.list_by_owner(owner_id)
        return [await self._to_response(inst) for inst in institutions]

    async def list_institutions(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        visibility_filter: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        verified_only: bool = False,
        sort: str = "desc",
    ) -> InstitutionListResponse:
        items, total = await self.repo.list_institutions(
            page=page,
            limit=limit,
            search=search,
            status_filter=status_filter,
            visibility_filter=visibility_filter,
            city=city,
            country=country,
            verified_only=verified_only,
            sort=sort,
        )
        responses = [await self._to_response(inst) for inst in items]
        return InstitutionListResponse(
            total=total, page=page, limit=limit, items=responses
        )

    async def update_institution(
        self, institution_id: UUID, user_id: UUID, payload: UpdateInstitutionRequest
    ) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        update_dict = payload.model_dump(exclude_unset=True)
        if "website" in update_dict and update_dict["website"]:
            update_dict["website"] = str(update_dict["website"])

        updated = await self.repo.update_institution(inst, update_dict)
        return await self._to_response(updated)

    async def soft_delete(self, institution_id: UUID, user_id: UUID) -> None:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        await self.repo.soft_delete(institution_id)

    async def restore(self, institution_id: UUID, user_id: UUID) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id, include_deleted=True)
        if not inst or not inst.is_deleted:
            raise NotFoundException(message="Institution not found in trash", error_code="NOT_FOUND")
        if inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        await self.repo.restore(institution_id)
        return await self._to_response(inst)

    async def publish(self, institution_id: UUID, user_id: UUID) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        updated = await self.repo.set_status(institution_id, InstitutionStatus.ACTIVE)
        return await self._to_response(updated)

    async def archive(self, institution_id: UUID, user_id: UUID) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        updated = await self.repo.set_status(institution_id, InstitutionStatus.ARCHIVED)
        return await self._to_response(updated)

    # Branding attachments
    async def update_branding(
        self,
        institution_id: UUID,
        user_id: UUID,
        branding_type: str,
        file_id: Optional[UUID],
    ) -> InstitutionResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        if file_id:
            file_rec = await self.storage_repo.get_file_by_id(file_id)
            if not file_rec:
                raise NotFoundException(message="Branding file not found in storage", error_code="FILE_NOT_FOUND")

        field_map = {
            "logo": "logo_file_id",
            "banner": "banner_file_id",
            "favicon": "favicon_file_id",
        }
        target_field = field_map.get(branding_type)
        if not target_field:
            raise ValidationException(message="Invalid branding type", error_code="INVALID_BRANDING_TYPE")

        updated = await self.repo.update_institution(inst, {target_field: file_id})
        return await self._to_response(updated)

    # Settings operations
    async def get_settings(self, institution_id: UUID) -> InstitutionSettingsResponse:
        settings = await self.repo.get_settings(institution_id)
        if not settings:
            settings = await self.repo.create_default_settings(institution_id)
        return InstitutionSettingsResponse.model_validate(settings)

    async def update_settings(
        self, institution_id: UUID, user_id: UUID, payload: UpdateInstitutionSettingsRequest
    ) -> InstitutionSettingsResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        updated = await self.repo.update_settings(
            institution_id, payload.model_dump(exclude_unset=True)
        )
        return InstitutionSettingsResponse.model_validate(updated)

    # Social Links
    async def add_social_link(
        self, institution_id: UUID, user_id: UUID, payload: SocialLinkRequest
    ) -> SocialLinkResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        link = await self.repo.add_social_link(
            institution_id=institution_id, platform=payload.platform, url=str(payload.url)
        )
        return SocialLinkResponse.model_validate(link)

    async def list_social_links(self, institution_id: UUID) -> List[SocialLinkResponse]:
        links = await self.repo.list_social_links(institution_id)
        return [SocialLinkResponse.model_validate(l) for l in links]

    async def update_social_link(
        self, link_id: UUID, institution_id: UUID, user_id: UUID, payload: SocialLinkRequest
    ) -> SocialLinkResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        updated = await self.repo.update_social_link(
            link_id=link_id, institution_id=institution_id, platform=payload.platform, url=str(payload.url)
        )
        if not updated:
            raise NotFoundException(message="Social link not found", error_code="LINK_NOT_FOUND")
        return SocialLinkResponse.model_validate(updated)

    async def delete_social_link(
        self, link_id: UUID, institution_id: UUID, user_id: UUID
    ) -> None:
        inst = await self.repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        success = await self.repo.delete_social_link(link_id, institution_id)
        if not success:
            raise NotFoundException(message="Social link not found", error_code="LINK_NOT_FOUND")

    # Statistics & Landing Page
    async def get_statistics(self, institution_id: UUID) -> InstitutionStatisticsResponse:
        inst = await self.repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")

        return InstitutionStatisticsResponse(
            total_courses=0,
            total_students=0,
            total_instructors=1,
            total_views=0,
            total_lessons=0,
            total_reviews=0,
            average_rating=0.0,
        )

    async def get_landing_page(self, institution_id_or_slug: str) -> InstitutionLandingPageResponse:
        # Check if UUID or slug
        try:
            inst_uuid = UUID(institution_id_or_slug)
            inst = await self.repo.get_by_id(inst_uuid)
        except ValueError:
            inst = await self.repo.get_by_slug(slugify(institution_id_or_slug))

        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")

        inst_resp = await self._to_response(inst)
        settings_resp = await self.get_settings(inst.id)
        social_links = await self.list_social_links(inst.id)
        stats = await self.get_statistics(inst.id)

        return InstitutionLandingPageResponse(
            institution=inst_resp,
            settings=settings_resp,
            social_links=social_links,
            statistics=stats,
        )
