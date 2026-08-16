from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIErrorDetails(BaseModel):
    code: str
    details: List[Any] = Field(default_factory=list)


class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[APIErrorDetails] = None

    @classmethod
    def ok(cls, data: T = None, message: str = "Operation successful") -> "APIResponse[T]":
        return cls(success=True, message=message, data=data, error=None)

    @classmethod
    def fail(
        cls, message: str = "Operation failed", code: str = "ERROR", details: Optional[List[Any]] = None
    ) -> "APIResponse[T]":
        return cls(
            success=False,
            message=message,
            data=None,
            error=APIErrorDetails(code=code, details=details or []),
        )
