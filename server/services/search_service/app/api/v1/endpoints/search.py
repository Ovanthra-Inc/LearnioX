import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.repositories.search_repository import SearchRepository
from app.schemas.schemas import (
    SearchRequest, SearchDocumentUpsertRequest,
    SearchResultResponse, SearchResponse, SuggestionResponse,
)
from learniox_common.schemas import APIResponse

router = APIRouter()


def _to_result(doc) -> SearchResultResponse:
    return SearchResultResponse(
        entity_id=doc.entity_id, entity_type=doc.entity_type,
        title=doc.title, description=doc.description,
        category=doc.category, institution_id=doc.institution_id,
        metadata=doc.metadata_json,
    )


@router.get("/search", response_model=APIResponse[SearchResponse])
async def search(
    q: str = Query(..., min_length=1),
    entity_type: str | None = Query(None),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    repo = SearchRepository(db)
    docs, total = await repo.search(q, entity_type, category, page, limit)
    return APIResponse(
        success=True, message="Search results",
        data=SearchResponse(query=q, results=[_to_result(d) for d in docs], total=total, page=page, limit=limit),
    )


@router.get("/search/suggestions", response_model=APIResponse[SuggestionResponse])
async def suggestions(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    repo = SearchRepository(db)
    docs, _ = await repo.search(q, page=1, limit=5)
    return APIResponse(
        success=True, message="Suggestions",
        data=SuggestionResponse(suggestions=[d.title for d in docs]),
    )


@router.post("/search/index", response_model=APIResponse[dict])
async def index_document(request: SearchDocumentUpsertRequest, db: AsyncSession = Depends(get_db)):
    repo = SearchRepository(db)
    await repo.upsert(
        entity_id=request.entity_id, entity_type=request.entity_type,
        title=request.title, description=request.description,
        institution_id=request.institution_id, category=request.category,
        tags=request.tags, metadata=request.metadata,
    )
    return APIResponse(success=True, message="Document indexed", data={"entity_id": str(request.entity_id)})


@router.delete("/search/index/{entity_type}/{entity_id}", response_model=APIResponse[dict])
async def remove_document(entity_type: str, entity_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = SearchRepository(db)
    deleted = await repo.delete(entity_id, entity_type)
    return APIResponse(success=deleted, message="Document removed" if deleted else "Not found", data={})


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
