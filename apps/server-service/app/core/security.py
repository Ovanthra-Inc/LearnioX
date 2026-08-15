import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.exceptions import UnauthorizedException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hashes plain text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verifies a plain password against stored hash."""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def generate_secure_token(nbytes: int = 32) -> str:
    """Generates URL-safe cryptographically random token."""
    return secrets.token_urlsafe(nbytes)


def create_access_token(user_id: str, email: str) -> Tuple[str, int]:
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + expires_delta
    expires_in_seconds = int(expires_delta.total_seconds())

    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "exp": expire,
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expires_in_seconds


def create_refresh_token(user_id: str) -> Tuple[str, str, datetime]:
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expires_at = datetime.now(timezone.utc) + expires_delta
    jti = str(uuid.uuid4())

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "exp": expires_at,
    }

    raw_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash, expires_at


def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException(
            message="Token has expired", error_code="TOKEN_EXPIRED"
        )
    except jwt.InvalidTokenError:
        raise UnauthorizedException(
            message="Invalid token", error_code="INVALID_TOKEN"
        )


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_auth_cookies(
    response: Any,
    access_token: str,
    refresh_token: str,
    access_token_expires_in: int = 900,
    refresh_token_days: int = 7,
) -> None:
    """
    Sets dual HttpOnly secure SameSite cookies for access and refresh tokens.
    """
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=access_token_expires_in,
        expires=access_token_expires_in,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    refresh_max_age = refresh_token_days * 86400
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_max_age,
        expires=refresh_max_age,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )


def clear_auth_cookies(response: Any) -> None:
    """
    Clears access_token and refresh_token cookies.
    """
    response.delete_cookie(key="access_token", path="/", httponly=True, samesite="lax", secure=settings.is_production)
    response.delete_cookie(key="refresh_token", path="/", httponly=True, samesite="lax", secure=settings.is_production)

