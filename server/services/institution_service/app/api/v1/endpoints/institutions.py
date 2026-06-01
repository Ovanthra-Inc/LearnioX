from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta
import uuid

from app.dependencies.db import get_db
from app.schemas.requests import (
    CreateInstitutionRequest,
    UpdateInstitutionRequest,
    UpdateInstitutionBrandingRequest,
    UpdateInstitutionSettingsRequest,
)
from app.schemas.responses import InstitutionResponse, InstitutionPublicResponse
from app.services.institution_service import InstitutionService

router = APIRouter()


def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="x-user-id header is missing"
        )
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid x-user-id header"
        )


def _to_institution_response(inst) -> InstitutionResponse:
    return InstitutionResponse(
        id=inst.id,
        name=inst.name,
        slug=inst.slug,
        tagline=inst.tagline,
        description=inst.description,
        institution_type=inst.institution_type.value,
        status=inst.status.value,
        owner_user_id=inst.owner_user_id,
        logo_url=inst.logo_url,
        banner_url=inst.banner_url,
        category=inst.category,
        website_url=inst.website_url,
        branding=inst.branding or {},
        settings=inst.settings or {},
        is_verified=inst.is_verified,
        created_at=inst.created_at,
        updated_at=inst.updated_at
    )


def _to_public_response(inst) -> InstitutionPublicResponse:
    return InstitutionPublicResponse(
        id=inst.id,
        name=inst.name,
        slug=inst.slug,
        tagline=inst.tagline,
        description=inst.description,
        logo_url=inst.logo_url,
        banner_url=inst.banner_url,
        category=inst.category,
        is_verified=inst.is_verified
    )


@router.post("", response_model=APIResponse[InstitutionResponse])
async def create_institution(
    request: CreateInstitutionRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = InstitutionService(db)
    inst = await service.create_institution(user_id, request)
    return APIResponse(
        success=True,
        message="Institution created successfully",
        data=_to_institution_response(inst)
    )


@router.get("/{institution_id}", response_model=APIResponse[InstitutionResponse])
async def get_institution(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = InstitutionService(db)
    inst = await service.get_by_id(institution_id)
    return APIResponse(
        success=True,
        message="Institution retrieved successfully",
        data=_to_institution_response(inst)
    )


@router.patch("/{institution_id}", response_model=APIResponse[InstitutionResponse])
async def update_institution(
    institution_id: uuid.UUID,
    request: UpdateInstitutionRequest,
    db: AsyncSession = Depends(get_db)
):
    service = InstitutionService(db)
    inst = await service.update_institution(institution_id, request)
    return APIResponse(
        success=True,
        message="Institution updated successfully",
        data=_to_institution_response(inst)
    )


@router.get("/slug/{slug}", response_model=APIResponse[InstitutionPublicResponse])
async def get_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    service = InstitutionService(db)
    inst = await service.get_by_slug(slug)
    return APIResponse(
        success=True,
        message="Institution retrieved successfully",
        data=_to_public_response(inst)
    )


@router.patch("/{institution_id}/branding", response_model=APIResponse[InstitutionResponse])
async def update_branding(
    institution_id: uuid.UUID,
    request: UpdateInstitutionBrandingRequest,
    db: AsyncSession = Depends(get_db)
):
    service = InstitutionService(db)
    inst = await service.update_branding(institution_id, request)
    return APIResponse(
        success=True,
        message="Branding updated successfully",
        data=_to_institution_response(inst)
    )


@router.patch("/{institution_id}/settings", response_model=APIResponse[InstitutionResponse])
async def update_settings(
    institution_id: uuid.UUID,
    request: UpdateInstitutionSettingsRequest,
    db: AsyncSession = Depends(get_db)
):
    service = InstitutionService(db)
    inst = await service.update_settings(institution_id, request)
    return APIResponse(
        success=True,
        message="Settings updated successfully",
        data=_to_institution_response(inst)
    )


# ── List all (with optional owner filter) ────────────────────────────────────

@router.get("", response_model=PaginatedResponse[InstitutionResponse])
async def list_institutions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner_user_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = InstitutionService(db)
    institutions, total = await service.list_all(page, limit, owner_user_id)
    total_pages = (total + limit - 1) // limit
    return PaginatedResponse(
        success=True,
        message="Institutions retrieved",
        data=[_to_institution_response(i) for i in institutions],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=total_pages),
    )


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{institution_id}", response_model=APIResponse[dict])
async def delete_institution(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = InstitutionService(db)
    await service.delete_institution(institution_id)
    return APIResponse(success=True, message="Institution deleted", data={})


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/{institution_id}/stats", response_model=APIResponse[dict])
async def get_institution_stats(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Basic stats endpoint — expands as other services come online."""
    service = InstitutionService(db)
    await service.get_by_id(institution_id)  # 404 if not found
    return APIResponse(
        success=True,
        message="Institution stats retrieved",
        data={
            "institution_id": str(institution_id),
            "note": "Full stats available once analytics_service is wired in.",
        },
    )


# ── Verification ──────────────────────────────────────────────────────────────

@router.post("/{institution_id}/submit-verification", response_model=APIResponse[InstitutionResponse])
async def submit_verification(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = InstitutionService(db)
    inst = await service.submit_verification(institution_id)
    return APIResponse(
        success=True,
        message="Verification request submitted",
        data=_to_institution_response(inst),
    )


@router.get("/{institution_id}/verification-status", response_model=APIResponse[dict])
async def verification_status(
    institution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = InstitutionService(db)
    inst = await service.get_by_id(institution_id)
    return APIResponse(
        success=True,
        message="Verification status retrieved",
        data={"is_verified": inst.is_verified, "status": inst.status.value},
    )
