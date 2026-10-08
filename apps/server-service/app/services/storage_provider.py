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
        self,
        relative_path: str,
        filename: Optional[str] = None,
        expires_in: int = 3600,
        disposition: str = "inline",
    ) -> Optional[str]:
        """Returns a temporary presigned download/preview URL or CDN redirect URL."""


class LocalStorageProvider(StorageProvider):
    """Local disk storage provider with Nginx direct offloading."""

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
        norm = relative_path.replace("\\", "/").lstrip("/")
        return f"/uploads/{norm}"

    def get_local_path(self, relative_path: str) -> Optional[Path]:
        p = (self.base_dir / relative_path).resolve()
        if not str(p).startswith(str(self.base_dir)):
            return None
        return p

    async def get_download_url(
        self,
        relative_path: str,
        filename: Optional[str] = None,
        expires_in: int = 3600,
        disposition: str = "inline",
    ) -> Optional[str]:
        """Returns Nginx static alias URL to offload media streaming from Python RAM/IO."""
        norm = relative_path.replace("\\", "/").lstrip("/")
        return f"/uploads/{norm}"


class R2StorageProvider(StorageProvider):
    """
    Cloudflare R2 / AWS S3 compatible storage provider.
    Uploads directly to R2 bucket using S3 API (SigV4) with chunked multipart streaming
    to keep memory usage under 50MB per worker.
    """

    def __init__(
        self,
        account_id: Optional[str] = None,
        access_key_id: str = "",
        secret_access_key: str = "",
        bucket_name: str = "",
        public_url: str = "",
        endpoint_url: Optional[str] = None,
        region_name: Optional[str] = None,
    ):
        self.account_id = account_id
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key
        self.bucket_name = bucket_name
        self.public_url = public_url.rstrip("/")
        self.region_name = region_name or "auto"
        if endpoint_url:
            self.endpoint_url = endpoint_url
        elif account_id:
            self.endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
        else:
            self.endpoint_url = None

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
            key = f"{folder}/{stored_name}".replace("\\", "/")
            mime_type = getattr(upload_file, "content_type", "application/octet-stream") or "application/octet-stream"

            hasher = hashlib.sha256()
            total_size = 0
            header_bytes = b""
            first_chunk = True

            client_kwargs: Dict[str, Any] = {
                "service_name": "s3",
                "aws_access_key_id": self.access_key_id,
                "aws_secret_access_key": self.secret_access_key,
            }
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url
            if self.region_name:
                client_kwargs["region_name"] = self.region_name

            # S3 multipart threshold is 5MB. We accumulate chunks up to 5MB buffer.
            # Memory per upload worker remains strictly bounded (<10MB).
            part_threshold = 5 * 1024 * 1024
            buffer = bytearray()
            upload_id: Optional[str] = None
            parts: List[Dict[str, Any]] = []
            part_number = 1

            async with session.client(**client_kwargs) as s3:
                try:
                    while True:
                        chunk = await upload_file.read(chunk_size)
                        if not chunk:
                            break

                        if first_chunk:
                            header_bytes = chunk[:16]
                            first_chunk = False

                        hasher.update(chunk)
                        total_size += len(chunk)
                        buffer.extend(chunk)

                        # If buffer exceeds 5MB threshold and we haven't hit EOF yet,
                        # stream it as an S3 multipart part.
                        if len(buffer) >= part_threshold:
                            if upload_id is None:
                                mp = await s3.create_multipart_upload(
                                    Bucket=self.bucket_name,
                                    Key=key,
                                    ContentType=mime_type,
                                )
                                upload_id = mp["UploadId"]

                            part_res = await s3.upload_part(
                                Bucket=self.bucket_name,
                                Key=key,
                                UploadId=upload_id,
                                PartNumber=part_number,
                                Body=bytes(buffer),
                            )
                            parts.append({"PartNumber": part_number, "ETag": part_res["ETag"]})
                            part_number += 1
                            buffer.clear()

                    # Final chunk handling:
                    if upload_id is None:
                        # File was smaller than part_threshold (< 5MB) - single put_object
                        await s3.put_object(
                            Bucket=self.bucket_name,
                            Key=key,
                            Body=bytes(buffer),
                            ContentType=mime_type,
                        )
                    else:
                        # Upload final remaining part if any bytes left
                        if len(buffer) > 0:
                            part_res = await s3.upload_part(
                                Bucket=self.bucket_name,
                                Key=key,
                                UploadId=upload_id,
                                PartNumber=part_number,
                                Body=bytes(buffer),
                            )
                            parts.append({"PartNumber": part_number, "ETag": part_res["ETag"]})
                            buffer.clear()

                        await s3.complete_multipart_upload(
                            Bucket=self.bucket_name,
                            Key=key,
                            UploadId=upload_id,
                            MultipartUpload={"Parts": parts},
                        )

                except Exception as upload_err:
                    if upload_id is not None:
                        try:
                            await s3.abort_multipart_upload(
                                Bucket=self.bucket_name,
                                Key=key,
                                UploadId=upload_id,
                            )
                        except Exception:
                            pass
                    raise upload_err

            return total_size, hasher.hexdigest(), header_bytes

        except ImportError:
            logger.warning("aioboto3 not installed. Falling back to local disk storage.")
            fallback = LocalStorageProvider()
            return await fallback.save_stream(upload_file, folder, stored_name, chunk_size)

    async def delete_file(self, relative_path: str) -> bool:
        try:
            import aioboto3

            session = aioboto3.Session()
            client_kwargs: Dict[str, Any] = {
                "service_name": "s3",
                "aws_access_key_id": self.access_key_id,
                "aws_secret_access_key": self.secret_access_key,
            }
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url
            if self.region_name:
                client_kwargs["region_name"] = self.region_name

            async with session.client(**client_kwargs) as s3:
                await s3.delete_object(Bucket=self.bucket_name, Key=relative_path.lstrip("/"))
            return True
        except Exception as e:
            logger.warning(f"R2/S3 delete failed for {relative_path}: {e}")
            return False

    def get_public_url(self, relative_path: str) -> str:
        clean_key = relative_path.replace("\\", "/").lstrip("/")
        if self.public_url:
            return f"{self.public_url}/{clean_key}"
        return f"/uploads/{clean_key}"

    def get_local_path(self, relative_path: str) -> Optional[Path]:
        return None

    async def get_download_url(
        self,
        relative_path: str,
        filename: Optional[str] = None,
        expires_in: int = 3600,
        disposition: str = "inline",
    ) -> Optional[str]:
        """Generates a presigned Cloudflare R2 / AWS S3 GET URL or CDN signed URL."""
        clean_key = relative_path.replace("\\", "/").lstrip("/")
        try:
            import aioboto3

            session = aioboto3.Session()
            params: Dict[str, Any] = {"Bucket": self.bucket_name, "Key": clean_key}
            if filename:
                params["ResponseContentDisposition"] = f'{disposition}; filename="{filename}"'
            else:
                params["ResponseContentDisposition"] = disposition

            client_kwargs: Dict[str, Any] = {
                "service_name": "s3",
                "aws_access_key_id": self.access_key_id,
                "aws_secret_access_key": self.secret_access_key,
            }
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url
            if self.region_name:
                client_kwargs["region_name"] = self.region_name

            async with session.client(**client_kwargs) as s3:
                url = await s3.generate_presigned_url(
                    "get_object",
                    Params=params,
                    ExpiresIn=expires_in,
                )
                return url
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for {relative_path}: {e}")
            if self.public_url:
                return f"{self.public_url}/{clean_key}"
            return None


def get_storage_provider() -> StorageProvider:
    """Factory creating configured StorageProvider instance."""
    provider_name = settings.STORAGE_PROVIDER.lower()
    if provider_name == "r2":
        if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
            return R2StorageProvider(
                account_id=settings.R2_ACCOUNT_ID,
                access_key_id=settings.R2_ACCESS_KEY_ID,
                secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                bucket_name=settings.R2_BUCKET_NAME,
                public_url=settings.R2_PUBLIC_URL,
            )
        logger.warning("R2 credentials not fully configured; falling back to LocalStorageProvider.")
    elif provider_name == "s3":
        if settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY:
            return R2StorageProvider(
                access_key_id=settings.S3_ACCESS_KEY_ID,
                secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                bucket_name=settings.S3_BUCKET_NAME,
                region_name=getattr(settings, "S3_REGION", "ap-south-1"),
                public_url=getattr(settings, "R2_PUBLIC_URL", ""),
            )
        logger.warning("S3 credentials not fully configured; falling back to LocalStorageProvider.")
    return LocalStorageProvider()

