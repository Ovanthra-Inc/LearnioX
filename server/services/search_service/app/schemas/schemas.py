from pydantic import BaseModel
from uuid import UUID


class SearchRequest(BaseModel):
    query: str
    entity_type: str | None = None
    category: str | None = None
    page: int = 1
    limit: int = 20


class SearchDocumentUpsertRequest(BaseModel):
    entity_id: UUID
    entity_type: str
    title: str
    description: str | None = None
    institution_id: UUID | None = None
    category: str | None = None
    tags: list[str] = []
    metadata: dict | None = None


class SearchResultResponse(BaseModel):
    entity_id: UUID
    entity_type: str
    title: str
    description: str | None
    category: str | None
    institution_id: UUID | None
    metadata: dict | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultResponse]
    total: int
    page: int
    limit: int


class SuggestionResponse(BaseModel):
    suggestions: list[str]
