import uuid
from fastapi import APIRouter, Depends, Request, Response, status, Cookie, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse

from app.core.config import get_settings
from app.dependencies.db import get_db
from app.schemas.requests import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.responses import AuthUserResponse, LoginResponse, TokenPairResponse, SessionResponse
from app.services.auth_service import AuthService

router = APIRouter()
settings = get_settings()


# ── Helper ────────────────────────────────────────────────────────────────────

def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN if settings.APP_ENV != "local" else None,
    )


def _get_user_id_header(x_user_id: str | None = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID")


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=APIResponse[AuthUserResponse], status_code=201)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.register(request)
    user_resp = AuthUserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        status=user.status.value,
        is_email_verified=user.is_email_verified,
        is_phone_verified=user.is_phone_verified,
        created_at=user.created_at,
    )
    return APIResponse(
        success=True,
        message="Registration successful. Please verify your email.",
        data=user_resp,
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=APIResponse[LoginResponse])
async def login(
    request: LoginRequest,
    req: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    user_agent = req.headers.get("user-agent")
    ip_address = req.client.host if req.client else None

    login_data = await auth_service.login(request, user_agent=user_agent, ip_address=ip_address)
    _set_refresh_cookie(response, login_data.tokens.refresh_token)

    return APIResponse(success=True, message="Login successful", data=login_data)


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=APIResponse[TokenPairResponse])
async def refresh(
    request: RefreshTokenRequest,
    req: Request,
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    token = request.refresh_token or refresh_token
    if not token:
        return APIResponse(
            success=False,
            message="Refresh token missing",
            error={"code": "REFRESH_TOKEN_REQUIRED", "message": "Refresh token is required"},
        )

    auth_service = AuthService(db)
    user_agent = req.headers.get("user-agent")
    ip_address = req.client.host if req.client else None

    tokens = await auth_service.refresh_tokens(token, user_agent=user_agent, ip_address=ip_address)
    _set_refresh_cookie(response, tokens.refresh_token)

    return APIResponse(success=True, message="Token refreshed successfully", data=tokens)


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout", response_model=APIResponse[dict])
async def logout(
    request: RefreshTokenRequest,
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    token = request.refresh_token or refresh_token
    if token:
        auth_service = AuthService(db)
        await auth_service.logout(token)

    response.delete_cookie("refresh_token")
    return APIResponse(success=True, message="Logged out successfully", data={})


# ── Email Verification ────────────────────────────────────────────────────────

@router.post("/verify-email", response_model=APIResponse[AuthUserResponse])
async def verify_email(request: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.verify_email(request.token)
    return APIResponse(
        success=True,
        message="Email verified successfully",
        data=AuthUserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            status=user.status.value,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
        ),
    )


@router.post("/resend-verification", response_model=APIResponse[dict])
async def resend_verification(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Resend email verification — uses ForgotPasswordRequest (just needs email field)."""
    auth_service = AuthService(db)
    await auth_service.resend_verification(request.email)
    return APIResponse(
        success=True,
        message="If the email exists and is unverified, a new verification link has been sent.",
        data={},
    )


# ── Password Reset ────────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=APIResponse[dict])
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    await auth_service.forgot_password(request.email)
    return APIResponse(
        success=True,
        message="If the email exists, a password reset link has been sent.",
        data={},
    )


@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    await auth_service.reset_password(request.token, request.new_password)
    return APIResponse(success=True, message="Password reset successfully", data={})


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=APIResponse[list[SessionResponse]])
async def list_sessions(
    user_id: uuid.UUID = Depends(_get_user_id_header),
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    sessions = await auth_service.get_sessions(user_id)
    return APIResponse(
        success=True,
        message="Active sessions retrieved",
        data=[
            SessionResponse(
                id=s.id,
                user_agent=s.user_agent,
                ip_address=s.ip_address,
                is_active=s.is_active,
                created_at=s.created_at,
                expires_at=s.expires_at,
            )
            for s in sessions
        ],
    )


@router.delete("/sessions/{session_id}", response_model=APIResponse[dict])
async def revoke_session(
    session_id: uuid.UUID,
    user_id: uuid.UUID = Depends(_get_user_id_header),
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    await auth_service.revoke_session(session_id, user_id)
    return APIResponse(success=True, message="Session revoked", data={})


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=APIResponse[AuthUserResponse])
async def get_me(
    user_id: uuid.UUID = Depends(_get_user_id_header),
    db: AsyncSession = Depends(get_db),
):
    from app.repositories.user_identity_repository import UserIdentityRepository
    repo = UserIdentityRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(
        success=True,
        message="User retrieved",
        data=AuthUserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            status=user.status.value,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at,
        ),
    )
