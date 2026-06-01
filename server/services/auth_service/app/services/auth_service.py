import uuid
import httpx
import logging
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.user_identity import UserIdentity, UserStatus, AuthProvider
from app.models.verification_token import VerificationPurpose
from app.repositories.user_identity_repository import UserIdentityRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.verification_token_repository import VerificationTokenRepository
from app.services.password_service import PasswordService
from app.services.token_service import TokenService
from app.schemas.requests import RegisterRequest, LoginRequest
from app.schemas.responses import AuthUserResponse, TokenPairResponse, LoginResponse, SessionResponse

settings = get_settings()
logger = logging.getLogger(__name__)

_VERIFY_TOKEN_EXPIRE_HOURS = 24
_RESET_TOKEN_EXPIRE_MINUTES = 30


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserIdentityRepository(db)
        self.session_repo = SessionRepository(db)
        self.token_repo = VerificationTokenRepository(db)

    # ── Registration ─────────────────────────────────────────────────────────

    async def register(self, request: RegisterRequest) -> UserIdentity:
        existing_user = await self.user_repo.get_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        hashed_password = PasswordService.hash(request.password)
        new_user = UserIdentity(
            email=request.email,
            password_hash=hashed_password,
            provider=AuthProvider.EMAIL,
            status=UserStatus.PENDING_VERIFICATION,
            is_email_verified=False,
        )
        created_user = await self.user_repo.create(new_user)

        # Queue email verification token
        await self._create_and_notify_verification(created_user)

        # Call user profile service to create profile
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                profile_payload = {
                    "auth_user_id": str(created_user.id),
                    "full_name": request.full_name,
                    "email": request.email,
                }
                headers = {"Authorization": f"Bearer {settings.INTERNAL_API_KEY}"}
                response = await client.post(
                    f"{settings.USER_SERVICE_URL}/api/v1/users",
                    json=profile_payload,
                    headers=headers
                )
                if response.status_code not in (200, 201):
                    logger.error(
                        f"Failed to create user profile. Status: {response.status_code}, Body: {response.text}"
                    )
        except Exception as e:
            logger.error(f"Failed to connect to user profile service: {str(e)}")

        return created_user

    # ── Email Verification ───────────────────────────────────────────────────

    async def _create_and_notify_verification(self, user: UserIdentity) -> str:
        """Create a verification token and fire-and-forget a notification. Returns raw token."""
        raw_token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=_VERIFY_TOKEN_EXPIRE_HOURS)
        await self.token_repo.create(user.id, raw_token, VerificationPurpose.EMAIL_VERIFY, expires_at)

        if settings.NOTIFICATION_SERVICE_URL:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(
                        f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send",
                        json={
                            "user_id": str(user.id),
                            "channel": "email",
                            "template": "email_verification",
                            "data": {"token": raw_token, "email": user.email},
                        },
                        headers={"x-api-key": settings.INTERNAL_API_KEY},
                    )
            except Exception as e:
                logger.warning(f"Notification service unreachable for email verify: {e}")

        return raw_token

    async def verify_email(self, token: str) -> UserIdentity:
        token_obj = await self.token_repo.get_active_by_token(token, VerificationPurpose.EMAIL_VERIFY)
        if not token_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )

        user = await self.user_repo.get_by_id(token_obj.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        await self.token_repo.mark_used(token_obj.id)

        if not user.is_email_verified:
            user.is_email_verified = True
            user.status = UserStatus.ACTIVE
            await self.db.commit()
            await self.db.refresh(user)

        return user

    async def resend_verification(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email)
        if not user or user.is_email_verified:
            return  # Silent — don't reveal existence
        await self._create_and_notify_verification(user)

    # ── Password Reset ───────────────────────────────────────────────────────

    async def forgot_password(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return  # Silent — don't reveal existence

        raw_token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=_RESET_TOKEN_EXPIRE_MINUTES)
        await self.token_repo.create(user.id, raw_token, VerificationPurpose.PASSWORD_RESET, expires_at)

        if settings.NOTIFICATION_SERVICE_URL:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(
                        f"{settings.NOTIFICATION_SERVICE_URL}/api/v1/notifications/send",
                        json={
                            "user_id": str(user.id),
                            "channel": "email",
                            "template": "password_reset",
                            "data": {"token": raw_token, "email": user.email},
                        },
                        headers={"x-api-key": settings.INTERNAL_API_KEY},
                    )
            except Exception as e:
                logger.warning(f"Notification service unreachable for password reset: {e}")

    async def reset_password(self, token: str, new_password: str) -> None:
        token_obj = await self.token_repo.get_active_by_token(token, VerificationPurpose.PASSWORD_RESET)
        if not token_obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        user = await self.user_repo.get_by_id(token_obj.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.password_hash = PasswordService.hash(new_password)
        await self.db.commit()
        await self.token_repo.mark_used(token_obj.id)

        # Revoke all active sessions for security after password change
        await self.session_repo.revoke_all_sessions(user.id)

    # ── Login / Refresh / Logout ─────────────────────────────────────────────

    async def login(
        self, request: LoginRequest, user_agent: str | None = None, ip_address: str | None = None
    ) -> LoginResponse:
        user = await self.user_repo.get_by_email(request.email)
        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not PasswordService.verify(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if user.status == UserStatus.PENDING_VERIFICATION:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please check your inbox and verify your account."
            )

        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is {user.status.value}. Contact support."
            )

        await self.user_repo.update_last_login(user.id)

        access_token, _ = TokenService.create_access_token(user.id, user.email)
        refresh_token = TokenService.generate_refresh_token()
        refresh_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        await self.session_repo.create(
            user_id=user.id,
            token=refresh_token,
            expires_at=refresh_expires,
            user_agent=user_agent,
            ip_address=ip_address
        )

        user_resp = AuthUserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            status=user.status.value,
            is_email_verified=user.is_email_verified,
            is_phone_verified=user.is_phone_verified,
            created_at=user.created_at
        )

        tokens_resp = TokenPairResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        return LoginResponse(user=user_resp, tokens=tokens_resp)

    async def refresh_tokens(
        self, refresh_token: str, user_agent: str | None = None, ip_address: str | None = None
    ) -> TokenPairResponse:
        session = await self.session_repo.get_active_by_token(refresh_token)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user = await self.user_repo.get_by_id(session.user_id)
        if not user or user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        await self.session_repo.revoke_session(session.id)

        new_access_token, _ = TokenService.create_access_token(user.id, user.email)
        new_refresh_token = TokenService.generate_refresh_token()
        new_refresh_expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        await self.session_repo.create(
            user_id=user.id,
            token=new_refresh_token,
            expires_at=new_refresh_expires,
            user_agent=user_agent,
            ip_address=ip_address
        )

        return TokenPairResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def logout(self, refresh_token: str) -> None:
        session = await self.session_repo.get_active_by_token(refresh_token)
        if session:
            await self.session_repo.revoke_session(session.id)

    # ── Sessions ─────────────────────────────────────────────────────────────

    async def get_sessions(self, user_id: uuid.UUID) -> list:
        return await self.session_repo.list_active_sessions(user_id)

    async def revoke_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> None:
        session = await self.session_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        await self.session_repo.revoke_session(session_id)
