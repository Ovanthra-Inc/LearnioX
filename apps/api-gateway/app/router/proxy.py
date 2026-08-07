import httpx
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from app.registry.routes import resolve_target_service

router = APIRouter(tags=["Proxy Engine"])

# Shared HTTPX AsyncClient with connection pooling
client = httpx.AsyncClient(timeout=30.0, follow_redirects=False)


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

    target_url = f"{target_route.target}{resolved_path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    # Prepare forwarded headers
    headers = dict(request.headers)
    # Remove host header to allow target service host resolution
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

    try:
        req = client.build_request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )
        res = await client.send(req, stream=True)

        # Filter out hop-by-hop headers and redundant server/date headers
        excluded_headers = {"date", "server", "transfer-encoding", "content-length", "connection"}
        response_headers = {k: v for k, v in res.headers.items() if k.lower() not in excluded_headers}

        return StreamingResponse(
            res.aiter_raw(),
            status_code=res.status_code,
            headers=response_headers,
            background=httpx._client.Response(status_code=200).aclose,
        )

    except httpx.ConnectError:
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
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Gateway proxy exception: {str(e)}",
                "data": None,
                "error": {"code": "GATEWAY_ERROR", "details": [str(e)]},
            },
        )
