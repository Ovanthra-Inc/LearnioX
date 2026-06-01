from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID


class PermissionResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    module: str


class RoleResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    name: str
    code: str
    description: str | None
    is_system_role: bool
    permissions: list[PermissionResponse] = []


class InstitutionMemberResponse(BaseModel):
    id: UUID
    institution_id: UUID
    user_id: UUID
    role_id: UUID
    status: str
    is_owner: bool
    created_at: datetime


class InviteResponse(BaseModel):
    id: UUID
    institution_id: UUID
    email: EmailStr
    role_id: UUID
    status: str
    expires_at: datetime


class PermissionCheckResponse(BaseModel):
    allowed: bool
    user_id: UUID
    institution_id: UUID
    permission: str


class BulkPermissionCheckResponse(BaseModel):
    user_id: UUID
    institution_id: UUID
    results: dict[str, bool]
