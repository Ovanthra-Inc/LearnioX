import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.repositories.notification_repository import NotificationRepository
from app.models.notification import Notification, NotificationChannel, NotificationTemplate
from app.schemas.schemas import (
    SendNotificationRequest, BulkSendNotificationRequest,
    CreateNotificationTemplateRequest, NotificationResponse, NotificationTemplateResponse,
)
from learniox_common.schemas import APIResponse

router = APIRouter()


def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


def _nr(n) -> NotificationResponse:
    return NotificationResponse(
        id=n.id, user_id=n.user_id, institution_id=n.institution_id,
        channel=n.channel.value, title=n.title, body=n.body,
        status=n.status.value, metadata_json=n.metadata_json,
        is_read=n.is_read, read_at=n.read_at, created_at=n.created_at,
    )


def _tr(t) -> NotificationTemplateResponse:
    return NotificationTemplateResponse(
        id=t.id, institution_id=t.institution_id, code=t.code,
        channel=t.channel, subject=t.subject, body=t.body, created_at=t.created_at,
    )


@router.post("/notifications/send", response_model=APIResponse[NotificationResponse])
async def send_notification(request: SendNotificationRequest, db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    notif = Notification(
        user_id=request.user_id, institution_id=request.institution_id,
        channel=NotificationChannel(request.channel),
        title=request.title, body=request.body, metadata_json=request.metadata,
    )
    saved = await repo.create(notif)
    return APIResponse(success=True, message="Notification sent", data=_nr(saved))


@router.post("/notifications/send/bulk", response_model=APIResponse[dict])
async def bulk_send_notifications(request: BulkSendNotificationRequest, db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    notifs = [
        Notification(
            user_id=uid, institution_id=request.institution_id,
            channel=NotificationChannel(request.channel),
            title=request.title, body=request.body, metadata_json=request.metadata,
        ) for uid in request.user_ids
    ]
    await repo.bulk_create(notifs)
    return APIResponse(success=True, message=f"{len(notifs)} notifications sent", data={"count": len(notifs)})


@router.get("/notifications/me", response_model=APIResponse[list[NotificationResponse]])
async def list_my_notifications(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    notifs = await repo.list_by_user(user_id, page, limit)
    return APIResponse(success=True, message="Notifications retrieved", data=[_nr(n) for n in notifs])


@router.post("/notifications/{notification_id}/read", response_model=APIResponse[NotificationResponse])
async def mark_notification_read(notification_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    n = await repo.mark_read(notification_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return APIResponse(success=True, message="Marked as read", data=_nr(n))


@router.post("/notifications/me/read-all", response_model=APIResponse[dict])
async def mark_all_read(user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    count = await repo.mark_all_read(user_id)
    return APIResponse(success=True, message=f"{count} notifications marked as read", data={"count": count})


@router.post("/notifications/templates", response_model=APIResponse[NotificationTemplateResponse])
async def create_template(request: CreateNotificationTemplateRequest, db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    t = NotificationTemplate(
        institution_id=request.institution_id, code=request.code,
        channel=request.channel, subject=request.subject, body=request.body,
    )
    saved = await repo.create_template(t)
    return APIResponse(success=True, message="Template created", data=_tr(saved))


@router.get("/notifications/templates", response_model=APIResponse[list[NotificationTemplateResponse]])
async def list_templates(
    institution_id: uuid.UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    repo = NotificationRepository(db)
    templates = await repo.list_templates(institution_id)
    return APIResponse(success=True, message="Templates retrieved", data=[_tr(t) for t in templates])


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
