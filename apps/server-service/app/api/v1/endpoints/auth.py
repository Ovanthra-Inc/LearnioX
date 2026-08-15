from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import get_current_active_user, get_auth_service
from app.core.response import APIResponse
from app.core.security import set_auth_cookies, clear_auth_cookies
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthUrlResponse,
    LoginRequest,
    LogoutRequest,
    OAuthCallbackRequest,
    RefreshResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.session import SessionResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.utils.oauth import verify_signed_state

router = APIRouter(prefix="/auth", tags=["Authentication"])

limiter = Limiter(key_func=get_remote_address)


# ─── 1. Email & Password Signup & Login Endpoints ──────────────────────────────

@router.post(
    "/signup",
    summary="Register New Account with Email and Password",
    response_model=APIResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def signup_email(
    request: Request,
    response: Response,
    body: SignupRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Registers a new user account with email + password and triggers rich email verification.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.register_email_user(
        payload=body,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_token_expires_in=tokens.expires_in,
    )
    return APIResponse.ok(
        data=tokens,
        message="Account created successfully. A verification link has been sent to your email.",
    )


@router.post(
    "/login",
    summary="Authenticate Account with Email and Password",
    response_model=APIResponse[TokenResponse],
)
@limiter.limit("15/minute")
async def login_email(
    request: Request,
    response: Response,
    body: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Authenticates an existing user account using email and password.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.authenticate_with_password(
        payload=body,
        device_ip=ip_address,
        user_agent=user_agent,
    )
    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_token_expires_in=tokens.expires_in,
    )
    return APIResponse.ok(
        data=tokens,
        message="Signed in successfully",
    )


# ─── 2. Email Verification Endpoints ──────────────────────────────────────────

@router.post(
    "/verify-email",
    summary="Verify Account Email with Verification Token",
    response_model=APIResponse[dict],
)
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    token: str = Query(..., description="Verification token from email link"),
    service: AuthService = Depends(get_auth_service),
):
    """
    Verifies user email address using the URL token.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    await service.verify_email(
        token=token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return APIResponse.ok(
        data={"verified": True},
        message="Email address verified successfully. Your account is fully activated.",
    )


@router.post(
    "/resend-verification",
    summary="Resend Account Email Verification Link",
    response_model=APIResponse[dict],
)
@limiter.limit("5/minute")
async def resend_verification(
    request: Request,
    email: str = Query(..., description="Account email address"),
    service: AuthService = Depends(get_auth_service),
):
    """
    Resends a fresh account verification email.
    """
    await service.resend_verification_email(email=email)
    return APIResponse.ok(
        data={"sent": True},
        message="If an account exists with this email, a verification link has been sent.",
    )


# ─── 3. Password Reset Endpoints ──────────────────────────────────────────────

@router.post(
    "/forgot-password",
    summary="Request Password Reset Link",
    response_model=APIResponse[dict],
)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Generates a secure password reset token and sends instructions to user email.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    await service.request_password_reset(
        email=body.email,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return APIResponse.ok(
        data={"sent": True},
        message="If this email is registered, password reset instructions have been sent.",
    )


@router.post(
    "/reset-password",
    summary="Reset Password with Secure Token",
    response_model=APIResponse[dict],
)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    """
    Resets account password using valid reset token and invalidates active sessions.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    await service.reset_password(
        token=body.token,
        new_password=body.new_password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return APIResponse.ok(
        data={"reset": True},
        message="Password has been updated successfully. Please sign in with your new password.",
    )


# ─── 4. Google OAuth Endpoints ────────────────────────────────────────────────

@router.get(
    "/google",
    summary="Get Google OAuth Authorization URL or Redirect",
    response_model=APIResponse[GoogleAuthUrlResponse],
)
async def get_google_auth(
    redirect: bool = Query(False, description="If True, performs HTTP 302 redirect to Google"),
    state: Optional[str] = Query(None, description="Optional CSRF state parameter"),
    code_challenge: Optional[str] = Query(None, description="Optional PKCE code challenge"),
    code_challenge_method: Optional[str] = Query("S256", description="PKCE code challenge method"),
    service: AuthService = Depends(get_auth_service),
):
    from app.oauth.manager import oauth_manager
    google_provider = oauth_manager.get_provider("google")
    auth_url = google_provider.get_authorization_url(
        state=state,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
    )
    if redirect:
        return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)
    return APIResponse.ok(
        data=GoogleAuthUrlResponse(url=auth_url),
        message="Google authorization URL generated successfully",
    )


@router.get(
    "/google/callback",
    summary="Google OAuth Callback Endpoint (GET Redirect)",
    response_model=APIResponse[TokenResponse],
)
@limiter.limit("10/minute")
async def google_callback_get(
    request: Request,
    response: Response,
    code: str = Query(..., description="Authorization code returned by Google"),
    state: Optional[str] = Query(None, description="CSRF state parameter"),
    code_verifier: Optional[str] = Query(None, description="Optional PKCE code verifier"),
    service: AuthService = Depends(get_auth_service),
):
    from app.core.config import settings
    from app.core.exceptions import ForbiddenException
    if settings.is_production and (not state or not verify_signed_state(state)):
        raise ForbiddenException(
            message="Invalid or expired OAuth state parameter — CSRF protection triggered",
            error_code="INVALID_OAUTH_STATE",
        )
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        state_param = f"&state={state}" if state else ""
        frontend_url = f"/auth/callback/google?code={code}{state_param}"
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)

    device_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.authenticate_with_google_code(
        code=code,
        device_ip=device_ip,
        user_agent=user_agent,
        code_verifier=code_verifier,
    )
    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_token_expires_in=tokens.expires_in,
    )
    return APIResponse.ok(data=tokens, message="Successfully authenticated with Google")


