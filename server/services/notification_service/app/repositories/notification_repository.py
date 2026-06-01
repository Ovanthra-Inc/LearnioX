import uuid
from datetime import datetime, timezone
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationStatus, NotificationChannel, NotificationTemplate


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, notif: Notification) -> Notification:
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def bulk_create(self, notifs: list[Notification]) -> None:
        for n in notifs:
            self.db.add(n)
        await self.db.commit()

    async def list_by_user(self, user_id: uuid.UUID, page: int = 1, limit: int = 20) -> list[Notification]:
        offset = (page - 1) * limit
        result = await self.db.execute(
            select(Notification).where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    async def mark_read(self, notification_id: uuid.UUID) -> Notification | None:
        result = await self.db.execute(select(Notification).where(Notification.id == notification_id))
        n = result.scalar_one_or_none()
        if n:
            n.is_read = True
            n.read_at = datetime.now(timezone.utc)
            n.status = NotificationStatus.READ
            await self.db.commit()
            await self.db.refresh(n)
        return n

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(Notification).where(and_(Notification.user_id == user_id, Notification.is_read == False))
        )
        notifs = result.scalars().all()
        now = datetime.now(timezone.utc)
        for n in notifs:
            n.is_read = True
            n.read_at = now
            n.status = NotificationStatus.READ
        await self.db.commit()
        return len(notifs)

    async def get_template(self, code: str, institution_id: uuid.UUID | None = None) -> NotificationTemplate | None:
        stmt = select(NotificationTemplate).where(NotificationTemplate.code == code)
        if institution_id:
            stmt = stmt.where(NotificationTemplate.institution_id == institution_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_template(self, template: NotificationTemplate) -> NotificationTemplate:
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def list_templates(self, institution_id: uuid.UUID | None = None) -> list[NotificationTemplate]:
        stmt = select(NotificationTemplate)
        if institution_id:
            stmt = stmt.where(NotificationTemplate.institution_id == institution_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
