from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    details: Optional[List[Any]] = None


class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: Optional[T] = None, message: str = "Success") -> "APIResponse[T]":
        return cls(success=True, message=message, data=data, error=None)

    @classmethod
    def fail(
        cls, message: str, code: str = "BAD_REQUEST", details: Optional[List[Any]] = None
    ) -> "APIResponse[Any]":
        return cls(
            success=False,
            message=message,
            data=None,
            error=ErrorDetail(code=code, details=details),
        )
