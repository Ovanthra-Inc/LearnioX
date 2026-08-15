from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.schemas.user import UserResponse


class GoogleAuthUrlResponse(BaseModel):
    url: str


class OAuthCallbackRequest(BaseModel):
    code: str = Field(..., description="Authorization code returned by OAuth provider")
    state: Optional[str] = Field(None, description="CSRF state parameter")
    code_verifier: Optional[str] = Field(None, description="Optional PKCE code verifier")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full display name")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password with minimum 8 characters")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., description="Email verification token from email")


class ResendVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address to resend verification")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address to receive password reset link")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., description="Password reset token from email link")
    new_password: str = Field(..., min_length=8, max_length=128, description="New secure password")


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Active refresh token string (optional if provided via HttpOnly cookie)")


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Refresh token string to revoke (optional if provided via HttpOnly cookie)")


class AuthAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    event_type: str
    method: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
