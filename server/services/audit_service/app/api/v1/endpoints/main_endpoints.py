import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.dependencies.db import get_db
from app.models.audit_event import AuditEvent
from app.schemas.schemas import CreateAuditEventRequest, AuditSearchRequest, AuditEventResponse
from learniox_common.schemas import APIResponse

router = APIRouter()


def _ar(e) -> AuditEventResponse:
    return AuditEventResponse(
        id=e.id, actor_user_id=e.actor_user_id, institution_id=e.institution_id,
        action=e.action, resource_type=e.resource_type, resource_id=e.resource_id,
        ip_address=e.ip_address, user_agent=e.user_agent,
        metadata_json=e.metadata_json, created_at=e.created_at,
    )


@router.post("/audit/events", response_model=APIResponse[AuditEventResponse])
async def create_audit_event(request: CreateAuditEventRequest, db: AsyncSession = Depends(get_db)):
    event = AuditEvent(
        actor_user_id=request.actor_user_id, institution_id=request.institution_id,
        action=request.action, resource_type=request.resource_type,
        resource_id=request.resource_id, ip_address=request.ip_address,
        user_agent=request.user_agent, metadata_json=request.metadata,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return APIResponse(success=True, message="Audit event recorded", data=_ar(event))


@router.get("/audit/events", response_model=APIResponse[list[AuditEventResponse]])
async def search_audit_events(
    institution_id: uuid.UUID | None = Query(None),
    actor_user_id: uuid.UUID | None = Query(None),
    resource_type: str | None = Query(None),
    action: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditEvent)
    filters = []
    if institution_id:
        filters.append(AuditEvent.institution_id == institution_id)
    if actor_user_id:
        filters.append(AuditEvent.actor_user_id == actor_user_id)
    if resource_type:
        filters.append(AuditEvent.resource_type == resource_type)
    if action:
        filters.append(AuditEvent.action == action)
    if filters:
        stmt = stmt.where(and_(*filters))
    stmt = stmt.order_by(AuditEvent.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    events = list(result.scalars().all())
    return APIResponse(success=True, message="Audit events", data=[_ar(e) for e in events])


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
