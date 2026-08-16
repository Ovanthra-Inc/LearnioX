from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.repositories.token_repository import TokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshResponse,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.session import SessionResponse
from app.schemas.user import UserResponse
from app.services.email_service import EmailService
from app.utils.oauth import get_google_auth_url, verify_and_get_google_user


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)

    def generate_google_login_url(self, state: Optional[str] = None) -> str:
        return get_google_auth_url(state)

    async def register_email_user(
        self,
        payload: SignupRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        """
        Registers a new user with email & password, dispatches rich verification email,
        and logs audit trail.
        """
        clean_email = payload.email.strip().lower()
        existing = await self.user_repo.get_by_email(clean_email)
        if existing:
            raise ConflictException(
                message="An account with this email address already exists.",
                error_code="EMAIL_ALREADY_EXISTS",
            )

        hashed_password = get_password_hash(payload.password)
        verification_token = generate_secure_token(32)
        verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        user = await self.user_repo.create_email_user(
            email=clean_email,
            name=payload.name.strip(),
            hashed_password=hashed_password,
            verification_token=verification_token,
            verification_expires_at=verification_expires_at,
        )

        # Audit trail: Record user registration method
        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type="SIGNUP",
            method="email_password",
            ip_address=ip_address,
            user_agent=user_agent,
            status="SUCCESS",
            details={"email": clean_email, "name": user.name},
        )

        # Dispatch rich HTML verification email
        await EmailService.send_verification_email(
            to_email=user.email,
            name=user.name,
            token=verification_token,
        )

        # Create session tokens
        access_token, expires_in = create_access_token(str(user.id), user.email)
        raw_refresh, token_hash, expires_at = create_refresh_token(str(user.id))

        safe_user_agent = (user_agent or "")[:512] if user_agent else None
        await self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_ip=ip_address,
            user_agent=safe_user_agent,
        )

        user_schema = UserResponse.model_validate(user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="Bearer",
            expires_in=expires_in,
            user=user_schema,
        )

    async def authenticate_with_password(
        self,
        payload: LoginRequest,
        device_name: Optional[str] = None,
        device_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        """
        Authenticates user via email and password, checks account active status,
        and logs audit trail.
        """
        clean_email = payload.email.strip().lower()
        user = await self.user_repo.get_by_email(clean_email)

        if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
            if user:
                await self.user_repo.log_auth_audit(
                    user_id=user.id,
                    event_type="LOGIN_FAILED",
                    method="email_password",
                    ip_address=device_ip,
                    user_agent=user_agent,
                    status="FAILED",
                    details={"reason": "INVALID_CREDENTIALS"},
                )
            raise UnauthorizedException(
                message="Invalid email or password.",
                error_code="INVALID_CREDENTIALS",
            )

        if not user.is_active:
            await self.user_repo.log_auth_audit(
                user_id=user.id,
                event_type="LOGIN_FAILED",
                method="email_password",
                ip_address=device_ip,
                user_agent=user_agent,
                status="FAILED",
                details={"reason": "ACCOUNT_DISABLED"},
            )
            raise UnauthorizedException(
                message="Your account is disabled. Please contact support.",
                error_code="ACCOUNT_DISABLED",
            )

        # Update last login timestamp & method
        await self.user_repo.update_last_login(user.id, method="email_password")

        # Audit trail: Record successful login
        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type="LOGIN_SUCCESS",
            method="email_password",
            ip_address=device_ip,
            user_agent=user_agent,
            status="SUCCESS",
        )

        access_token, expires_in = create_access_token(str(user.id), user.email)
        raw_refresh, token_hash, expires_at = create_refresh_token(str(user.id))

        safe_user_agent = (user_agent or "")[:512] if user_agent else None
        await self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_name=device_name,
            device_ip=device_ip,
            user_agent=safe_user_agent,
        )

        user_schema = UserResponse.model_validate(user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="Bearer",
            expires_in=expires_in,
            user=user_schema,
        )

    async def verify_email(
        self,
        token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """
        Verifies account email address using token.
        """
        if not token:
            raise ValidationException(
                message="Verification token is missing.",
                error_code="MISSING_TOKEN",
            )

        user = await self.user_repo.get_by_verification_token(token.strip())
        if not user:
            raise ValidationException(
                message="Invalid or expired verification token.",
                error_code="INVALID_VERIFICATION_TOKEN",
            )

        if user.verification_token_expires_at and user.verification_token_expires_at < datetime.now(timezone.utc):
            raise ValidationException(
                message="Verification token has expired. Please request a new verification email.",
                error_code="EXPIRED_VERIFICATION_TOKEN",
            )

        await self.user_repo.set_email_verified(user.id)

        # Audit trail: Record email verification event
        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type="EMAIL_VERIFIED",
            method="email_verification",
            ip_address=ip_address,
            user_agent=user_agent,
            status="SUCCESS",
        )
        return True

    async def resend_verification_email(self, email: str) -> bool:
        """
        Resends email verification link. Returns True gracefully even if email not found.
        """
        user = await self.user_repo.get_by_email(email.strip().lower())
        if not user or user.is_verified:
            return True

        verification_token = generate_secure_token(32)
        verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        await self.user_repo.set_verification_token(user.id, verification_token, verification_expires_at)

        await EmailService.send_verification_email(
            to_email=user.email,
            name=user.name,
            token=verification_token,
        )
        return True

    async def request_password_reset(
        self,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """
        Generates secure password reset token and sends rich reset email.
        """
        user = await self.user_repo.get_by_email(email.strip().lower())
        if not user:
            # Prevent email enumeration attacks by returning True
            return True

        reset_token = generate_secure_token(32)
        reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.user_repo.set_reset_password_token(user.id, reset_token, reset_expires_at)

        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type="PASSWORD_RESET_REQUESTED",
            method="email_reset",
            ip_address=ip_address,
            user_agent=user_agent,
            status="SUCCESS",
        )

        await EmailService.send_password_reset_email(
            to_email=user.email,
            name=user.name,
            token=reset_token,
        )
        return True

    async def reset_password(
        self,
        token: str,
        new_password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """
        Resets user password using valid token and notifies user.
        """
        if not token:
            raise ValidationException(
                message="Reset token is required.",
                error_code="MISSING_TOKEN",
            )

        user = await self.user_repo.get_by_reset_token(token.strip())
        if not user:
            raise ValidationException(
                message="Password reset link is invalid or has already been used.",
                error_code="INVALID_RESET_TOKEN",
            )

        if user.reset_password_token_expires_at and user.reset_password_token_expires_at < datetime.now(timezone.utc):
            raise ValidationException(
                message="Password reset link has expired. Please request a new one.",
                error_code="EXPIRED_RESET_TOKEN",
            )

        hashed_password = get_password_hash(new_password)
        await self.user_repo.update_password(user.id, hashed_password)

        # Invalidate all active sessions on password change for security
        await self.token_repo.revoke_all_user_tokens(user.id)

        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type="PASSWORD_RESET_SUCCESS",
            method="email_reset",
            ip_address=ip_address,
            user_agent=user_agent,
            status="SUCCESS",
        )

        await EmailService.send_password_changed_notification(
            to_email=user.email,
            name=user.name,
        )
        return True

    async def authenticate_with_google_code(
        self,
        code: str,
        device_name: Optional[str] = None,
        device_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        code_verifier: Optional[str] = None,
    ) -> TokenResponse:
        """
        Authenticates user via Google OAuth, registers if new, and logs audit trail.
        """
        from app.oauth.manager import oauth_manager
        google_provider = oauth_manager.get_provider("google")
        user_payload = await google_provider.authenticate_code(code=code, code_verifier=code_verifier)
        email = user_payload.email

        user = await self.user_repo.get_by_email(email)
        is_new_user = False
        if not user:
            is_new_user = True
            user = await self.user_repo.create_oauth_user(
                email=email,
                name=user_payload.name,
                picture=user_payload.picture,
                provider="google",
                provider_id=user_payload.provider_id,
            )
        else:
            await self.user_repo.update_last_login(user.id, method="google_oauth")

        # Audit trail: Record Google OAuth event
        event_type = "SIGNUP" if is_new_user else "LOGIN_SUCCESS"
        await self.user_repo.log_auth_audit(
            user_id=user.id,
            event_type=event_type,
            method="google_oauth",
            ip_address=device_ip,
            user_agent=user_agent,
            status="SUCCESS",
            details={"provider": "google", "is_new_user": is_new_user},
        )

        access_token, expires_in = create_access_token(str(user.id), user.email)
        raw_refresh, token_hash, expires_at = create_refresh_token(str(user.id))

        safe_user_agent = (user_agent or "")[:512] if user_agent else None
        await self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_name=device_name,
            device_ip=device_ip,
            user_agent=safe_user_agent,
        )

        user_schema = UserResponse.model_validate(user)
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="Bearer",
            expires_in=expires_in,
            user=user_schema,
        )

    async def refresh_access_token(
        self,
        raw_refresh_token: str,
        device_name: Optional[str] = None,
        device_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> RefreshResponse:
        payload = decode_token(raw_refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException(
                message="Invalid token type for refresh",
                error_code="INVALID_TOKEN_TYPE",
            )

        user_id = UUID(payload["sub"])
        token_hash = hash_token(raw_refresh_token)

        token_record = await self.token_repo.get_by_hash(token_hash)
        if not token_record or token_record.revoked_at is not None:
            raise UnauthorizedException(
                message="Refresh token is invalid or has been revoked",
                error_code="INVALID_REFRESH_TOKEN",
            )

        if token_record.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedException(
                message="Refresh token has expired",
                error_code="REFRESH_TOKEN_EXPIRED",
            )

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException(
                message="User not found or inactive",
                error_code="USER_INACTIVE",
            )

        new_access_token, expires_in = create_access_token(str(user.id), user.email)
        new_raw_refresh, new_token_hash, new_expires_at = create_refresh_token(str(user.id))

        safe_user_agent = (user_agent or "")[:512] if user_agent else None
        await self.token_repo.rotate_refresh_token(
            old_token_hash=token_hash,
            new_user_id=user.id,
            new_token_hash=new_token_hash,
            new_expires_at=new_expires_at,
            device_name=device_name,
            device_ip=device_ip,
            user_agent=safe_user_agent,
        )

        return RefreshResponse(
            access_token=new_access_token,
            refresh_token=new_raw_refresh,
            token_type="Bearer",
            expires_in=expires_in,
        )

    async def logout(self, raw_refresh_token: str) -> None:
        token_hash = hash_token(raw_refresh_token)
        await self.token_repo.revoke_refresh_token(token_hash)

    async def list_active_sessions(self, user_id: UUID) -> List[SessionResponse]:
        tokens = await self.token_repo.get_active_sessions_by_user_id(user_id)
        return [
            SessionResponse(
                id=t.id,
                device_name=t.device_name,
                device_ip=t.device_ip,
                user_agent=t.user_agent,
                created_at=t.created_at,
                expires_at=t.expires_at,
                is_current=False,
            )
            for t in tokens
        ]

    async def revoke_session(self, user_id: UUID, session_id: UUID) -> None:
        revoked = await self.token_repo.revoke_session_by_id(user_id, session_id)
        if not revoked:
            raise NotFoundException(
                message="Session not found or already revoked",
                error_code="SESSION_NOT_FOUND",
            )

    async def revoke_all_sessions(self, user_id: UUID) -> int:
        return await self.token_repo.revoke_all_user_tokens(user_id)
