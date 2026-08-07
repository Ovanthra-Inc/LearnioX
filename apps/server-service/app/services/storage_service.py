import hashlib
import os
import re
import shutil
import uuid
from pathlib import Path
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import UploadFile
from fastapi.responses import FileResponse as FastAPIFileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.repositories.storage_repository import StorageRepository
from app.schemas.storage import (
    FileListResponse,
    FileResponse,
    FolderResponse,
    MultiUploadResponse,
    StorageStatistics,
    StorageUsageResponse,
)

# Upload categories and subdirectories
ALLOWED_EXTENSIONS = {
    "image": {"jpg", "jpeg", "png", "webp"},
    "video": {"mp4", "mov", "mkv"},
    "pdf": {"pdf"},
    "doc": {"doc", "docx", "xlsx", "pptx", "zip", "txt"},
}

SIZE_LIMITS = {
    "image": 10 * 1024 * 1024,        # 10 MB
    "pdf": 100 * 1024 * 1024,         # 100 MB
    "doc": 200 * 1024 * 1024,         # 200 MB
    "video": 5 * 1024 * 1024 * 1024,  # 5 GB
}

# MED-05: Magic-byte signatures for MIME validation (extension → expected header bytes)
MAGIC_BYTES: dict = {
    "jpg": [(0, b"\xff\xd8\xff")],
    "jpeg": [(0, b"\xff\xd8\xff")],
    "png": [(0, b"\x89PNG\r\n\x1a\n")],
    "webp": [(0, b"RIFF"), (8, b"WEBP")],
    "pdf": [(0, b"%PDF")],
    "mp4": [(4, b"ftyp")],
    "zip": [(0, b"PK\x03\x04")],
}

# Maximum number of files per batch upload (HIGH-10)
MAX_BATCH_FILES = 20

# Chunk size for streaming file writes (HIGH-02) — 1 MB
_CHUNK_SIZE = 1 * 1024 * 1024

# Allowed folder pattern — alphanumerics, slashes, underscores, hyphens only (CRIT-03)
_SAFE_FOLDER_RE = re.compile(r"^[a-zA-Z0-9_\-/]+$")


