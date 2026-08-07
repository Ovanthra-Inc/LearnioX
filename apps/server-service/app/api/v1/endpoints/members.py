from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_member_service
from app.core.response import APIResponse
from app.models.user import User
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
from app.services.member_service import MemberService

router = APIRouter(prefix="/institutions/{institution_id}", tags=["Institution Team Members"])


@router.post(
    "/members/invite",
    summary="Invite New Team Member",
    response_model=APIResponse[InviteResponse],
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    institution_id: UUID,
    body: InviteMemberRequest,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.invite_member(
        institution_id=institution_id, inviter_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Invitation created successfully")


@router.get(
    "/members",
    summary="List Institution Members",
    response_model=APIResponse[MemberListResponse],
)
async def list_members(
    institution_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.list_members(
        institution_id=institution_id,
        page=page,
        limit=limit,
        status_filter=status,
        search=search,
        sort=sort,
    )
    return APIResponse.ok(data=result, message="Institution members listed successfully")


@router.get(
    "/members/me",
    summary="Current Logged-in Member Profile in Institution",
    response_model=APIResponse[MemberResponse],
)
async def get_my_member_info(
    institution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.get_my_member_info(institution_id=institution_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Member profile retrieved successfully")


@router.get(
    "/members/search",
    summary="Search Institution Members",
    response_model=APIResponse[MemberListResponse],
)
async def search_members(
    institution_id: UUID,
    keyword: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.list_members(
        institution_id=institution_id,
        page=page,
        limit=limit,
        status_filter=status,
        search=keyword,
    )
    return APIResponse.ok(data=result, message="Member search results")


@router.get(
    "/members/statistics",
    summary="Get Institution Member Statistics",
    response_model=APIResponse[MemberStatisticsResponse],
)
async def get_member_statistics(
    institution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.get_member_statistics(institution_id=institution_id)
    return APIResponse.ok(data=result, message="Member statistics retrieved")


@router.get(
    "/members/activity",
    summary="Get Institution-wide Member Activity Logs",
    response_model=APIResponse[List[MemberActivityResponse]],
)
async def get_institution_activity(
    institution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    # FIX #14: stub was silently returning [] with HTTP 200, misleading clients
    from fastapi import HTTPException, status as http_status
    raise HTTPException(
        status_code=http_status.HTTP_501_NOT_IMPLEMENTED,
        detail="Institution-wide activity log is not yet implemented",
    )


@router.get(
    "/members/{member_id}",
    summary="Get Single Member Details",
    response_model=APIResponse[MemberResponse],
)
async def get_member_details(
    institution_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.get_member(member_id=member_id, institution_id=institution_id)
    return APIResponse.ok(data=result, message="Member details retrieved")


@router.patch(
    "/members/{member_id}",
    summary="Update Member Role or Status",
    response_model=APIResponse[MemberResponse],
)
async def update_member(
    institution_id: UUID,
    member_id: UUID,
    body: UpdateMemberRequest,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.update_member(
        member_id=member_id, institution_id=institution_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Member updated successfully")


@router.delete(
    "/members/{member_id}",
    summary="Remove Member from Institution",
    response_model=APIResponse[None],
)
async def remove_member(
    institution_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    await service.remove_member(
        member_id=member_id, institution_id=institution_id, user_id=current_user.id
    )
    return APIResponse.ok(message="Member removed successfully")


@router.patch(
    "/members/{member_id}/suspend",
    summary="Suspend Member",
    response_model=APIResponse[MemberResponse],
)
async def suspend_member(
    institution_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.suspend_member(
        member_id=member_id, institution_id=institution_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Member suspended successfully")


@router.patch(
    "/members/{member_id}/activate",
    summary="Activate Member",
    response_model=APIResponse[MemberResponse],
)
async def activate_member(
    institution_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.activate_member(
        member_id=member_id, institution_id=institution_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Member activated successfully")


@router.get(
    "/members/{member_id}/activity",
    summary="Get Specific Member Activity Log",
    response_model=APIResponse[MemberActivityResponse],
)
async def get_member_activity(
    institution_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    result = await service.get_member_activity(member_id=member_id, institution_id=institution_id)
    return APIResponse.ok(data=result, message="Member activity log retrieved")


@router.get(
    "/invites",
    summary="List Pending Invitations for Institution",
    response_model=APIResponse[List[InviteResponse]],
)
async def list_institution_invites(
    institution_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query("PENDING"),
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    # FIX #11: call service method instead of service.repo directly
    items, total = await service.list_invites(
        institution_id=institution_id, page=page, limit=limit, status_filter=status
    )
    return APIResponse.ok(data=items, message="Pending invites listed successfully")


@router.delete(
    "/invites/{invite_id}",
    summary="Delete Pending Invitation",
    response_model=APIResponse[None],
)
async def delete_institution_invite(
    institution_id: UUID,
    invite_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: MemberService = Depends(get_member_service),
):
    # FIX #12: raise NotFoundException if invite not found instead of silently returning 200
    success = await service.repo.delete_invite(invite_id=invite_id, institution_id=institution_id)
    if not success:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(
            message="Invitation not found or already deleted",
            error_code="INVITE_NOT_FOUND",
        )
    return APIResponse.ok(message="Invitation deleted successfully")
