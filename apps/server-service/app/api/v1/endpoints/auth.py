from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_active_user, get_auth_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthUrlResponse,
    LogoutRequest,
    RefreshResponse,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.session import SessionResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

# FIX #18: Rate limiter instance (shares key_func with main app)
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/google",
    summary="Get Google OAuth Authorization URL or Redirect",
    response_model=APIResponse[GoogleAuthUrlResponse],
)
async def get_google_auth(
    redirect: bool = Query(False, description="If True, performs HTTP 302 redirect to Google"),
    state: Optional[str] = Query(None, description="Optional CSRF state parameter"),
    service: AuthService = Depends(get_auth_service),
):
    auth_url = service.generate_google_login_url(state=state)
    if redirect:
        return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
    return APIResponse.ok(
        data=GoogleAuthUrlResponse(url=auth_url),
        message="Google authorization URL generated successfully",
    )


@router.get(
    "/google/callback",
    summary="Google OAuth Callback Endpoint",
    response_model=APIResponse[TokenResponse],
)
@limiter.limit("10/minute")  # FIX #18: Strict limit on OAuth callbacks to prevent abuse
async def google_callback(
    request: Request,
    code: str = Query(..., description="Authorization code returned by Google"),
    state: Optional[str] = Query(None, description="CSRF state parameter"),
    service: AuthService = Depends(get_auth_service),
):
    # HIGH-04: Validate signed state in production mode to prevent OAuth CSRF
    from app.core.config import settings
    from app.core.exceptions import ForbiddenException
    from app.utils.oauth import verify_signed_state
    if settings.is_production and (not state or not verify_signed_state(state)):
        raise ForbiddenException(
            message="Invalid or expired OAuth state parameter — CSRF protection triggered",
            error_code="INVALID_OAUTH_STATE",
        )
    device_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.authenticate_with_google_code(
        code=code,
        device_ip=device_ip,
        user_agent=user_agent,
    )
    return APIResponse.ok(data=tokens, message="Successfully authenticated with Google")


@router.post(
    "/refresh",
    summary="Refresh Access Token using Refresh Token (Token Rotation)",
    response_model=APIResponse[RefreshResponse],
)
@limiter.limit("20/minute")  # FIX #18: Limit token refresh to block token farming attacks
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
):
    device_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    new_tokens = await service.refresh_access_token(
        raw_refresh_token=body.refresh_token,
        device_ip=device_ip,
        user_agent=user_agent,
    )
    return APIResponse.ok(data=new_tokens, message="Access token refreshed successfully")


@router.post(
    "/logout",
    summary="Logout Current Device Session",
    response_model=APIResponse[None],
)
@limiter.limit("30/minute")  # FIX #18: Prevent logout-flood attacks
async def logout(
    request: Request,
    body: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(body.refresh_token)
    return APIResponse.ok(message="Logged out successfully")


@router.post(
    "/logout-all",
    summary="Revoke All Sessions for Current User",
    response_model=APIResponse[None],
)
async def logout_all(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout_all(current_user.id)
    return APIResponse.ok(message="All active sessions terminated successfully")


@router.get(
    "/me",
    summary="Get Current Authenticated User Profile",
    response_model=APIResponse[UserResponse],
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    return APIResponse.ok(
        data=UserResponse.model_validate(current_user),
        message="User profile retrieved successfully",
    )


@router.get(
    "/sessions",
    summary="List Active Device Sessions for User",
    response_model=APIResponse[List[SessionResponse]],
)
async def get_sessions(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    sessions = await service.get_user_sessions(current_user.id)
    return APIResponse.ok(data=sessions, message="Active sessions retrieved successfully")


@router.delete(
    "/sessions/{id}",
    summary="Revoke Specific Device Session by ID",
    response_model=APIResponse[None],
)
async def delete_session(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.delete_user_session(session_id=id, user_id=current_user.id)
    return APIResponse.ok(message="Session removed successfully")
