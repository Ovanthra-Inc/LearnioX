from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID


class AuthUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: str | None = None
    status: str
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(BaseModel):
    user: AuthUserResponse
    tokens: TokenPairResponse


class SessionResponse(BaseModel):
    id: UUID
    user_agent: str | None
    ip_address: str | None
    is_active: bool
    created_at: datetime
    expires_at: datetime


class TokenIntrospectResponse(BaseModel):
    active: bool
    user_id: UUID | None = None
    email: str | None = None
    expires_at: datetime | None = None
