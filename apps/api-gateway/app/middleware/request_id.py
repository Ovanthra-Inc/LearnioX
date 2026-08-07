import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class GatewayRequestIDMiddleware(BaseHTTPMiddleware):
    """
    Injects a unique, server-generated X-Request-ID into every incoming request.
    This ID is propagated to downstream microservices and echoed in response headers.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
