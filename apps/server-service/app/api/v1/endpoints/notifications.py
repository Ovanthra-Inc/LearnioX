from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_notification_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=APIResponse[NotificationListResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    service: NotificationService = Depends(get_notification_service),
):
    result = await service.list_user_notifications(
        user_id=current_user.id,
        page=page,
        limit=limit,
        unread_only=unread_only,
    )
    return APIResponse.ok(data=result, message="Notifications retrieved")


@router.patch("/{notification_id}/read", response_model=APIResponse[NotificationResponse])
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: NotificationService = Depends(get_notification_service),
):
    result = await service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    return APIResponse.ok(data=result, message="Notification marked as read")


@router.post("/read-all", response_model=APIResponse[dict])
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    service: NotificationService = Depends(get_notification_service),
):
    count = await service.mark_all_as_read(user_id=current_user.id)
    return APIResponse.ok(data={"count": count}, message=f"Marked {count} notifications as read")
