from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.notification import Notification, NotificationType
from app.schemas.notification import (
    CreateNotificationRequest,
    NotificationListResponse,
    NotificationResponse,
)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_user_notifications(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False,
    ) -> NotificationListResponse:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)

        count_query = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        if unread_only:
            count_query = count_query.where(Notification.is_read == False)

        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        unread_res = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        unread_count = unread_res.scalar_one()

        query = (
            query.order_by(Notification.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        notifications = list(res.scalars().all())

        return NotificationListResponse(
            items=[
                NotificationResponse(
                    id=n.id,
                    user_id=n.user_id,
                    title=n.title,
                    message=n.message,
                    type=n.type.value if hasattr(n.type, "value") else str(n.type),
                    link=n.link,
                    is_read=n.is_read,
                    read_at=n.read_at,
                    created_at=n.created_at,
                )
                for n in notifications
            ],
            total=total,
            unread_count=unread_count,
        )

    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> NotificationResponse:
        res = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notif = res.scalars().first()
        if not notif:
            raise NotFoundException(message="Notification not found", error_code="NOTIFICATION_NOT_FOUND")

        if not notif.is_read:
            notif.is_read = True
            notif.read_at = datetime.now(timezone.utc)
            await self.db.flush()
            await self.db.refresh(notif)

        return NotificationResponse(
            id=notif.id,
            user_id=notif.user_id,
            title=notif.title,
            message=notif.message,
            type=notif.type.value if hasattr(notif.type, "value") else str(notif.type),
            link=notif.link,
            is_read=notif.is_read,
            read_at=notif.read_at,
            created_at=notif.created_at,
        )

    async def mark_all_as_read(self, user_id: UUID) -> int:
        res = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.flush()
        return res.rowcount

    async def create_notification(
        self,
        user_id: UUID,
        title: str,
        message: str,
        type: str = "SYSTEM",
        link: Optional[str] = None,
    ) -> NotificationResponse:
        notif_type = NotificationType(type) if type in NotificationType.__members__ else NotificationType.SYSTEM
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            link=link,
            is_read=False,
        )
        self.db.add(notif)
        await self.db.flush()
        await self.db.refresh(notif)

        return NotificationResponse(
            id=notif.id,
            user_id=notif.user_id,
            title=notif.title,
            message=notif.message,
            type=notif.type.value if hasattr(notif.type, "value") else str(notif.type),
            link=notif.link,
            is_read=notif.is_read,
            read_at=notif.read_at,
            created_at=notif.created_at,
        )
