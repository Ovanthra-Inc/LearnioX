import base64
import hmac
import hashlib
import time
import secrets
import urllib.parse
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException

# State expiration time: 15 minutes (900 seconds)
_STATE_TTL_SECONDS = 900


def create_signed_state(extra_payload: str = "") -> str:
    """
    HIGH-04: Creates a cryptographically signed CSRF state token.
    Contains timestamp, nonce, and HMAC-SHA256 signature using SECRET_KEY.
    """
    ts = str(int(time.time()))
    nonce = secrets.token_hex(8)
    data = f"{ts}:{nonce}:{extra_payload}"
    sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    raw = f"{data}:{sig}"
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8")


def verify_signed_state(state: str) -> bool:
    """
    HIGH-04: Validates the HMAC signature and timestamp of an OAuth state token.
    Returns True if valid, False if tampered, expired, or malformed.
    """
    if not state:
        return False

    # Dev bypass for dev authorization codes
    if not settings.is_production and state.startswith("dev_"):
        return True

    try:
        raw = base64.urlsafe_b64decode(state.encode("utf-8")).decode("utf-8")
        parts = raw.split(":")
        if len(parts) != 4:
            return False

        ts_str, nonce, extra, sig = parts
        ts = int(ts_str)

        # Check timestamp expiration (15 min)
        if time.time() - ts > _STATE_TTL_SECONDS or ts > time.time() + 60:
            return False

        # Re-compute expected signature
        data = f"{ts_str}:{nonce}:{extra}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            data.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False


def get_google_auth_url(state: Optional[str] = None) -> str:
    from app.oauth.manager import oauth_manager
    google_provider = oauth_manager.get_provider("google")
    return google_provider.get_authorization_url(state=state)


async def verify_and_get_google_user(code: str) -> Dict[str, Any]:
    from app.oauth.manager import oauth_manager
    google_provider = oauth_manager.get_provider("google")
    user_payload = await google_provider.authenticate_code(code=code)
    return {
        "email": user_payload.email,
        "name": user_payload.name,
        "picture": user_payload.picture,
        "provider_id": user_payload.provider_id,
    }

