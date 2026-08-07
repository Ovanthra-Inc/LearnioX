import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import jwt
from app.core.config import settings
from app.core.exceptions import UnauthorizedException


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
