from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, update, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import FileRecord
from app.models.folder import FolderRecord


class StorageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_file(
        self,
        original_name: str,
        stored_name: str,
        extension: str,
        mime_type: str,
        size: int,
        path: str,
        folder: str,
        uploaded_by: UUID,
        checksum: Optional[str] = None,
        is_public: bool = False,
    ) -> FileRecord:
        record = FileRecord(
            original_name=original_name,
            stored_name=stored_name,
            extension=extension,
            mime_type=mime_type,
            size=size,
            path=path,
            folder=folder,
            checksum=checksum,
            uploaded_by=uploaded_by,
            is_public=is_public,
            is_deleted=False,
        )
        self.db.add(record)
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def get_file_by_id(
        self, file_id: UUID, user_id: Optional[UUID] = None, include_deleted: bool = False
    ) -> Optional[FileRecord]:
        query = select(FileRecord).where(FileRecord.id == file_id)
        if not include_deleted:
            query = query.where(FileRecord.is_deleted == False)
        if user_id:
            query = query.where(
                (FileRecord.uploaded_by == user_id) | (FileRecord.is_public == True)
            )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_files(
        self,
        user_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20,
        folder: Optional[str] = None,
        mime: Optional[str] = None,
        extension: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
        is_deleted: bool = False,
    ) -> Tuple[List[FileRecord], int]:
        conditions = [FileRecord.is_deleted == is_deleted]
        if user_id:
            conditions.append(
                (FileRecord.uploaded_by == user_id) | (FileRecord.is_public == True)
            )
        if folder:
            conditions.append(FileRecord.folder == folder)
        if mime:
            conditions.append(FileRecord.mime_type.ilike(f"%{mime}%"))
        if extension:
            conditions.append(FileRecord.extension.ilike(extension))
        if search:
            conditions.append(FileRecord.original_name.ilike(f"%{search}%"))

        count_query = select(func.count(FileRecord.id)).where(and_(*conditions))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = select(FileRecord).where(and_(*conditions))
        if sort.lower() == "asc":
            query = query.order_by(FileRecord.created_at.asc())
        else:
            query = query.order_by(FileRecord.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        items = list(result.scalars().all())
        return items, total

    async def update_file(self, file_record: FileRecord, update_dict: dict) -> FileRecord:
        for key, value in update_dict.items():
            if value is not None:
                setattr(file_record, key, value)
        await self.db.flush()
        await self.db.refresh(file_record)
        return file_record

    async def soft_delete(self, file_id: UUID) -> bool:
        file_record = await self.get_file_by_id(file_id, include_deleted=False)
        if not file_record:
            return False
        file_record.is_deleted = True
        file_record.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True

    async def restore(self, file_id: UUID) -> bool:
        file_record = await self.get_file_by_id(file_id, include_deleted=True)
        if not file_record or not file_record.is_deleted:
            return False
        file_record.is_deleted = False
        file_record.deleted_at = None
        await self.db.flush()
        return True

    async def force_delete(self, file_id: UUID) -> Optional[FileRecord]:
        file_record = await self.get_file_by_id(file_id, include_deleted=True)
        if not file_record:
            return None
        await self.db.delete(file_record)
        await self.db.flush()
        return file_record

    # Folder Methods
    async def create_folder(
        self, name: str, created_by: UUID, parent_id: Optional[UUID] = None
    ) -> FolderRecord:
        folder = FolderRecord(name=name, parent_id=parent_id, created_by=created_by)
        self.db.add(folder)
        await self.db.flush()
        await self.db.refresh(folder)
        return folder

    async def get_folder_by_id(self, folder_id: UUID) -> Optional[FolderRecord]:
        result = await self.db.execute(select(FolderRecord).where(FolderRecord.id == folder_id))
        return result.scalars().first()

    async def list_folders(self, user_id: UUID) -> List[FolderRecord]:
        result = await self.db.execute(
            select(FolderRecord).where(FolderRecord.created_by == user_id).order_by(FolderRecord.name.asc())
        )
        return list(result.scalars().all())

    async def update_folder_name(self, folder_id: UUID, new_name: str) -> Optional[FolderRecord]:
        folder = await self.get_folder_by_id(folder_id)
        if not folder:
            return None
        folder.name = new_name
        await self.db.flush()
        await self.db.refresh(folder)
        return folder

    async def delete_folder(self, folder_id: UUID) -> bool:
        folder = await self.get_folder_by_id(folder_id)
        if not folder:
            return False
        await self.db.delete(folder)
        await self.db.flush()
        return True

    # Usage & Statistics
    async def get_usage_metrics(self, user_id: Optional[UUID] = None) -> dict:
        query = select(FileRecord).where(FileRecord.is_deleted == False)
        if user_id:
            query = query.where(FileRecord.uploaded_by == user_id)
        result = await self.db.execute(query)
        files = list(result.scalars().all())

        used_bytes = sum(f.size for f in files)
        total_files = len(files)
        images = sum(1 for f in files if f.mime_type.startswith("image/"))
        videos = sum(1 for f in files if f.mime_type.startswith("video/"))
        pdfs = sum(1 for f in files if f.mime_type == "application/pdf")
        other = total_files - (images + videos + pdfs)

        return {
            "used_bytes": used_bytes,
            "total_files": total_files,
            "images": images,
            "videos": videos,
            "pdfs": pdfs,
            "other": other,
        }

    async def get_statistics(self) -> dict:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)

        # Uploads today
        t_res = await self.db.execute(
            select(func.count(FileRecord.id)).where(FileRecord.created_at >= today_start)
        )
        uploads_today = t_res.scalar_one()

        # Uploads week
        w_res = await self.db.execute(
            select(func.count(FileRecord.id)).where(FileRecord.created_at >= week_start)
        )
        uploads_week = w_res.scalar_one()

        # Uploads month
        m_res = await self.db.execute(
            select(func.count(FileRecord.id)).where(FileRecord.created_at >= month_start)
        )
        uploads_month = m_res.scalar_one()

        # Deleted files
        d_res = await self.db.execute(
            select(func.count(FileRecord.id)).where(FileRecord.is_deleted == True)
        )
        deleted_files = d_res.scalar_one()

        # Storage used
        s_res = await self.db.execute(
            select(func.coalesce(func.sum(FileRecord.size), 0)).where(FileRecord.is_deleted == False)
        )
        storage_used = s_res.scalar_one()

        return {
            "uploads_today": uploads_today,
            "uploads_week": uploads_week,
            "uploads_month": uploads_month,
            "deleted_files": deleted_files,
            "storage_used": storage_used,
        }
