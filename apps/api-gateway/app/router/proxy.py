import enum
import logging
import time
from typing import Dict
import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from app.registry.routes import resolve_target_service

logger = logging.getLogger("gateway.proxy")
router = APIRouter(tags=["Proxy Engine"])


class CircuitState(str, enum.Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    In-memory Circuit Breaker to protect microservices from cascading failure.
    - CLOSED: Normal requests pass through.
    - OPEN: 5+ consecutive failures trips the circuit for recovery_timeout seconds.
    - HALF_OPEN: Single probe request checks if the service has recovered.
    """

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0.0

    def can_attempt(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        now = time.time()
        if self.state == CircuitState.OPEN:
            if now - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit transitioned to HALF_OPEN — sending probe request")
                return True
            return False
        # In HALF_OPEN: allow trial request
        return True

    def record_success(self):
        if self.state != CircuitState.CLOSED:
            logger.info(f"Circuit recovered to CLOSED after successful probe")
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold and self.state != CircuitState.OPEN:
            self.state = CircuitState.OPEN
            logger.error(
                f"Circuit tripped to OPEN (failures={self.failure_count}, recovery_timeout={self.recovery_timeout}s)"
            )


# Circuit breakers keyed by service name
_circuit_breakers: Dict[str, CircuitBreaker] = {}

# Per-service timeout profiles
SERVICE_TIMEOUTS = {
    "server-service": httpx.Timeout(30.0, connect=5.0),
    "ai-service": httpx.Timeout(120.0, connect=5.0),
    "marketing-service": httpx.Timeout(15.0, connect=5.0),
    "live-service": httpx.Timeout(60.0, connect=5.0),
}
DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=5.0)
UPLOAD_TIMEOUT = httpx.Timeout(300.0, connect=10.0)

# Global async client with pooled connections
client = httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0), follow_redirects=False)


def get_breaker(service_name: str) -> CircuitBreaker:
    if service_name not in _circuit_breakers:
        _circuit_breakers[service_name] = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)
    return _circuit_breakers[service_name]


def get_timeout_for_route(service_name: str, path: str) -> httpx.Timeout:
    if "/storage/upload" in path or "/files/upload" in path:
        return UPLOAD_TIMEOUT
    return SERVICE_TIMEOUTS.get(service_name, DEFAULT_TIMEOUT)


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_handler(request: Request, path: str):
    full_path = f"/{path}"
    target_route, resolved_path = resolve_target_service(full_path)

    if not target_route:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": "Gateway path could not be resolved to any active microservice",
                "data": None,
                "error": {"code": "GATEWAY_ROUTE_NOT_FOUND", "details": []},
            },
        )

    # ── Circuit Breaker check ────────────────────────────────────────────────
    breaker = get_breaker(target_route.name)
    if not breaker.can_attempt():
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": f"Service '{target_route.name}' is temporarily unavailable (circuit breaker open). Please retry shortly.",
                "data": None,
                "error": {"code": "SERVICE_UNAVAILABLE", "details": ["Circuit breaker OPEN"]},
            },
        )

    target_url = f"{target_route.target}{resolved_path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # Prepare forwarded headers
    headers = dict(request.headers)
    headers.pop("host", None)
    headers["x-forwarded-for"] = request.client.host if request.client else "unknown"
    headers["x-forwarded-proto"] = request.url.scheme
    headers["x-request-id"] = getattr(request.state, "request_id", "")

    if hasattr(request.state, "user_id"):
        headers["x-user-id"] = request.state.user_id
    if hasattr(request.state, "user_email") and request.state.user_email:
        headers["x-user-email"] = request.state.user_email

    # Read body stream
    body = await request.body()
    timeout = get_timeout_for_route(target_route.name, full_path)

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            timeout=timeout,
        )
        res = await client.send(req, stream=True)

        if res.status_code >= 500:
            breaker.record_failure()
        else:
            breaker.record_success()

        # Filter out hop-by-hop headers
        excluded_headers = {"date", "server", "transfer-encoding", "content-length", "connection"}
        response_headers = {k: v for k, v in res.headers.items() if k.lower() not in excluded_headers}

        return StreamingResponse(
            res.aiter_raw(),
            status_code=res.status_code,
            headers=response_headers,
            background=httpx._client.Response(status_code=200).aclose,
        )

    except httpx.ConnectError:
        breaker.record_failure()
        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "message": f"Service '{target_route.name}' is unreachable at {target_route.target}.",
                "data": None,
                "error": {"code": "BAD_GATEWAY", "details": []},
            },
        )
    except httpx.TimeoutException:
        breaker.record_failure()
        return JSONResponse(
            status_code=504,
            content={
                "success": False,
                "message": f"Request to service '{target_route.name}' timed out.",
                "data": None,
                "error": {"code": "GATEWAY_TIMEOUT", "details": []},
            },
        )
    except Exception as e:
        breaker.record_failure()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Gateway proxy exception: {str(e)}",
                "data": None,
                "error": {"code": "GATEWAY_ERROR", "details": [str(e)]},
            },
        )
