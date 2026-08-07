import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.response import APIResponse

logger = logging.getLogger("server-service")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        response_body = APIResponse.fail(
            message=exc.message,
            code=exc.error_code,
            details=exc.details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump(),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            500: "INTERNAL_SERVER_ERROR",
        }
        error_code = code_map.get(exc.status_code, "HTTP_ERROR")
        message = exc.detail if isinstance(exc.detail, str) else "HTTP Request Error"
        details = exc.detail if isinstance(exc.detail, list) else None

        response_body = APIResponse.fail(
            message=message,
            code=error_code,
            details=details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body.model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = []
        for err in exc.errors():
            field = ".".join(str(loc) for loc in err.get("loc", []))
            errors.append(
                {
                    "field": field,
                    "message": err.get("msg", "Invalid value"),
                    "type": err.get("type", "value_error"),
                }
            )

        response_body = APIResponse.fail(
            message="Validation error in request data",
            code="VALIDATION_ERROR",
            details=errors,
        )
        return JSONResponse(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            content=response_body.model_dump(),
        )


    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled Internal Server Exception: {exc}", exc_info=True)

        if getattr(settings, "ENVIRONMENT", "development").lower() == "production":
            msg = "An unexpected internal server error occurred"
        else:
            msg = f"Internal server error: {str(exc)}"

        response_body = APIResponse.fail(
            message=msg,
            code="INTERNAL_SERVER_ERROR",
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=response_body.model_dump(),
        )
