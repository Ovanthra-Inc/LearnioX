from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    original_name: str
    # LOW-03: 'path' and 'stored_name' removed — these are internal server fields
    # that should not be exposed to clients.
    mime_type: str
    extension: str
    size: int
    folder: str
    uploaded_by: UUID
    is_public: bool
    created_at: datetime


class MultiUploadResponse(BaseModel):
    uploaded: List[FileResponse]
    failed: List[str]


class FileListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[FileResponse]


class UpdateFileRequest(BaseModel):
    # MED-08: Added max_length constraints to prevent oversized inputs
    original_name: Optional[str] = Field(None, max_length=255)
    folder: Optional[str] = Field(None, max_length=255)
    is_public: Optional[bool] = None


class RenameRequest(BaseModel):
    new_name: str = Field(..., min_length=1, max_length=255, description="New original filename")


FileRenameRequest = RenameRequest


class MoveFileRequest(BaseModel):
    folder: str = Field(..., max_length=255, description="Target folder path or category")


FileMoveRequest = MoveFileRequest


class FolderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Folder name")
    parent_id: Optional[UUID] = Field(None, description="Parent folder UUID")


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    parent_id: Optional[UUID] = None
    created_at: datetime


class StorageUsageResponse(BaseModel):
    used_bytes: int
    total_files: int
    images: int
    videos: int
    pdfs: int
    other: int


class StorageStatistics(BaseModel):
    uploads_today: int
    uploads_week: int
    uploads_month: int
    deleted_files: int
    storage_used: int
