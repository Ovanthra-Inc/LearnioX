from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class OAuthUserPayload(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    provider: str
    provider_id: str
    email_verified: bool = True
    raw_data: Dict[str, Any] = Field(default_factory=dict)


class BaseOAuthProvider(ABC):
    """
    Abstract Base Class for all OAuth2 / OpenID Connect identity providers in LearnioX.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name identifier for the provider (e.g. 'google', 'github')."""
        pass

    @abstractmethod
    def get_authorization_url(
        self,
        state: Optional[str] = None,
        code_challenge: Optional[str] = None,
        code_challenge_method: Optional[str] = None,
    ) -> str:
        """Generates the authorization redirect URL for the provider."""
        pass

    @abstractmethod
    async def authenticate_code(
        self,
        code: str,
        code_verifier: Optional[str] = None,
    ) -> OAuthUserPayload:
        """Exchanges an authorization code for user profile info."""
        pass
