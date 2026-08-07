from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_role_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.role import AssignRoleRequest, PermissionResponse, RoleResponse
from app.services.role_service import RoleService

router = APIRouter(tags=["Permissions & Member Roles"])


@router.get(
    "/permissions",
    summary="List All Available Platform Permissions",
    response_model=APIResponse[List[PermissionResponse]],
)
async def list_permissions(
    service: RoleService = Depends(get_role_service),
):
    result = await service.list_permissions()
    return APIResponse.ok(data=result, message="Permission catalog retrieved successfully")


@router.get(
    "/permissions/categories",
    summary="List Permission Categories",
    response_model=APIResponse[List[str]],
)
async def list_permission_categories(
    service: RoleService = Depends(get_role_service),
):
    result = await service.list_permission_categories()
    return APIResponse.ok(data=result, message="Permission categories retrieved successfully")


@router.post(
    "/members/{member_id}/roles",
    summary="Assign Role to Member",
    response_model=APIResponse[None],
)
async def assign_role_to_member(
    member_id: UUID,
    body: AssignRoleRequest,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    await service.assign_role_to_member(
        member_id=member_id, role_id=body.role_id, user_id=current_user.id
    )
    return APIResponse.ok(message="Role assigned to member successfully")


@router.delete(
    "/members/{member_id}/roles/{role_id}",
    summary="Remove Role from Member",
    response_model=APIResponse[None],
)
async def remove_role_from_member(
    member_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    await service.remove_role_from_member(
        member_id=member_id, role_id=role_id, user_id=current_user.id
    )
    return APIResponse.ok(message="Role removed from member successfully")


@router.get(
    "/members/{member_id}/roles",
    summary="List Assigned Roles of Member",
    response_model=APIResponse[List[RoleResponse]],
)
async def get_member_roles(
    member_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.get_member_roles(member_id=member_id)
    return APIResponse.ok(data=result, message="Member roles retrieved successfully")


@router.get(
    "/members/{member_id}/permissions",
    summary="Get Effective Merged Permissions of Member",
    response_model=APIResponse[List[str]],
)
async def get_member_effective_permissions(
    member_id: UUID,
    institution_id: UUID = Query(..., description="Institution context UUID"),
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.get_member_effective_permissions(
        member_id=member_id, user_id=current_user.id, institution_id=institution_id
    )
    return APIResponse.ok(data=result, message="Member effective permissions compiled")
