from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InviteMemberRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address of the invitee")
    role_id: Optional[UUID] = Field(None, description="Optional role UUID")
    message: Optional[str] = Field(None, max_length=500, description="Optional invitation message")


class InviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    invite_id: UUID = Field(..., alias="id")
    email: EmailStr
    status: str
    invite_token: str
    expires_at: datetime


class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    email: str
    picture: Optional[str] = None
    status: str
    joined_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None


class MemberListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[MemberResponse]


class UpdateMemberRequest(BaseModel):
    role_id: Optional[UUID] = None
    status: Optional[str] = None


class InvitationDetailResponse(BaseModel):
    institution_id: UUID
    institution_name: str
    invited_email: str
    invited_by: str
    expires_at: datetime
    status: str


class MemberActivityResponse(BaseModel):
    member_id: UUID
    last_login: Optional[datetime] = None
    last_action: str = "Joined Institution"
    total_actions: int = 1


class MemberStatisticsResponse(BaseModel):
    total_members: int = 0
    active_members: int = 0
    invited_members: int = 0
    suspended_members: int = 0
    removed_members: int = 0
