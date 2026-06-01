from pydantic import BaseModel, EmailStr
from uuid import UUID


class CreateRoleRequest(BaseModel):
    name: str
    code: str
    description: str | None = None
    permission_codes: list[str] = []


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_codes: list[str] | None = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role_id: UUID


class UpdateMemberRoleRequest(BaseModel):
    role_id: UUID


class PermissionCheckRequest(BaseModel):
    user_id: UUID
    institution_id: UUID
    permission: str


class BulkPermissionCheckRequest(BaseModel):
    user_id: UUID
    institution_id: UUID
    permissions: list[str]
