from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user, get_member_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.member import InvitationDetailResponse, InviteResponse
from app.services.member_service import MemberService

router = APIRouter(prefix="/invites", tags=["Invitations"])


@router.get(
    "/{invite_token}",
    summary="View Invitation Details by Token",
    response_model=APIResponse[InvitationDetailResponse],
)
async def get_invite_details(
    invite_token: str,
    service: MemberService = Depends(get_member_service),
):
    result = await service.get_invitation_details(invite_token=invite_token)
    return APIResponse.ok(data=result, message="Invitation details retrieved")


@router.post(
    "/{invite_token}/accept",
    summary="Accept Team Invitation",
    response_model=APIResponse[None],
)
async def accept_invitation(
    invite_token: str,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    await service.accept_invitation(invite_token=invite_token, user_id=current_user.id)
    return APIResponse.ok(message="Invitation accepted successfully")


@router.post(
    "/{invite_token}/reject",
    summary="Reject Team Invitation",
    response_model=APIResponse[None],
)
async def reject_invitation(
    invite_token: str,
    service: MemberService = Depends(get_member_service),
):
    await service.reject_invitation(invite_token=invite_token)
    return APIResponse.ok(message="Invitation rejected successfully")


@router.post(
    "/{invite_token}/cancel",
    summary="Cancel Pending Invitation (Owner Action)",
    response_model=APIResponse[None],
)
async def cancel_invitation(
    invite_token: str,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    await service.cancel_invitation(invite_token=invite_token, user_id=current_user.id)
    return APIResponse.ok(message="Invitation cancelled successfully")


@router.post(
    "/{invite_token}/resend",
    summary="Resend Invitation (Owner Action)",
    response_model=APIResponse[InviteResponse],
)
async def resend_invitation(
    invite_token: str,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.resend_invitation(invite_token=invite_token, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Invitation resent successfully")