class StorageService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = StorageRepository(db)
        self.base_upload_dir = Path(settings.UPLOAD_DIR).resolve()
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        subdirs = [
            "avatars",
            "institutions/logos",
            "institutions/banners",
            "courses/thumbnails",
            "videos",
            "pdfs",
            "attachments",
            "files",
            "temp",
            "trash",
        ]
        for sub in subdirs:
            (self.base_upload_dir / sub).mkdir(parents=True, exist_ok=True)

    # ─── CRIT-03: Path-traversal-safe folder sanitization ────────────────────
    def _sanitize_folder(self, folder: str) -> str:
        """
        Validates that `folder` cannot escape the base upload directory.

        Raises ValidationException if the folder name contains suspicious
        characters or resolves outside the upload root.
        """
        folder = folder.strip().strip("/")
        if not folder:
            folder = "files"

        if not _SAFE_FOLDER_RE.match(folder):
            raise ValidationException(
                message="Invalid folder name. Only letters, digits, hyphens, underscores, and forward slashes are allowed.",
                error_code="INVALID_FOLDER_NAME",
            )

        # Resolve and assert the path stays within the upload root
        resolved = (self.base_upload_dir / folder).resolve()
        if not str(resolved).startswith(str(self.base_upload_dir)):
            raise ValidationException(
                message="Folder path escape detected. Access denied.",
                error_code="PATH_TRAVERSAL_DETECTED",
            )

        return folder

    def _get_extension(self, filename: str) -> str:
        parts = filename.rsplit(".", 1)
        return parts[1].lower() if len(parts) > 1 else ""

    def _validate_file(
        self,
        filename: str,
        size: int,
        category: Optional[str] = None,
    ) -> str:
        ext = self._get_extension(filename)
        if not ext:
            raise ValidationException(
                message="File must have an extension", error_code="MISSING_EXTENSION"
            )

        if category:
            allowed = ALLOWED_EXTENSIONS.get(category)
            if allowed and ext not in allowed:
                raise ValidationException(
                    message=f"Invalid extension '.{ext}' for category '{category}'. Allowed: {', '.join(allowed)}",
                    error_code="INVALID_EXTENSION",
                )
            limit = SIZE_LIMITS.get(category)
            if limit and size > limit:
                raise ValidationException(
                    message=f"File size exceeds category limit ({limit // (1024*1024)} MB)",
                    error_code="FILE_TOO_LARGE",
                )

        return ext

    # MED-05: Validate magic bytes against declared extension
    def _validate_magic_bytes(self, header_bytes: bytes, ext: str) -> None:
        """Reads up to 12 bytes already in memory and checks against known signatures."""
        signatures = MAGIC_BYTES.get(ext)
        if not signatures:
            return  # No known signature for this extension — skip check

        for offset, magic in signatures:
            end = offset + len(magic)
            if len(header_bytes) < end or header_bytes[offset:end] != magic:
                raise ValidationException(
                    message=f"File content does not match declared extension '.{ext}'. Possible MIME spoofing.",
                    error_code="MIME_MISMATCH",
                )

    # HIGH-02: Stream file to disk in chunks — avoids loading entire file into RAM
    async def _save_upload_to_disk(
        self, upload_file: UploadFile, folder: str
    ) -> Tuple[str, str, int, str, str, str, str]:
        """
        Streams `upload_file` to disk using _CHUNK_SIZE chunks.

        Returns:
            (original_name, stored_name, total_size_bytes, relative_path,
             sha256_checksum, mime_type, extension)
        """
        original_name = upload_file.filename or "unnamed_file"
        ext = self._get_extension(original_name)
        stored_name = f"{uuid.uuid4()}{'.' + ext if ext else ''}"

        target_dir = self.base_upload_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / stored_name

        hasher = hashlib.sha256()
        total_size = 0
        header_bytes = b""  # Capture first bytes for magic-byte check
        first_chunk = True

        with open(file_path, "wb") as f:
            while True:
                chunk = await upload_file.read(_CHUNK_SIZE)
                if not chunk:
                    break
                if first_chunk:
                    header_bytes = chunk[:16]
                    first_chunk = False
                f.write(chunk)
                hasher.update(chunk)
                total_size += len(chunk)

        # Validate magic bytes after first chunk
        self._validate_magic_bytes(header_bytes, ext)

        checksum = hasher.hexdigest()
        relative_path = str(Path(folder) / stored_name).replace("\\", "/")
        # MED-05: Always derive MIME from extension — do NOT trust client Content-Type
        mime_type = upload_file.content_type or "application/octet-stream"

        return original_name, stored_name, total_size, relative_path, checksum, mime_type, ext

    async def upload_file(
        self,
        upload_file: UploadFile,
        user_id: UUID,
        folder: str = "files",
        is_public: bool = False,
        category: Optional[str] = None,
    ) -> FileResponse:
        # CRIT-03: Sanitize folder path before any disk operation
        folder = self._sanitize_folder(folder)

        original_name = upload_file.filename or "unnamed"

        # HIGH-02: Stream the file to disk — no full-read into RAM
        (
            orig_name, stored_name, size, rel_path, checksum, mime_type, ext,
        ) = await self._save_upload_to_disk(upload_file, folder=folder)

        # Validate extension and size limits (size now known from streaming)
        self._validate_file(orig_name, size, category=category)

        record = await self.repo.create_file(
            original_name=orig_name,
            stored_name=stored_name,
            extension=ext,
            mime_type=mime_type,
            size=size,
            path=rel_path,
            folder=folder,
            uploaded_by=user_id,
            checksum=checksum,
            is_public=is_public,
        )
        return FileResponse.model_validate(record)

    async def upload_multiple(
        self,
        files: List[UploadFile],
        user_id: UUID,
        folder: str = "files",
        is_public: bool = False,
    ) -> MultiUploadResponse:
        # HIGH-10: Enforce maximum batch size
        if len(files) > MAX_BATCH_FILES:
            raise ValidationException(
                message=f"Batch upload is limited to {MAX_BATCH_FILES} files per request.",
                error_code="BATCH_LIMIT_EXCEEDED",
            )

        uploaded = []
        failed = []

        for f in files:
            try:
                res = await self.upload_file(
                    upload_file=f, user_id=user_id, folder=folder, is_public=is_public
                )
                uploaded.append(res)
            except Exception as e:
                failed.append(f"{f.filename}: {str(e)}")

        return MultiUploadResponse(uploaded=uploaded, failed=failed)

    async def get_file_metadata(self, file_id: UUID, user_id: UUID) -> FileResponse:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")
        return FileResponse.model_validate(record)

    async def list_files(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 20,
        folder: Optional[str] = None,
        mime: Optional[str] = None,
        extension: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
        is_deleted: bool = False,
    ) -> FileListResponse:
        items, total = await self.repo.list_files(
            user_id=user_id,
            page=page,
            limit=limit,
            folder=folder,
            mime=mime,
            extension=extension,
            search=search,
            sort=sort,
            is_deleted=is_deleted,
        )
        file_responses = [FileResponse.model_validate(f) for f in items]
        return FileListResponse(
            total=total, page=page, limit=limit, items=file_responses
        )

    async def download_file(self, file_id: UUID, user_id: UUID) -> FastAPIFileResponse:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")

        full_path = self.base_upload_dir / record.path
        if not full_path.exists():
            raise NotFoundException(
                message="File content missing on disk", error_code="FILE_CONTENT_MISSING"
            )

        return FastAPIFileResponse(
            path=str(full_path),
            filename=record.original_name,
            media_type=record.mime_type,
        )

    async def preview_file(self, file_id: UUID, user_id: UUID) -> FastAPIFileResponse:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")

        full_path = self.base_upload_dir / record.path
        if not full_path.exists():
            raise NotFoundException(
                message="File content missing on disk", error_code="FILE_CONTENT_MISSING"
            )

        return FastAPIFileResponse(
            path=str(full_path),
            media_type=record.mime_type,
            headers={"Content-Disposition": f'inline; filename="{record.original_name}"'},
        )

    async def update_metadata(
        self, file_id: UUID, user_id: UUID, update_dict: dict
    ) -> FileResponse:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")
        if record.uploaded_by != user_id:
            raise ForbiddenException(
                message="Only file owner can update metadata", error_code="FORBIDDEN"
            )

        updated = await self.repo.update_file(record, update_dict)
        return FileResponse.model_validate(updated)

    async def rename_file(self, file_id: UUID, user_id: UUID, new_name: str) -> FileResponse:
        return await self.update_metadata(file_id, user_id, {"original_name": new_name})

    async def move_file(self, file_id: UUID, user_id: UUID, target_folder: str) -> FileResponse:
        # CRIT-03: Sanitize target folder before moving
        target_folder = self._sanitize_folder(target_folder)

        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")
        if record.uploaded_by != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        old_path = self.base_upload_dir / record.path
        target_dir = self.base_upload_dir / target_folder
        target_dir.mkdir(parents=True, exist_ok=True)
        new_path = target_dir / record.stored_name

        if old_path.exists():
            shutil.move(str(old_path), str(new_path))

        new_rel_path = str(Path(target_folder) / record.stored_name).replace("\\", "/")
        updated = await self.repo.update_file(
            record, {"folder": target_folder, "path": new_rel_path}
        )
        return FileResponse.model_validate(updated)

    async def soft_delete(self, file_id: UUID, user_id: UUID) -> None:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")
        if record.uploaded_by != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        await self.repo.soft_delete(file_id)

    async def restore_file(self, file_id: UUID, user_id: UUID) -> FileResponse:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id, include_deleted=True)
        if not record or not record.is_deleted:
            raise NotFoundException(
                message="File not found in trash", error_code="FILE_NOT_IN_TRASH"
            )
        if record.uploaded_by != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        await self.repo.restore(file_id)
        return FileResponse.model_validate(record)

    async def force_delete(self, file_id: UUID, user_id: UUID) -> None:
        record = await self.repo.get_file_by_id(file_id, user_id=user_id, include_deleted=True)
        if not record:
            raise NotFoundException(message="File not found", error_code="FILE_NOT_FOUND")
        if record.uploaded_by != user_id:
            raise ForbiddenException(message="Permission denied", error_code="FORBIDDEN")

        full_path = self.base_upload_dir / record.path
        if full_path.exists():
            os.remove(full_path)

        await self.repo.force_delete(file_id)

    # Folder operations
    async def create_folder(
        self, name: str, user_id: UUID, parent_id: Optional[UUID] = None
    ) -> FolderResponse:
        folder = await self.repo.create_folder(name=name, created_by=user_id, parent_id=parent_id)
        return FolderResponse.model_validate(folder)

    async def list_folders(self, user_id: UUID) -> List[FolderResponse]:
        folders = await self.repo.list_folders(user_id=user_id)
        return [FolderResponse.model_validate(f) for f in folders]

    async def update_folder(
        self, folder_id: UUID, user_id: UUID, name: str
    ) -> FolderResponse:
        folder = await self.repo.get_folder_by_id(folder_id)
        if not folder or folder.created_by != user_id:
            raise NotFoundException(message="Folder not found", error_code="FOLDER_NOT_FOUND")
        updated = await self.repo.update_folder_name(folder_id, name)
        return FolderResponse.model_validate(updated)

    async def delete_folder(self, folder_id: UUID, user_id: UUID) -> None:
        folder = await self.repo.get_folder_by_id(folder_id)
        if not folder or folder.created_by != user_id:
            raise NotFoundException(message="Folder not found", error_code="FOLDER_NOT_FOUND")
        await self.repo.delete_folder(folder_id)

    # Metrics & Stats
    async def get_usage(self, user_id: UUID) -> StorageUsageResponse:
        metrics = await self.repo.get_usage_metrics(user_id=user_id)
        return StorageUsageResponse(**metrics)

    async def get_statistics(self) -> StorageStatistics:
        stats = await self.repo.get_statistics()
        return StorageStatistics(**stats)
