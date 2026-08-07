from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, update, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import InstitutionInvite, InstitutionMember, InviteStatus, MemberStatus
from app.models.user import User


class MemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_member(
        self,
        institution_id: UUID,
        user_id: UUID,
        status: MemberStatus = MemberStatus.ACTIVE,
        role_id: Optional[UUID] = None,
    ) -> InstitutionMember:
        now = datetime.now(timezone.utc)
        member = InstitutionMember(
            institution_id=institution_id,
            user_id=user_id,
            role_id=role_id,
            status=status,
            joined_at=now,
            last_active_at=now,
        )
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def get_member_by_id(
        self, member_id: UUID, institution_id: Optional[UUID] = None
    ) -> Optional[InstitutionMember]:
        query = select(InstitutionMember).where(InstitutionMember.id == member_id)
        if institution_id:
            query = query.where(InstitutionMember.institution_id == institution_id)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_member_by_user_and_inst(
        self, user_id: UUID, institution_id: UUID
    ) -> Optional[InstitutionMember]:
        result = await self.db.execute(
            select(InstitutionMember).where(
                and_(
                    InstitutionMember.user_id == user_id,
                    InstitutionMember.institution_id == institution_id,
                )
            )
        )
        return result.scalars().first()

    async def list_members(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> Tuple[List[Tuple[InstitutionMember, User]], int]:
        conditions = [InstitutionMember.institution_id == institution_id]

        if status_filter:
            conditions.append(InstitutionMember.status == status_filter)
        if search:
            conditions.append(
                (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
            )

        count_query = (
            select(func.count(InstitutionMember.id))
            .join(User, InstitutionMember.user_id == User.id)
            .where(and_(*conditions))
        )
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        query = (
            select(InstitutionMember, User)
            .join(User, InstitutionMember.user_id == User.id)
            .where(and_(*conditions))
        )

        if sort.lower() == "asc":
            query = query.order_by(InstitutionMember.created_at.asc())
        else:
            query = query.order_by(InstitutionMember.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        items = list(result.all())
        return items, total

    async def update_member(
        self, member: InstitutionMember, update_dict: dict
    ) -> InstitutionMember:
        for key, value in update_dict.items():
            if value is not None:
                setattr(member, key, value)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def delete_member(self, member_id: UUID, institution_id: UUID) -> bool:
        member = await self.get_member_by_id(member_id, institution_id)
        if not member:
            return False
        member.status = MemberStatus.REMOVED
        await self.db.flush()
        return True

    # Invitation Repository Methods
    async def create_invite(
        self,
        institution_id: UUID,
        email: str,
        invited_by: UUID,
        invite_token: str,
        expires_at: datetime,
    ) -> InstitutionInvite:
        invite = InstitutionInvite(
            institution_id=institution_id,
            email=email.lower().strip(),
            invited_by=invited_by,
            invite_token=invite_token,
            expires_at=expires_at,
            status=InviteStatus.PENDING,
        )
        self.db.add(invite)
        await self.db.flush()
        await self.db.refresh(invite)
        return invite

    async def get_invite_by_token(self, invite_token: str) -> Optional[InstitutionInvite]:
        result = await self.db.execute(
            select(InstitutionInvite).where(InstitutionInvite.invite_token == invite_token)
        )
        return result.scalars().first()

    async def get_invite_by_id(
        self, invite_id: UUID, institution_id: UUID
    ) -> Optional[InstitutionInvite]:
        result = await self.db.execute(
            select(InstitutionInvite).where(
                and_(
                    InstitutionInvite.id == invite_id,
                    InstitutionInvite.institution_id == institution_id,
                )
            )
        )
        return result.scalars().first()

    async def get_pending_invite_by_email(
        self, institution_id: UUID, email: str
    ) -> Optional[InstitutionInvite]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(InstitutionInvite).where(
                and_(
                    InstitutionInvite.institution_id == institution_id,
                    InstitutionInvite.email == email.lower().strip(),
                    InstitutionInvite.status == InviteStatus.PENDING,
                    InstitutionInvite.expires_at > now,
                )
            )
        )
        return result.scalars().first()

    async def list_invites_by_inst(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None,
    ) -> Tuple[List[InstitutionInvite], int]:
        conditions = [InstitutionInvite.institution_id == institution_id]
        if status_filter:
            conditions.append(InstitutionInvite.status == status_filter)

        count_query = select(func.count(InstitutionInvite.id)).where(and_(*conditions))
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        query = (
            select(InstitutionInvite)
            .where(and_(*conditions))
            .order_by(InstitutionInvite.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update_invite(
        self, invite: InstitutionInvite, update_dict: dict
    ) -> InstitutionInvite:
        for key, value in update_dict.items():
            if value is not None:
                setattr(invite, key, value)
        await self.db.flush()
        await self.db.refresh(invite)
        return invite

    async def delete_invite(self, invite_id: UUID, institution_id: UUID) -> bool:
        invite = await self.get_invite_by_id(invite_id, institution_id)
        if not invite:
            return False
        await self.db.delete(invite)
        await self.db.flush()
        return True

    async def get_member_statistics(self, institution_id: UUID) -> dict:
        result = await self.db.execute(
            select(InstitutionMember).where(InstitutionMember.institution_id == institution_id)
        )
        members = list(result.scalars().all())

        inv_res = await self.db.execute(
            select(func.count(InstitutionInvite.id)).where(
                and_(
                    InstitutionInvite.institution_id == institution_id,
                    InstitutionInvite.status == InviteStatus.PENDING,
                )
            )
        )
        invited_count = inv_res.scalar_one()

        total = len(members)
        active = sum(1 for m in members if m.status == MemberStatus.ACTIVE)
        suspended = sum(1 for m in members if m.status == MemberStatus.SUSPENDED)
        removed = sum(1 for m in members if m.status == MemberStatus.REMOVED)

        return {
            "total_members": total,
            "active_members": active,
            "invited_members": invited_count,
            "suspended_members": suspended,
            "removed_members": removed,
        }
