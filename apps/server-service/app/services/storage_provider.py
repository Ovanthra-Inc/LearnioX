"""
LearnioX Storage Provider Abstraction
-------------------------------------
Pluggable storage backend supporting:
- Local disk storage (development default)
- Cloudflare R2 / AWS S3 (production-grade cloud object storage)

Set STORAGE_PROVIDER in .env to 'local', 'r2', or 's3'.
"""
import hashlib
import logging
import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from app.core.config import settings
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger("server-service.storage")


class StorageProvider(ABC):
    """Abstract base class for storage providers."""

    @abstractmethod
    async def save_stream(
        self,
        upload_file: Any,
        folder: str,
        stored_name: str,
        chunk_size: int = 1024 * 1024,
    ) -> Tuple[int, str, bytes]:
        """
        Streams file content to the storage target.
        Returns: (total_size, sha256_checksum, header_bytes_for_magic_check)
        """

    @abstractmethod
    async def delete_file(self, relative_path: str) -> bool:
        """Deletes a file from the storage target."""

    @abstractmethod
    def get_public_url(self, relative_path: str) -> str:
        """Returns the public access URL for the given stored file."""

    @abstractmethod
    def get_local_path(self, relative_path: str) -> Optional[Path]:
        """Returns the local filesystem Path if stored locally, or None if remote object."""

    @abstractmethod
    async def get_download_url(
        self, relative_path: str, filename: Optional[str] = None, expires_in: int = 3600
    ) -> Optional[str]:
        """Returns a temporary presigned download URL for remote storage, or None for local disk."""


class LocalStorageProvider(StorageProvider):
    """Local disk storage provider."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = (base_dir or Path(settings.UPLOAD_DIR)).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_stream(
        self,
        upload_file: Any,
        folder: str,
        stored_name: str,
        chunk_size: int = 1024 * 1024,
    ) -> Tuple[int, str, bytes]:
        target_dir = self.base_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / stored_name

        hasher = hashlib.sha256()
        total_size = 0
        header_bytes = b""
        first_chunk = True

        with open(file_path, "wb") as f:
            while True:
                chunk = await upload_file.read(chunk_size)
                if not chunk:
                    break
                if first_chunk:
                    header_bytes = chunk[:16]
                    first_chunk = False
                f.write(chunk)
                hasher.update(chunk)
                total_size += len(chunk)

        return total_size, hasher.hexdigest(), header_bytes

    async def delete_file(self, relative_path: str) -> bool:
        file_path = self.base_dir / relative_path
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_public_url(self, relative_path: str) -> str:
        norm = relative_path.replace("\\", "/")
        return f"/uploads/{norm}"

    def get_local_path(self, relative_path: str) -> Optional[Path]:
        p = (self.base_dir / relative_path).resolve()
        if not str(p).startswith(str(self.base_dir)):
            return None
        return p

    async def get_download_url(
        self, relative_path: str, filename: Optional[str] = None, expires_in: int = 3600
    ) -> Optional[str]:
        return None


class R2StorageProvider(StorageProvider):
    """
    Cloudflare R2 / AWS S3 compatible storage provider.
    Uploads directly to R2 bucket using S3 API (SigV4).
    """

    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        public_url: str = "",
    ):
        self.account_id = account_id
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key
        self.bucket_name = bucket_name
        self.public_url = public_url.rstrip("/")
        # Cloudflare R2 endpoint format: https://<accountid>.r2.cloudflarestorage.com
        self.endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    async def save_stream(
        self,
        upload_file: Any,
        folder: str,
        stored_name: str,
        chunk_size: int = 1024 * 1024,
    ) -> Tuple[int, str, bytes]:
        try:
            import aioboto3
            session = aioboto3.Session()
            key = f"{folder}/{stored_name}"

            hasher = hashlib.sha256()
            total_size = 0
            header_bytes = b""
            first_chunk = True
            chunks = []

            while True:
                chunk = await upload_file.read(chunk_size)
                if not chunk:
                    break
                if first_chunk:
                    header_bytes = chunk[:16]
                    first_chunk = False
                hasher.update(chunk)
                total_size += len(chunk)
                chunks.append(chunk)

            full_data = b"".join(chunks)

            async with session.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
            ) as s3:
                await s3.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=full_data,
                    ContentType=getattr(upload_file, "content_type", "application/octet-stream"),
                )

            return total_size, hasher.hexdigest(), header_bytes
        except ImportError:
            logger.warning("aioboto3 not installed. Falling back to local disk storage.")
            fallback = LocalStorageProvider()
            return await fallback.save_stream(upload_file, folder, stored_name, chunk_size)

    async def delete_file(self, relative_path: str) -> bool:
        try:
            import aioboto3
            session = aioboto3.Session()
            async with session.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
            ) as s3:
                await s3.delete_object(Bucket=self.bucket_name, Key=relative_path)
            return True
        except Exception as e:
            logger.warning(f"R2 delete failed for {relative_path}: {e}")
            return False

    def get_public_url(self, relative_path: str) -> str:
        if self.public_url:
            return f"{self.public_url}/{relative_path.lstrip('/')}"
        return f"/uploads/{relative_path.lstrip('/')}"

    def get_local_path(self, relative_path: str) -> Optional[Path]:
        return None

    async def get_download_url(
        self, relative_path: str, filename: Optional[str] = None, expires_in: int = 3600
    ) -> Optional[str]:
        try:
            import aioboto3
            session = aioboto3.Session()
            clean_key = relative_path.lstrip("/")
            params: Dict[str, Any] = {"Bucket": self.bucket_name, "Key": clean_key}
            if filename:
                params["ResponseContentDisposition"] = f'inline; filename="{filename}"'

            async with session.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
            ) as s3:
                url = await s3.generate_presigned_url(
                    "get_object",
                    Params=params,
                    ExpiresIn=expires_in,
                )
                return url
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for {relative_path}: {e}")
            if self.public_url:
                return f"{self.public_url}/{relative_path.lstrip('/')}"
            return None


def get_storage_provider() -> StorageProvider:
    """Factory creating configured StorageProvider instance."""
    provider_name = settings.STORAGE_PROVIDER.lower()
    if provider_name in ("r2", "s3"):
        if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
            return R2StorageProvider(
                account_id=settings.R2_ACCOUNT_ID,
                access_key_id=settings.R2_ACCESS_KEY_ID,
                secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                bucket_name=settings.R2_BUCKET_NAME,
                public_url=settings.R2_PUBLIC_URL,
            )
        logger.warning("R2 credentials not fully configured; falling back to LocalStorageProvider.")
    return LocalStorageProvider()
