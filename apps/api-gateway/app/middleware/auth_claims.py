import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import settings


class GatewayAuthClaimsMiddleware(BaseHTTPMiddleware):
    """
    Inspects JWT Authorization tokens at the Gateway level, extracts user claims,
    and attaches X-User-ID and X-User-Email headers for downstream microservices.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                sub = payload.get("sub")
                if sub:
                    request.state.user_id = sub
                    request.state.user_email = payload.get("email")
            except Exception:
                # Invalid or expired token — leave state unpopulated.
                # Downstream microservices enforce strict 401 if route is protected.
                pass
        return await call_next(request)