@router.post(
    "/google/callback",
    summary="Google OAuth Callback Endpoint (POST Body from SPA)",
    response_model=APIResponse[TokenResponse],
)
@limiter.limit("10/minute")
async def google_callback_post(
    request: Request,
    response: Response,
    body: OAuthCallbackRequest,
    service: AuthService = Depends(get_auth_service),
):
    from app.core.config import settings
    from app.core.exceptions import ForbiddenException
    if settings.is_production and (not body.state or not verify_signed_state(body.state)):
        raise ForbiddenException(
            message="Invalid or expired OAuth state parameter — CSRF protection triggered",
            error_code="INVALID_OAUTH_STATE",
        )
    device_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.authenticate_with_google_code(
        code=body.code,
        device_ip=device_ip,
        user_agent=user_agent,
        code_verifier=body.code_verifier,
    )
    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_token_expires_in=tokens.expires_in,
    )
    return APIResponse.ok(data=tokens, message="Successfully authenticated with Google")


# ─── 5. Token Refresh, Logout, & Session Management ───────────────────────────

@router.post(
    "/refresh",
    summary="Refresh Access Token with Refresh Token",
    response_model=APIResponse[RefreshResponse],
)
@limiter.limit("30/minute")
async def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
    service: AuthService = Depends(get_auth_service),
):
    from app.core.exceptions import UnauthorizedException
    raw_token = (body.refresh_token if body and body.refresh_token else None) or request.cookies.get("refresh_token")
    if not raw_token:
        raise UnauthorizedException(
            message="Refresh token missing",
            error_code="REFRESH_TOKEN_REQUIRED",
        )

    device_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    tokens = await service.refresh_access_token(
        raw_refresh_token=raw_token,
        device_ip=device_ip,
        user_agent=user_agent,
    )
    set_auth_cookies(
        response=response,
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        access_token_expires_in=tokens.expires_in,
    )
    return APIResponse.ok(data=tokens, message="Access token refreshed successfully")


@router.post(
    "/logout",
    summary="Revoke Current Refresh Token & Session",
    response_model=APIResponse[None],
)
async def logout(
    request: Request,
    response: Response,
    body: Optional[LogoutRequest] = None,
    service: AuthService = Depends(get_auth_service),
):
    raw_token = (body.refresh_token if body and body.refresh_token else None) or request.cookies.get("refresh_token")
    if raw_token:
        await service.logout(raw_token)
    clear_auth_cookies(response)
    return APIResponse.ok(data=None, message="Logged out successfully")


@router.get(
    "/me",
    summary="Get Current Authenticated User Profile",
    response_model=APIResponse[UserResponse],
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    user_schema = UserResponse.model_validate(current_user)
    return APIResponse.ok(data=user_schema, message="Current user profile retrieved")


@router.get(
    "/sessions",
    summary="List Active Sessions for Current User",
    response_model=APIResponse[List[SessionResponse]],
)
async def list_my_sessions(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    sessions = await service.list_active_sessions(current_user.id)
    return APIResponse.ok(data=sessions, message="Active sessions retrieved")


@router.delete(
    "/sessions/{session_id}",
    summary="Revoke Specific Session by ID",
    response_model=APIResponse[None],
)
async def revoke_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.revoke_session(current_user.id, session_id)
    return APIResponse.ok(data=None, message="Session revoked successfully")
