from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CreateRoleRequest(BaseModel):
    name: str = Field(..., max_length=100, description="Role display name")
    description: Optional[str] = Field(None, description="Optional role description")
    permission_ids: List[UUID] = Field(default_factory=list, description="List of permission UUIDs")


class UpdateRoleRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    code: str
    category: str
    description: Optional[str] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    total_permissions: int = 0
    created_at: datetime


class RoleDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionResponse] = Field(default_factory=list)
    member_count: int = 0
    created_at: datetime


class RoleListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[RoleResponse]


class UpdateRolePermissionsRequest(BaseModel):
    permission_ids: List[UUID] = Field(..., description="List of permission UUIDs to assign to role")


class AssignRoleRequest(BaseModel):
    role_id: UUID = Field(..., description="Role UUID to assign to member")


class RoleStatisticsResponse(BaseModel):
    total_roles: int = 0
    total_permissions: int = 0
    assigned_roles: int = 0
    unassigned_roles: int = 0
