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
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    # HIGH-04: Always generate a signed state if none provided
    signed_state = state if (state and verify_signed_state(state)) else create_signed_state(state or "")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID or "mock_client_id",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": signed_state,
    }
    return f"{base_url}?{urllib.parse.urlencode(params)}"


async def verify_and_get_google_user(code: str) -> Dict[str, Any]:
    # Development / Mock bypass when testing locally without active Google OAuth keys
    if settings.ALLOW_DEV_LOGIN and (
        not settings.GOOGLE_CLIENT_SECRET
        or settings.GOOGLE_CLIENT_SECRET.startswith("mock")
        or code.startswith("dev_")
    ):
        dev_email = f"dev_user_{code[:6]}@example.com" if code else "dev_user@example.com"
        return {
            "email": dev_email,
            "name": "Dev User",
            "picture": "https://lh3.googleusercontent.com/a/default-avatar",
            "provider_id": f"google_dev_{code}",
        }

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        if response.status_code != 200:
            raise UnauthorizedException(
                message="Failed to exchange authorization code with Google",
                error_code="GOOGLE_AUTH_FAILED",
            )
        token_data = response.json()
        access_token_str = token_data.get("access_token")

        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token_str}"}
        user_response = await client.get(user_info_url, headers=headers)
        if user_response.status_code != 200:
            raise UnauthorizedException(
                message="Failed to fetch user profile from Google",
                error_code="GOOGLE_USER_INFO_FAILED",
            )
        info = user_response.json()
        return {
            "email": info["email"],
            "name": info.get("name", info["email"].split("@")[0]),
            "picture": info.get("picture"),
            "provider_id": info.get("id"),
        }
