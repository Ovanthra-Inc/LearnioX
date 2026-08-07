from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_active_user, get_role_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.role import (
    CreateRoleRequest,
    PermissionResponse,
    RoleDetailResponse,
    RoleListResponse,
    RoleResponse,
    RoleStatisticsResponse,
    UpdateRolePermissionsRequest,
    UpdateRoleRequest,
)
from app.services.role_service import RoleService

router = APIRouter(tags=["Roles & Access Control"])


@router.post(
    "/institutions/{institution_id}/roles",
    summary="Create Custom Role",
    response_model=APIResponse[RoleResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    institution_id: UUID,
    body: CreateRoleRequest,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.create_role(
        institution_id=institution_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Role created successfully")


@router.get(
    "/institutions/{institution_id}/roles",
    summary="List Institution Roles",
    response_model=APIResponse[RoleListResponse],
)
async def list_roles(
    institution_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.list_roles(
        institution_id=institution_id, page=page, limit=limit, search=search, sort=sort
    )
    return APIResponse.ok(data=result, message="Roles listed successfully")


@router.get(
    "/institutions/{institution_id}/roles/search",
    summary="Search Institution Roles",
    response_model=APIResponse[RoleListResponse],
)
async def search_roles(
    institution_id: UUID,
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.list_roles(
        institution_id=institution_id, page=page, limit=limit, search=keyword
    )
    return APIResponse.ok(data=result, message="Role search results")


@router.get(
    "/institutions/{institution_id}/roles/statistics",
    summary="Get Institution Role Statistics",
    response_model=APIResponse[RoleStatisticsResponse],
)
async def get_role_statistics(
    institution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.get_role_statistics(institution_id=institution_id)
    return APIResponse.ok(data=result, message="Role statistics retrieved")


@router.post(
    "/institutions/{institution_id}/roles/reset",
    summary="Restore Default System Roles",
    response_model=APIResponse[List[RoleResponse]],
)
async def reset_roles(
    institution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.reset_roles(institution_id=institution_id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="Default system roles restored successfully")


@router.get(
    "/institutions/{institution_id}/roles/{role_id}",
    summary="Get Role Details & Assigned Permissions",
    response_model=APIResponse[RoleDetailResponse],
)
async def get_role_details(
    institution_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.get_role_details(role_id=role_id, institution_id=institution_id)
    return APIResponse.ok(data=result, message="Role details retrieved")


@router.patch(
    "/institutions/{institution_id}/roles/{role_id}",
    summary="Update Role Details",
    response_model=APIResponse[RoleResponse],
)
async def update_role(
    institution_id: UUID,
    role_id: UUID,
    body: UpdateRoleRequest,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.update_role(
        role_id=role_id, institution_id=institution_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Role updated successfully")


@router.delete(
    "/institutions/{institution_id}/roles/{role_id}",
    summary="Delete Custom Role",
    response_model=APIResponse[None],
)
async def delete_role(
    institution_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    await service.delete_role(
        role_id=role_id, institution_id=institution_id, user_id=current_user.id
    )
    return APIResponse.ok(message="Role deleted successfully")


@router.post(
    "/institutions/{institution_id}/roles/{role_id}/clone",
    summary="Clone Role",
    response_model=APIResponse[RoleResponse],
)
async def clone_role(
    institution_id: UUID,
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.clone_role(
        role_id=role_id, institution_id=institution_id, user_id=current_user.id
    )
    return APIResponse.ok(data=result, message="Role cloned successfully")


@router.get(
    "/institutions/{institution_id}/roles/{role_id}/permissions",
    summary="Get Permissions of Role",
    response_model=APIResponse[List[PermissionResponse]],
)
async def get_role_permissions(
    institution_id: UUID,  # FIX #16: scoped under institution to prevent cross-institution leakage
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    role_detail = await service.get_role_details(role_id=role_id, institution_id=institution_id)
    return APIResponse.ok(data=role_detail.permissions, message="Role permissions retrieved")


@router.patch(
    "/roles/{role_id}/permissions",
    summary="Replace Role Permissions",
    response_model=APIResponse[RoleDetailResponse],
)
async def replace_role_permissions(
    role_id: UUID,
    body: UpdateRolePermissionsRequest,
    current_user: User = Depends(get_current_active_user),
    service: RoleService = Depends(get_role_service),
):
    result = await service.replace_role_permissions(
        role_id=role_id, user_id=current_user.id, payload=body
    )
    return APIResponse.ok(data=result, message="Role permissions updated successfully")
