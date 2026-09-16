from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenException, NotFoundException, ValidationException
from app.models.curriculum import Lesson
from app.models.discussion import Discussion
from app.models.user import User
from app.schemas.discussion import (
    CreateDiscussionRequest,
    DiscussionListResponse,
    DiscussionResponse,
)


class DiscussionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_discussion(
        self,
        user_id: UUID,
        payload: CreateDiscussionRequest,
    ) -> DiscussionResponse:
        lesson_res = await self.db.execute(select(Lesson).where(Lesson.id == payload.lesson_id))
        lesson = lesson_res.scalars().first()
        if not lesson:
            raise NotFoundException(message="Lesson not found", error_code="LESSON_NOT_FOUND")

        if payload.parent_id:
            parent_res = await self.db.execute(select(Discussion).where(Discussion.id == payload.parent_id))
            parent = parent_res.scalars().first()
            if not parent:
                raise NotFoundException(message="Parent discussion thread not found", error_code="PARENT_NOT_FOUND")

        discussion = Discussion(
            lesson_id=payload.lesson_id,
            course_id=payload.course_id,
            user_id=user_id,
            parent_id=payload.parent_id,
            content=payload.content,
        )
        self.db.add(discussion)
        await self.db.flush()
        await self.db.refresh(discussion)

        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()

        return DiscussionResponse(
            id=discussion.id,
            lesson_id=discussion.lesson_id,
            course_id=discussion.course_id,
            user_id=discussion.user_id,
            user_name=user.name if user else "Learner",
            user_avatar=getattr(user, "avatar_url", None) if user else None,
            parent_id=discussion.parent_id,
            content=discussion.content,
            is_resolved=discussion.is_resolved,
            upvotes=discussion.upvotes,
            created_at=discussion.created_at,
            replies=[],
        )

    async def list_lesson_discussions(
        self,
        lesson_id: UUID,
        page: int = 1,
        limit: int = 50,
    ) -> DiscussionListResponse:
        count_res = await self.db.execute(
            select(func.count(Discussion.id)).where(
                Discussion.lesson_id == lesson_id,
                Discussion.parent_id.is_(None),
            )
        )
        total = count_res.scalar_one()

        # Fetch top-level threads with user join
        query = (
            select(Discussion, User)
            .join(User, Discussion.user_id == User.id)
            .where(Discussion.lesson_id == lesson_id, Discussion.parent_id.is_(None))
            .order_by(Discussion.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        top_threads = res.all()

        thread_ids = [t[0].id for t in top_threads]
        replies_by_parent = {}
        if thread_ids:
            reply_query = (
                select(Discussion, User)
                .join(User, Discussion.user_id == User.id)
                .where(Discussion.parent_id.in_(thread_ids))
                .order_by(Discussion.created_at.asc())
            )
            reply_res = await self.db.execute(reply_query)
            for reply, r_user in reply_res.all():
                parent_id = reply.parent_id
                if parent_id not in replies_by_parent:
                    replies_by_parent[parent_id] = []
                replies_by_parent[parent_id].append(
                    DiscussionResponse(
                        id=reply.id,
                        lesson_id=reply.lesson_id,
                        course_id=reply.course_id,
                        user_id=reply.user_id,
                        user_name=r_user.name,
                        user_avatar=getattr(r_user, "avatar_url", None),
                        parent_id=reply.parent_id,
                        content=reply.content,
                        is_resolved=reply.is_resolved,
                        upvotes=reply.upvotes,
                        created_at=reply.created_at,
                        replies=[],
                    )
                )

        items = []
        for disc, usr in top_threads:
            items.append(
                DiscussionResponse(
                    id=disc.id,
                    lesson_id=disc.lesson_id,
                    course_id=disc.course_id,
                    user_id=disc.user_id,
                    user_name=usr.name,
                    user_avatar=getattr(usr, "avatar_url", None),
                    parent_id=disc.parent_id,
                    content=disc.content,
                    is_resolved=disc.is_resolved,
                    upvotes=disc.upvotes,
                    created_at=disc.created_at,
                    replies=replies_by_parent.get(disc.id, []),
                )
            )

        return DiscussionListResponse(items=items, total=total)

    async def upvote(self, discussion_id: UUID) -> int:
        res = await self.db.execute(select(Discussion).where(Discussion.id == discussion_id))
        disc = res.scalars().first()
        if not disc:
            raise NotFoundException(message="Discussion not found", error_code="DISCUSSION_NOT_FOUND")
        disc.upvotes += 1
        await self.db.flush()
        return disc.upvotes

    async def resolve(self, discussion_id: UUID, user_id: UUID) -> bool:
        res = await self.db.execute(select(Discussion).where(Discussion.id == discussion_id))
        disc = res.scalars().first()
        if not disc:
            raise NotFoundException(message="Discussion not found", error_code="DISCUSSION_NOT_FOUND")
        disc.is_resolved = True
        await self.db.flush()
        return True
