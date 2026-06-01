import uuid
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.search_document import SearchDocument


class SearchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert(self, entity_id: uuid.UUID, entity_type: str, title: str,
                     description: str | None, institution_id: uuid.UUID | None,
                     category: str | None, tags: list[str], metadata: dict | None) -> SearchDocument:
        result = await self.db.execute(
            select(SearchDocument).where(
                and_(SearchDocument.entity_id == entity_id, SearchDocument.entity_type == entity_type)
            )
        )
        doc = result.scalar_one_or_none()
        searchable = " ".join(filter(None, [title, description, category] + tags))
        if doc:
            doc.title = title
            doc.description = description
            doc.institution_id = institution_id
            doc.category = category
            doc.tags = {"values": tags}
            doc.searchable_text = searchable
            doc.metadata_json = metadata
        else:
            doc = SearchDocument(
                entity_id=entity_id, entity_type=entity_type, title=title,
                description=description, institution_id=institution_id, category=category,
                tags={"values": tags}, searchable_text=searchable, metadata_json=metadata,
            )
            self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def search(self, query: str, entity_type: str | None = None,
                     category: str | None = None, page: int = 1, limit: int = 20) -> tuple[list[SearchDocument], int]:
        from sqlalchemy import func
        stmt = select(SearchDocument).where(SearchDocument.searchable_text.ilike(f"%{query}%"))
        count_stmt = select(func.count(SearchDocument.id)).where(SearchDocument.searchable_text.ilike(f"%{query}%"))
        if entity_type:
            stmt = stmt.where(SearchDocument.entity_type == entity_type)
            count_stmt = count_stmt.where(SearchDocument.entity_type == entity_type)
        if category:
            stmt = stmt.where(SearchDocument.category == category)
            count_stmt = count_stmt.where(SearchDocument.category == category)
        total = (await self.db.execute(count_stmt)).scalar() or 0
        offset = (page - 1) * limit
        result = await self.db.execute(stmt.offset(offset).limit(limit))
        return list(result.scalars().all()), total

    async def delete(self, entity_id: uuid.UUID, entity_type: str) -> bool:
        result = await self.db.execute(
            select(SearchDocument).where(
                and_(SearchDocument.entity_id == entity_id, SearchDocument.entity_type == entity_type)
            )
        )
        doc = result.scalar_one_or_none()
        if doc:
            await self.db.delete(doc)
            await self.db.commit()
            return True
        return False
