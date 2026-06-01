from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class SendNotificationRequest(BaseModel):
    user_id: UUID
    institution_id: UUID | None = None
    channel: str = "in_app"
    title: str
    body: str
    metadata: dict | None = None


class BulkSendNotificationRequest(BaseModel):
    user_ids: list[UUID]
    institution_id: UUID | None = None
    channel: str = "in_app"
    title: str
    body: str
    metadata: dict | None = None


class CreateNotificationTemplateRequest(BaseModel):
    institution_id: UUID | None = None
    code: str
    channel: str
    subject: str | None = None
    body: str


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID | None
    channel: str
    title: str
    body: str
    status: str
    metadata_json: dict | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class NotificationTemplateResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    code: str
    channel: str
    subject: str | None
    body: str
    created_at: datetime
