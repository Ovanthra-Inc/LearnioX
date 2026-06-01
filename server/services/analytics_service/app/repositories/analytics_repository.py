import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.analytics_event import AnalyticsEvent


class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def track(self, event: AnalyticsEvent) -> AnalyticsEvent:
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def bulk_track(self, events: list[AnalyticsEvent]) -> list[AnalyticsEvent]:
        for e in events:
            self.db.add(e)
        await self.db.commit()
        return events

    async def list_by_course(self, course_id: uuid.UUID, limit: int = 100) -> list[AnalyticsEvent]:
        result = await self.db.execute(
            select(AnalyticsEvent).where(AnalyticsEvent.course_id == course_id)
            .order_by(AnalyticsEvent.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_institution(self, institution_id: uuid.UUID, limit: int = 100) -> list[AnalyticsEvent]:
        result = await self.db.execute(
            select(AnalyticsEvent).where(AnalyticsEvent.institution_id == institution_id)
            .order_by(AnalyticsEvent.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
