from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_optional_user, get_institution_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.institution import (
    CreateInstitutionRequest,
    InstitutionBrandingRequest,
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
from app.services.institution_service import InstitutionService

router = APIRouter(prefix="/institutions", tags=["Institutions"])


@router.post(
    "",
    summary="Create New Institution",
    response_model=APIResponse[InstitutionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_institution(
    body: CreateInstitutionRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.create_institution(owner_id=current_user.id, payload=body)
    return APIResponse.ok(data=result, message="Institution created successfully")


@router.get(
    "/my",
    summary="List Institutions Owned by Current User",
    response_model=APIResponse[List[InstitutionResponse]],
)
async def list_my_institutions(
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_my_institutions(owner_id=current_user.id)
    return APIResponse.ok(data=result, message="Owned institutions retrieved successfully")


@router.get(
    "/search",
    summary="Search & Filter Public Institutions",
    response_model=APIResponse[InstitutionListResponse],
)
async def search_institutions(
    keyword: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    verified: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page,
        limit=limit,
        search=keyword,
        city=city,
        country=country,
        verified_only=verified,
        status_filter="ACTIVE",
        visibility_filter="PUBLIC",
        sort=sort,
    )
    return APIResponse.ok(data=result, message="Institution search results")


@router.get(
    "/trending",
    summary="List Trending Institutions",
    response_model=APIResponse[InstitutionListResponse],
)
async def get_trending_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page, limit=limit, status_filter="ACTIVE", visibility_filter="PUBLIC"
    )
    return APIResponse.ok(data=result, message="Trending institutions retrieved")


@router.get(
    "/popular",
    summary="List Popular Institutions",
    response_model=APIResponse[InstitutionListResponse],
)
async def get_popular_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page, limit=limit, status_filter="ACTIVE", visibility_filter="PUBLIC"
    )
    return APIResponse.ok(data=result, message="Popular institutions retrieved")


@router.get(
    "/latest",
    summary="List Latest Registered Institutions",
    response_model=APIResponse[InstitutionListResponse],
)
async def get_latest_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page, limit=limit, status_filter="ACTIVE", visibility_filter="PUBLIC", sort="desc"
    )
    return APIResponse.ok(data=result, message="Latest institutions retrieved")


@router.get(
    "/verified",
    summary="List Verified Institutions",
    response_model=APIResponse[InstitutionListResponse],
)
async def get_verified_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page, limit=limit, verified_only=True, status_filter="ACTIVE", visibility_filter="PUBLIC"
    )
    return APIResponse.ok(data=result, message="Verified institutions retrieved")


@router.get(
    "/slug/{slug}",
    summary="Public Institution Lookup by Slug",
    response_model=APIResponse[InstitutionResponse],
)
async def get_institution_by_slug(
    slug: str,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.get_institution_by_slug(slug)
    return APIResponse.ok(data=result, message="Institution profile retrieved")


@router.get(
    "",
    summary="List Institutions (Admin / Discovery)",
    response_model=APIResponse[InstitutionListResponse],
)
async def list_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_institutions(
        page=page,
        limit=limit,
        search=search,
        status_filter=status,
        visibility_filter=visibility,
        sort=sort,
    )
    return APIResponse.ok(data=result, message="Institutions listed successfully")


@router.get(
    "/{id}",
    summary="Get Institution Details by ID",
    response_model=APIResponse[InstitutionResponse],
)
async def get_institution_by_id(
    id: UUID,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.get_institution_by_id(institution_id=id)
    return APIResponse.ok(data=result, message="Institution details retrieved")


@router.patch(
    "/{id}",
    summary="Update Institution Details",
    response_model=APIResponse[InstitutionResponse],
)
async def update_institution(
    id: UUID,
    body: UpdateInstitutionRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_institution(
        institution_id=id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Institution updated successfully")


@router.delete(
    "/{id}",
    summary="Soft Delete Institution",
    response_model=APIResponse[None],
)
async def delete_institution(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    await service.soft_delete(institution_id=id, user_id=current_user.id)
    return APIResponse.ok(message="Institution deleted successfully")


@router.patch(
    "/{id}/publish",
    summary="Publish Institution (Set Status ACTIVE)",
    response_model=APIResponse[InstitutionResponse],
)
async def publish_institution(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.publish(institution_id=id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Institution published successfully")


@router.patch(
    "/{id}/archive",
    summary="Archive Institution",
    response_model=APIResponse[InstitutionResponse],
)
async def archive_institution(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.archive(institution_id=id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Institution archived successfully")


@router.patch(
    "/{id}/restore",
    summary="Restore Institution from Trash",
    response_model=APIResponse[InstitutionResponse],
)
async def restore_institution(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.restore(institution_id=id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Institution restored successfully")


# Branding Endpoints
@router.patch(
    "/{id}/logo",
    summary="Update Institution Logo File",
    response_model=APIResponse[InstitutionResponse],
)
async def update_logo(
    id: UUID,
    body: InstitutionBrandingRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_branding(
        institution_id=id, user_id=current_user.id, branding_type="logo", file_id=body.file_id
    )
    return APIResponse.ok(data=result, message="Logo updated successfully")


@router.delete(
    "/{id}/logo",
    summary="Remove Institution Logo",
    response_model=APIResponse[InstitutionResponse],
)
async def delete_logo(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_branding(
        institution_id=id, user_id=current_user.id, branding_type="logo", file_id=None
    )
    return APIResponse.ok(data=result, message="Logo removed successfully")


@router.patch(
    "/{id}/banner",
    summary="Update Institution Banner File",
    response_model=APIResponse[InstitutionResponse],
)
async def update_banner(
    id: UUID,
    body: InstitutionBrandingRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_branding(
        institution_id=id, user_id=current_user.id, branding_type="banner", file_id=body.file_id
    )
    return APIResponse.ok(data=result, message="Banner updated successfully")


@router.delete(
    "/{id}/banner",
    summary="Remove Institution Banner",
    response_model=APIResponse[InstitutionResponse],
)
async def delete_banner(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_branding(
        institution_id=id, user_id=current_user.id, branding_type="banner", file_id=None
    )
    return APIResponse.ok(data=result, message="Banner removed successfully")


@router.patch(
    "/{id}/favicon",
    summary="Update Institution Favicon File",
    response_model=APIResponse[InstitutionResponse],
)
async def update_favicon(
    id: UUID,
    body: InstitutionBrandingRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_branding(
        institution_id=id, user_id=current_user.id, branding_type="favicon", file_id=body.file_id
    )
    return APIResponse.ok(data=result, message="Favicon updated successfully")


# Settings Endpoints
@router.get(
    "/{id}/settings",
    summary="Get Institution Settings",
    response_model=APIResponse[InstitutionSettingsResponse],
)
async def get_settings(
    id: UUID,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.get_settings(institution_id=id)
    return APIResponse.ok(data=result, message="Settings retrieved successfully")


@router.patch(
    "/{id}/settings",
    summary="Update Institution Settings",
    response_model=APIResponse[InstitutionSettingsResponse],
)
async def update_settings(
    id: UUID,
    body: UpdateInstitutionSettingsRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_settings(
        institution_id=id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Settings updated successfully")


# Social Links Endpoints
@router.post(
    "/{id}/social-links",
    summary="Add Institution Social Link",
    response_model=APIResponse[SocialLinkResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_social_link(
    id: UUID,
    body: SocialLinkRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.add_social_link(
        institution_id=id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Social link added successfully")


@router.get(
    "/{id}/social-links",
    summary="List Institution Social Links",
    response_model=APIResponse[List[SocialLinkResponse]],
)
async def list_social_links(
    id: UUID,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.list_social_links(institution_id=id)
    return APIResponse.ok(data=result, message="Social links retrieved successfully")


@router.patch(
    "/{id}/social-links/{link_id}",
    summary="Update Institution Social Link",
    response_model=APIResponse[SocialLinkResponse],
)
async def update_social_link(
    id: UUID,
    link_id: UUID,
    body: SocialLinkRequest,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.update_social_link(
        link_id=link_id, institution_id=id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Social link updated successfully")


@router.delete(
    "/{id}/social-links/{link_id}",
    summary="Delete Institution Social Link",
    response_model=APIResponse[None],
)
async def delete_social_link(
    id: UUID,
    link_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: InstitutionService = Depends(get_institution_service),
):
    await service.delete_social_link(
        link_id=link_id, institution_id=id, user_id=current_user.id
    )
    return APIResponse.ok(message="Social link deleted successfully")


# Statistics & Landing Page Endpoints
@router.get(
    "/{id}/statistics",
    summary="Get Institution Summary Statistics",
    response_model=APIResponse[InstitutionStatisticsResponse],
)
async def get_statistics(
    id: UUID,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.get_statistics(institution_id=id)
    return APIResponse.ok(data=result, message="Statistics retrieved successfully")


@router.get(
    "/{id}/landing-page",
    summary="Get Public Landing Page Compiled Data",
    response_model=APIResponse[InstitutionLandingPageResponse],
)
async def get_landing_page(
    id: str,
    service: InstitutionService = Depends(get_institution_service),
):
    result = await service.get_landing_page(institution_id_or_slug=id)
    return APIResponse.ok(data=result, message="Landing page data compiled successfully")
