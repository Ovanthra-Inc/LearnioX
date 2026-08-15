from typing import Optional
from pydantic import BaseModel, Field
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


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Active refresh token string")


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class LogoutRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token string to revoke")
