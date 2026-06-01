from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CreateAuditEventRequest(BaseModel):
    actor_user_id: UUID | None = None
    institution_id: UUID | None = None
    action: str
    resource_type: str
    resource_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    metadata: dict | None = None


class AuditSearchRequest(BaseModel):
    institution_id: UUID | None = None
    actor_user_id: UUID | None = None
    resource_type: str | None = None
    action: str | None = None
    page: int = 1
    limit: int = 50


class AuditEventResponse(BaseModel):
    id: UUID
    actor_user_id: UUID | None
    institution_id: UUID | None
    action: str
    resource_type: str
    resource_id: str | None
    ip_address: str | None
    user_agent: str | None
    metadata_json: dict | None
    created_at: datetime
