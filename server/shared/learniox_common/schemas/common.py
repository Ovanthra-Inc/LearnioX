from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIError(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request successful"
    data: Optional[T] = None
    error: Optional[APIError] = None


class PaginationMeta(BaseModel):
    page: int = 1
    limit: int = 20
    total: int = 0
    total_pages: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request successful"
    data: list[T]
    meta: PaginationMeta


class EmptyResponse(BaseModel):
    success: bool = True
    message: str
