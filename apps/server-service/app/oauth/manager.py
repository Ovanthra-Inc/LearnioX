from typing import Dict, Optional
from app.core.exceptions import NotFoundException
from app.oauth.base import BaseOAuthProvider
from app.oauth.google import GoogleOAuthProvider


class OAuthManager:
    """
    Registry and provider manager for all OAuth identity providers in LearnioX.
    """

    def __init__(self):
        self._providers: Dict[str, BaseOAuthProvider] = {}
        # Register standard providers
        self.register_provider(GoogleOAuthProvider())

    def register_provider(self, provider: BaseOAuthProvider) -> None:
        self._providers[provider.provider_name.lower()] = provider

    def get_provider(self, name: str) -> BaseOAuthProvider:
        provider = self._providers.get(name.lower())
        if not provider:
            raise NotFoundException(
                message=f"OAuth provider '{name}' is not supported.",
                error_code="UNSUPPORTED_OAUTH_PROVIDER",
            )
        return provider

    def list_providers(self) -> Dict[str, bool]:
        """Returns map of provider names and whether they are active and configured."""
        result = {}
        for name, provider in self._providers.items():
            is_configured = getattr(provider, "is_configured", True)
            result[name] = is_configured
        return result


# Singleton manager instance
oauth_manager = OAuthManager()
