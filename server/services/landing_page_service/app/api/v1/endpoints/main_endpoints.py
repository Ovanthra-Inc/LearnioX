import uuid
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.landing_page import LandingPage, LandingPageSection
from learniox_common.schemas import APIResponse

router = APIRouter()


class CreateLandingPageRequest(BaseModel):
    institution_id: UUID
    theme_json: dict | None = None
    seo_json: dict | None = None


class CreateSectionRequest(BaseModel):
    section_type: str
    title: str | None = None
    content_json: dict | None = None
    order_index: int = 0
    is_visible: bool = True


class LandingPageResponse(BaseModel):
    id: UUID; institution_id: UUID; status: str
    theme_json: dict | None; seo_json: dict | None; created_at: datetime


class SectionResponse(BaseModel):
    id: UUID; landing_page_id: UUID; section_type: str
    title: str | None; content_json: dict | None; order_index: int; is_visible: bool


@router.post("/landing-pages", response_model=APIResponse[LandingPageResponse])
async def create_landing_page(request: CreateLandingPageRequest, db: AsyncSession = Depends(get_db)):
    lp = LandingPage(**request.model_dump())
    db.add(lp)
    await db.commit()
    await db.refresh(lp)
    return APIResponse(success=True, message="Landing page created", data=LandingPageResponse(
        id=lp.id, institution_id=lp.institution_id, status=lp.status,
        theme_json=lp.theme_json, seo_json=lp.seo_json, created_at=lp.created_at))


@router.get("/landing-pages/{institution_id}", response_model=APIResponse[LandingPageResponse])
async def get_landing_page(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LandingPage).where(LandingPage.institution_id == institution_id))
    lp = result.scalar_one_or_none()
    if not lp:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Landing page not found")
    return APIResponse(success=True, message="Landing page retrieved", data=LandingPageResponse(
        id=lp.id, institution_id=lp.institution_id, status=lp.status,
        theme_json=lp.theme_json, seo_json=lp.seo_json, created_at=lp.created_at))


@router.post("/landing-pages/{landing_page_id}/sections", response_model=APIResponse[SectionResponse])
async def add_section(landing_page_id: uuid.UUID, request: CreateSectionRequest, db: AsyncSession = Depends(get_db)):
    s = LandingPageSection(landing_page_id=landing_page_id, **request.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return APIResponse(success=True, message="Section added", data=SectionResponse(
        id=s.id, landing_page_id=s.landing_page_id, section_type=s.section_type,
        title=s.title, content_json=s.content_json, order_index=s.order_index, is_visible=s.is_visible))


@router.post("/landing-pages/{landing_page_id}/publish", response_model=APIResponse[LandingPageResponse])
async def publish_landing_page(landing_page_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LandingPage).where(LandingPage.id == landing_page_id))
    lp = result.scalar_one_or_none()
    if not lp:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Landing page not found")
    lp.status = "published"
    await db.commit()
    await db.refresh(lp)
    return APIResponse(success=True, message="Landing page published", data=LandingPageResponse(
        id=lp.id, institution_id=lp.institution_id, status=lp.status,
        theme_json=lp.theme_json, seo_json=lp.seo_json, created_at=lp.created_at))


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
