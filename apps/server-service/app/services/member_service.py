import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.models.member import InstitutionInvite, InstitutionMember, InviteStatus, MemberStatus
from app.repositories.institution_repository import InstitutionRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.member import (
    InvitationDetailResponse,
    InviteMemberRequest,
    InviteResponse,
    MemberActivityResponse,
    MemberListResponse,
    MemberResponse,
    MemberStatisticsResponse,
    UpdateMemberRequest,
)


def make_aware(dt: datetime) -> datetime:
    if dt and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class MemberService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = MemberRepository(db)
        self.inst_repo = InstitutionRepository(db)
        self.user_repo = UserRepository(db)

    def generate_invite_token(self) -> str:
        return secrets.token_urlsafe(32)

    async def _to_member_response(
        self, member: InstitutionMember, user: Optional[object] = None
    ) -> MemberResponse:
        if not user:
            user = await self.user_repo.get_by_id(member.user_id)

        name = user.name if user else "Unknown User"
        email = user.email if user else ""
        picture = user.picture if user else None

        return MemberResponse(
            id=member.id,
            user_id=member.user_id,
            name=name,
            email=email,
            picture=picture,
            status=member.status.value if hasattr(member.status, "value") else str(member.status),
            joined_at=member.joined_at,
            last_active_at=member.last_active_at,
        )

    async def invite_member(
        self, institution_id: UUID, inviter_id: UUID, payload: InviteMemberRequest
    ) -> InviteResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id != inviter_id:
            # HIGH-05: Allow active members with member.invite permission, not just owner
            member = await self.repo.get_member_by_user_and_inst(inviter_id, institution_id)
            if not member or member.status != MemberStatus.ACTIVE:
                raise ForbiddenException(
                    message="Active institution membership required", error_code="FORBIDDEN"
                )
            role_repo = RoleRepository(self.db)
            effective = await role_repo.get_member_effective_permissions(
                member.id, inviter_id, institution_id
            )
            if "member.invite" not in effective:
                raise ForbiddenException(
                    message="Permission denied: missing required permission 'member.invite'",
                    error_code="PERMISSION_DENIED",
                )

        email = payload.email.lower().strip()

        # Check if inviting owner
        owner_user = await self.user_repo.get_by_id(inst.owner_id)
        if owner_user and owner_user.email.lower() == email:
            raise ValidationException(
                message="Cannot invite institution owner as a team member", error_code="CANNOT_INVITE_OWNER"
            )

        # Check existing member
        user_to_invite = await self.user_repo.get_by_email(email)
        if user_to_invite:
            existing_member = await self.repo.get_member_by_user_and_inst(
                user_id=user_to_invite.id, institution_id=institution_id
            )
            if existing_member and existing_member.status == MemberStatus.ACTIVE:
                raise ConflictException(
                    message="User is already an active member of this institution",
                    error_code="ALREADY_ACTIVE_MEMBER",
                )

        # Check pending invitation
        pending_invite = await self.repo.get_pending_invite_by_email(institution_id, email)
        if pending_invite:
            raise ConflictException(
                message="Pending invitation already exists for this email",
                error_code="PENDING_INVITE_EXISTS",
            )

        token = self.generate_invite_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invite = await self.repo.create_invite(
            institution_id=institution_id,
            email=email,
            invited_by=inviter_id,
            invite_token=token,
            expires_at=expires_at,
        )

        return InviteResponse(
            id=invite.id,
            email=invite.email,
            status=invite.status.value if hasattr(invite.status, "value") else str(invite.status),
            invite_token=invite.invite_token,
            expires_at=invite.expires_at,
        )

    async def get_invitation_details(self, invite_token: str) -> InvitationDetailResponse:
        invite = await self.repo.get_invite_by_token(invite_token)
        if not invite:
            raise NotFoundException(message="Invitation not found", error_code="INVITATION_NOT_FOUND")

        now = datetime.now(timezone.utc)
        if invite.status == InviteStatus.PENDING and make_aware(invite.expires_at) < now:
            await self.repo.update_invite(invite, {"status": InviteStatus.EXPIRED})
            invite.status = InviteStatus.EXPIRED

        inst = await self.inst_repo.get_by_id(invite.institution_id)
        inst_name = inst.name if inst else "Unknown Academy"

        inviter = await self.user_repo.get_by_id(invite.invited_by)
        inviter_name = inviter.name if inviter else "Institution Admin"

        return InvitationDetailResponse(
            institution_id=invite.institution_id,
            institution_name=inst_name,
            invited_email=invite.email,
            invited_by=inviter_name,
            expires_at=invite.expires_at,
            status=invite.status.value if hasattr(invite.status, "value") else str(invite.status),
        )

    async def accept_invitation(self, invite_token: str, user_id: UUID) -> None:
        invite = await self.repo.get_invite_by_token(invite_token)
        if not invite:
            raise NotFoundException(message="Invitation not found", error_code="INVITATION_NOT_FOUND")

        now = datetime.now(timezone.utc)
        if invite.status != InviteStatus.PENDING or make_aware(invite.expires_at) < now:
            if make_aware(invite.expires_at) < now:
                await self.repo.update_invite(invite, {"status": InviteStatus.EXPIRED})
            raise ValidationException(
                message="Invitation is invalid, expired, or already used",
                error_code="INVALID_INVITATION",
            )

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException(message="Authentication required", error_code="UNAUTHORIZED")

        # Mark invite accepted
        await self.repo.update_invite(invite, {"status": InviteStatus.ACCEPTED})

        # Provision / Activate Member record
        existing = await self.repo.get_member_by_user_and_inst(
            user_id=user.id, institution_id=invite.institution_id
        )
        if existing:
            await self.repo.update_member(
                existing,
                {
                    "status": MemberStatus.ACTIVE,
                    "joined_at": now,
                    "last_active_at": now,
                },
            )
        else:
            await self.repo.create_member(
                institution_id=invite.institution_id,
                user_id=user.id,
                status=MemberStatus.ACTIVE,
            )

    async def reject_invitation(self, invite_token: str) -> None:
        invite = await self.repo.get_invite_by_token(invite_token)
        if not invite or invite.status != InviteStatus.PENDING:
            raise NotFoundException(message="Pending invitation not found", error_code="INVITATION_NOT_FOUND")

        await self.repo.update_invite(invite, {"status": InviteStatus.REJECTED})

    async def cancel_invitation(self, invite_token: str, user_id: UUID) -> None:
        invite = await self.repo.get_invite_by_token(invite_token)
        if not invite:
            raise NotFoundException(message="Invitation not found", error_code="INVITATION_NOT_FOUND")

        inst = await self.inst_repo.get_by_id(invite.institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        await self.repo.update_invite(invite, {"status": InviteStatus.CANCELLED})

    async def resend_invitation(self, invite_token: str, user_id: UUID) -> InviteResponse:
        invite = await self.repo.get_invite_by_token(invite_token)
        if not invite:
            raise NotFoundException(message="Invitation not found", error_code="INVITATION_NOT_FOUND")

        inst = await self.inst_repo.get_by_id(invite.institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        new_token = self.generate_invite_token()
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        updated = await self.repo.update_invite(
            invite,
            {
                "invite_token": new_token,
                "expires_at": new_expires_at,
                "status": InviteStatus.PENDING,
            },
        )
        return InviteResponse(
            id=updated.id,
            email=updated.email,
            status=updated.status.value if hasattr(updated.status, "value") else str(updated.status),
            invite_token=updated.invite_token,
            expires_at=updated.expires_at,
        )

    # Member Management
    async def list_members(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> MemberListResponse:
        items, total = await self.repo.list_members(
            institution_id=institution_id,
            page=page,
            limit=limit,
            status_filter=status_filter,
            search=search,
            sort=sort,
        )

        responses = []
        for m, u in items:
            responses.append(await self._to_member_response(m, user=u))

        return MemberListResponse(total=total, page=page, limit=limit, items=responses)

    async def get_member(self, member_id: UUID, institution_id: UUID) -> MemberResponse:
        member = await self.repo.get_member_by_id(member_id, institution_id)
        if not member:
            raise NotFoundException(message="Team member not found", error_code="MEMBER_NOT_FOUND")
        return await self._to_member_response(member)

    async def update_member(
        self, member_id: UUID, institution_id: UUID, user_id: UUID, payload: UpdateMemberRequest
    ) -> MemberResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        member = await self.repo.get_member_by_id(member_id, institution_id)
        if not member:
            raise NotFoundException(message="Team member not found", error_code="MEMBER_NOT_FOUND")

        update_dict = payload.model_dump(exclude_unset=True)
        updated = await self.repo.update_member(member, update_dict)
        return await self._to_member_response(updated)

    async def suspend_member(self, member_id: UUID, institution_id: UUID, user_id: UUID) -> MemberResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        member = await self.repo.get_member_by_id(member_id, institution_id)
        if not member:
            raise NotFoundException(message="Team member not found", error_code="MEMBER_NOT_FOUND")

        updated = await self.repo.update_member(member, {"status": MemberStatus.SUSPENDED})
        return await self._to_member_response(updated)

    async def activate_member(self, member_id: UUID, institution_id: UUID, user_id: UUID) -> MemberResponse:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        member = await self.repo.get_member_by_id(member_id, institution_id)
        if not member:
            raise NotFoundException(message="Team member not found", error_code="MEMBER_NOT_FOUND")

        updated = await self.repo.update_member(member, {"status": MemberStatus.ACTIVE})
        return await self._to_member_response(updated)

    async def remove_member(self, member_id: UUID, institution_id: UUID, user_id: UUID) -> None:
        inst = await self.inst_repo.get_by_id(institution_id)
        if not inst or inst.owner_id != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        success = await self.repo.delete_member(member_id, institution_id)
        if not success:
            raise NotFoundException(message="Team member not found", error_code="MEMBER_NOT_FOUND")

    async def get_my_member_info(self, institution_id: UUID, user_id: UUID) -> MemberResponse:
        member = await self.repo.get_member_by_user_and_inst(user_id, institution_id)
        if not member:
            raise NotFoundException(
                message="You are not a registered member of this institution",
                error_code="MEMBER_NOT_FOUND",
            )
        return await self._to_member_response(member)

    async def get_member_statistics(self, institution_id: UUID) -> MemberStatisticsResponse:
        stats = await self.repo.get_member_statistics(institution_id)
        return MemberStatisticsResponse(**stats)

    async def get_member_activity(self, member_id: UUID, institution_id: UUID) -> MemberActivityResponse:
        member = await self.repo.get_member_by_id(member_id, institution_id)
        if not member:
            raise NotFoundException(message="Member not found", error_code="MEMBER_NOT_FOUND")

        return MemberActivityResponse(
            member_id=member.id,
            last_login=member.last_active_at,
            last_action="Active in Workspace",
            total_actions=5,
        )

    # FIX #11: service-layer wrapper so routers never call service.repo directly
    async def list_invites(
        self,
        institution_id: UUID,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = "PENDING",
    ) -> tuple:
        items, total = await self.repo.list_invites_by_inst(
            institution_id=institution_id,
            page=page,
            limit=limit,
            status_filter=status_filter,
        )
        responses = [
            InviteResponse(
                id=i.id,
                email=i.email,
                status=i.status.value if hasattr(i.status, "value") else str(i.status),
                invite_token=i.invite_token,
                expires_at=i.expires_at,
            )
            for i in items
        ]
        return responses, total
