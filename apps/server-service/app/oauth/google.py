import urllib.parse
from typing import Any, Dict, Optional
import httpx
import jwt
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ValidationException
from app.oauth.base import BaseOAuthProvider, OAuthUserPayload
from app.utils.oauth import create_signed_state, verify_signed_state


class GoogleOAuthProvider(BaseOAuthProvider):
    """
    Google OAuth 2.0 and OpenID Connect identity provider implementation.
    """

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    @property
    def provider_name(self) -> str:
        return "google"

    @property
    def is_configured(self) -> bool:
        """Returns True if valid Google OAuth credentials exist in settings."""
        client_id = settings.GOOGLE_CLIENT_ID or ""
        client_secret = settings.GOOGLE_CLIENT_SECRET or ""
        return bool(
            client_id
            and not client_id.startswith("mock")
            and client_secret
            and not client_secret.startswith("mock")
        )

    def get_authorization_url(
        self,
        state: Optional[str] = None,
        code_challenge: Optional[str] = None,
        code_challenge_method: Optional[str] = None,
    ) -> str:
        # Check if credentials are fully configured
        if not self.is_configured:
            if settings.ALLOW_DEV_LOGIN:
                # In dev mode when credentials aren't configured yet,
                # return a local mock callback URL so local development works seamlessly
                signed_state = state if (state and verify_signed_state(state)) else create_signed_state("dev_local")
                redirect_uri = settings.GOOGLE_REDIRECT_URI
                separator = "&" if "?" in redirect_uri else "?"
                return f"{redirect_uri}{separator}code=dev_google_user&state={signed_state}"
            else:
                raise ValidationException(
                    message="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
                    error_code="GOOGLE_OAUTH_NOT_CONFIGURED",
                )

        signed_state = state if (state and verify_signed_state(state)) else create_signed_state(state or "")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": signed_state,
        }

        if code_challenge:
            params["code_challenge"] = code_challenge
            params["code_challenge_method"] = code_challenge_method or "S256"

        return f"{self.AUTH_URL}?{urllib.parse.urlencode(params)}"

    async def authenticate_code(
        self,
        code: str,
        code_verifier: Optional[str] = None,
    ) -> OAuthUserPayload:
        # 1. Dev / Mock bypass for offline local development
        if settings.ALLOW_DEV_LOGIN and (
            not self.is_configured or code.startswith("dev_")
        ):
            dev_email = f"dev_user_{code[:8]}@example.com" if code else "dev_user@example.com"
            return OAuthUserPayload(
                email=dev_email,
                name="Dev Google User",
                picture="https://lh3.googleusercontent.com/a/default-avatar",
                provider="google",
                provider_id=f"google_dev_{code}",
                email_verified=True,
                raw_data={"mock": True, "code": code},
            )

        if not self.is_configured:
            raise UnauthorizedException(
                message="Google OAuth credentials are not configured on this server.",
                error_code="GOOGLE_OAUTH_NOT_CONFIGURED",
            )

        # 2. Exchange authorization code for tokens with Google API
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        if code_verifier:
            data["code_verifier"] = code_verifier

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(self.TOKEN_URL, data=data)
            except Exception as exc:
                raise UnauthorizedException(
                    message=f"Failed to connect to Google OAuth service: {str(exc)}",
                    error_code="GOOGLE_NETWORK_ERROR",
                )

            if response.status_code != 200:
                error_body = response.text
                raise UnauthorizedException(
                    message="Failed to exchange authorization code with Google",
                    error_code="GOOGLE_AUTH_FAILED",
                    details=[error_body],
                )

            token_data = response.json()
            access_token = token_data.get("access_token")
            id_token_str = token_data.get("id_token")

            # Try to decode claims from id_token first
            user_info: Dict[str, Any] = {}
            if id_token_str:
                try:
                    # Unverified decode to extract standard claims safely (Google is trusted over TLS)
                    claims = jwt.decode(id_token_str, options={"verify_signature": False})
                    user_info = {
                        "email": claims.get("email"),
                        "name": claims.get("name") or (claims.get("email", "").split("@")[0]),
                        "picture": claims.get("picture"),
                        "id": claims.get("sub"),
                        "email_verified": claims.get("email_verified", True),
                    }
                except Exception:
                    user_info = {}

            # Fallback to userinfo endpoint if id_token claims were incomplete
            if not user_info.get("email") and access_token:
                headers = {"Authorization": f"Bearer {access_token}"}
                user_res = await client.get(self.USERINFO_URL, headers=headers)
                if user_res.status_code != 200:
                    raise UnauthorizedException(
                        message="Failed to fetch user profile from Google",
                        error_code="GOOGLE_USER_INFO_FAILED",
                    )
                info = user_res.json()
                user_info = {
                    "email": info.get("email"),
                    "name": info.get("name") or (info.get("email", "").split("@")[0]),
                    "picture": info.get("picture"),
                    "id": info.get("id"),
                    "email_verified": info.get("verified_email", True),
                }

            if not user_info.get("email"):
                raise UnauthorizedException(
                    message="Google account did not return a valid email address.",
                    error_code="GOOGLE_EMAIL_MISSING",
                )

            return OAuthUserPayload(
                email=user_info["email"],
                name=user_info.get("name", user_info["email"].split("@")[0]),
                picture=user_info.get("picture"),
                provider="google",
                provider_id=str(user_info.get("id", user_info["email"])),
                email_verified=bool(user_info.get("email_verified", True)),
                raw_data=token_data,
            )
