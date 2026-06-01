import jwt
import uuid
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings

settings = get_settings()


class TokenService:
    @staticmethod
    def create_access_token(user_id: uuid.UUID, email: str, expires_delta: timedelta | None = None) -> tuple[str, datetime]:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode = {
            "sub": str(user_id),
            "email": email,
            "exp": int(expire.timestamp()),
            "type": "access",
        }

        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt, expire

    @staticmethod
    def decode_access_token(token: str) -> dict | None:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            if payload.get("type") != "access":
                return None
            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def generate_refresh_token() -> str:
        return secrets.token_urlsafe(64)
