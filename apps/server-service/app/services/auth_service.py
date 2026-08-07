from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import UnauthorizedException, NotFoundException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
)
from app.repositories.token_repository import TokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RefreshResponse, TokenResponse
from app.schemas.session import SessionResponse
from app.schemas.user import UserResponse
from app.utils.oauth import get_google_auth_url, verify_and_get_google_user


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = TokenRepository(db)

    def generate_google_login_url(self, state: Optional[str] = None) -> str:
        return get_google_auth_url(state)

    async def authenticate_with_google_code(
        self,
        code: str,
        device_name: Optional[str] = None,
        device_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        user_info = await verify_and_get_google_user(code)
        email = user_info["email"]

        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create(
                email=email,
                name=user_info["name"],
                picture=user_info.get("picture"),
                provider="google",
                provider_id=user_info.get("provider_id"),
            )
        else:
            await self.user_repo.update_last_login(user.id)

        access_token, expires_in = create_access_token(str(user.id), user.email)
        raw_refresh, token_hash, expires_at = create_refresh_token(str(user.id))

        # HIGH-03: Truncate User-Agent to prevent column overflow or log injection
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

        now = datetime.now(timezone.utc)
        # FIX #15: Normalize expires_at — Postgres may return tz-naive timestamps
        token_expires = token_record.expires_at
        if token_expires is not None and token_expires.tzinfo is None:
            token_expires = token_expires.replace(tzinfo=timezone.utc)
        if token_expires is None or token_expires < now:
            raise UnauthorizedException(
                message="Refresh token has expired",
                error_code="REFRESH_TOKEN_EXPIRED",
            )

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException(
                message="User associated with token is disabled or not found",
                error_code="USER_INACTIVE",
            )

        # Rotate refresh token: Revoke old token, issue new token
        await self.token_repo.revoke_token(token_record.id)

        new_access_token, expires_in = create_access_token(str(user.id), user.email)
        new_raw_refresh, new_token_hash, expires_at = create_refresh_token(str(user.id))

        await self.token_repo.create_refresh_token(
            user_id=user.id,
            token_hash=new_token_hash,
            expires_at=expires_at,
            device_name=device_name or token_record.device_name,
            device_ip=device_ip or token_record.device_ip,
            user_agent=user_agent or token_record.user_agent,
        )

        return RefreshResponse(
            access_token=new_access_token,
            refresh_token=new_raw_refresh,
            token_type="Bearer",
            expires_in=expires_in,
        )

    async def logout(self, raw_refresh_token: str) -> None:
        token_hash = hash_token(raw_refresh_token)
        token_record = await self.token_repo.get_by_hash(token_hash)
        if token_record:
            await self.token_repo.revoke_token(token_record.id)

    async def logout_all(self, user_id: UUID) -> None:
        await self.token_repo.revoke_all_user_tokens(user_id)

    async def get_user_sessions(
        self, user_id: UUID, current_raw_token: Optional[str] = None
    ) -> List[SessionResponse]:
        current_hash = hash_token(current_raw_token) if current_raw_token else None
        active_tokens = await self.token_repo.get_active_sessions_for_user(user_id)

        sessions = []
        for t in active_tokens:
            sessions.append(
                SessionResponse(
                    id=t.id,
                    device_name=t.device_name or "Unknown Device",
                    ip=t.device_ip or "Unknown IP",
                    user_agent=t.user_agent or "Unknown Browser",
                    created_at=t.created_at,
                    expires_at=t.expires_at,
                    current=(t.token_hash == current_hash),
                )
            )
        return sessions

    async def delete_user_session(self, session_id: UUID, user_id: UUID) -> None:
        success = await self.token_repo.delete_session(session_id, user_id)
        if not success:
            raise NotFoundException(
                message="Session not found or already revoked",
                error_code="SESSION_NOT_FOUND",
            )
