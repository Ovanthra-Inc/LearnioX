import uuid
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.marketing import Campaign, Lead
from learniox_common.schemas import APIResponse

router = APIRouter()


class CreateCampaignRequest(BaseModel):
    institution_id: UUID
    name: str
    campaign_type: str
    metadata: dict | None = None


class SubmitLeadRequest(BaseModel):
    institution_id: UUID
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    metadata: dict | None = None


class CampaignResponse(BaseModel):
    id: UUID; institution_id: UUID; name: str; campaign_type: str; status: str; created_at: datetime


class LeadResponse(BaseModel):
    id: UUID; institution_id: UUID; name: str | None; email: str | None
    phone: str | None; source: str | None; created_at: datetime


@router.post("/marketing/campaigns", response_model=APIResponse[CampaignResponse])
async def create_campaign(request: CreateCampaignRequest, db: AsyncSession = Depends(get_db)):
    c = Campaign(institution_id=request.institution_id, name=request.name,
                 campaign_type=request.campaign_type, metadata_json=request.metadata)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return APIResponse(success=True, message="Campaign created", data=CampaignResponse(
        id=c.id, institution_id=c.institution_id, name=c.name,
        campaign_type=c.campaign_type, status=c.status, created_at=c.created_at))


@router.get("/marketing/campaigns", response_model=APIResponse[list[CampaignResponse]])
async def list_campaigns(institution_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.institution_id == institution_id))
    return APIResponse(success=True, message="Campaigns retrieved", data=[
        CampaignResponse(id=c.id, institution_id=c.institution_id, name=c.name,
                         campaign_type=c.campaign_type, status=c.status, created_at=c.created_at)
        for c in result.scalars().all()
    ])


@router.post("/marketing/leads", response_model=APIResponse[LeadResponse])
async def submit_lead(request: SubmitLeadRequest, db: AsyncSession = Depends(get_db)):
    lead = Lead(institution_id=request.institution_id, name=request.name, email=request.email,
                phone=request.phone, source=request.source, metadata_json=request.metadata)
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return APIResponse(success=True, message="Lead captured", data=LeadResponse(
        id=lead.id, institution_id=lead.institution_id, name=lead.name,
        email=lead.email, phone=lead.phone, source=lead.source, created_at=lead.created_at))


@router.get("/marketing/leads", response_model=APIResponse[list[LeadResponse]])
async def list_leads(institution_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.institution_id == institution_id)
                              .order_by(Lead.created_at.desc()).limit(100))
    return APIResponse(success=True, message="Leads retrieved", data=[
        LeadResponse(id=l.id, institution_id=l.institution_id, name=l.name,
                     email=l.email, phone=l.phone, source=l.source, created_at=l.created_at)
        for l in result.scalars().all()
    ])


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
