"""
Media Service — Cloudflare Stream + R2 asset management.

Video Upload Flow:
  1. POST /media/videos/upload-url  → get Cloudflare Stream one-time upload URL
  2. Frontend uploads directly to CF Stream TUS endpoint
  3. Cloudflare webhook → POST /media/webhooks/cloudflare → update status to READY

Asset (Image/Document) Flow:
  1. POST /media/assets/presign     → get R2 presigned PUT URL
  2. Frontend uploads directly to R2
  3. POST /media/assets/confirm     → mark asset as READY
"""
import uuid
import boto3
import httpx
import logging
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import get_settings
from app.models.media import MediaAsset, AssetType, MediaStatus
from app.dependencies.db import get_db
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

CF_STREAM_BASE = f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/stream"
CF_HEADERS = {"Authorization": f"Bearer {settings.CLOUDFLARE_STREAM_API_TOKEN}"}

# R2 client (boto3 with Cloudflare R2 endpoint)
def _r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


# ── Schemas ───────────────────────────────────────────────────────────────────

class VideoUploadURLRequest(BaseModel):
    owner_id: uuid.UUID
    institution_id: uuid.UUID | None = None
    original_filename: str
    max_duration_seconds: int = 3600  # 1 hour max


class AssetPresignRequest(BaseModel):
    owner_id: uuid.UUID
    institution_id: uuid.UUID | None = None
    asset_type: AssetType
    original_filename: str
    mime_type: str
    is_public: bool = False


class AssetConfirmRequest(BaseModel):
    asset_id: uuid.UUID


class MediaAssetResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    asset_type: str
    status: str
    original_filename: str | None
    file_size_bytes: int | None
    cf_stream_url: str | None
    cf_thumbnail_url: str | None
    duration_seconds: int | None
    public_url: str | None
    is_public: bool
    created_at: datetime


def _mar(a) -> MediaAssetResponse:
    return MediaAssetResponse(
        id=a.id, owner_id=a.owner_id, asset_type=a.asset_type.value, status=a.status.value,
        original_filename=a.original_filename, file_size_bytes=a.file_size_bytes,
        cf_stream_url=a.cf_stream_url, cf_thumbnail_url=a.cf_thumbnail_url,
        duration_seconds=a.duration_seconds, public_url=a.public_url,
        is_public=a.is_public, created_at=a.created_at,
    )


# ── Video Upload (Cloudflare Stream) ─────────────────────────────────────────

@router.post("/media/videos/upload-url", response_model=APIResponse[dict], status_code=201)
async def get_video_upload_url(request: VideoUploadURLRequest, db: AsyncSession = Depends(get_db)):
    """Returns a Cloudflare Stream one-time TUS upload URL."""
    if not settings.CLOUDFLARE_STREAM_API_TOKEN:
        raise HTTPException(status_code=503, detail="Cloudflare Stream not configured")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{CF_STREAM_BASE}/live_inputs",
                headers=CF_HEADERS,
                json={
                    "meta": {"name": request.original_filename},
                    "recording": {"mode": "automatic"},
                },
            )
            if resp.status_code not in (200, 201):
                # Fallback to direct upload
                resp = await client.post(
                    CF_STREAM_BASE,
                    headers={**CF_HEADERS, "Tus-Resumable": "1.0.0", "Upload-Length": "0"},
                )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cloudflare API error: {e}")

    cf_uid = resp.json().get("result", {}).get("uid", "")

    asset = MediaAsset(
        owner_id=request.owner_id, institution_id=request.institution_id,
        asset_type=AssetType.VIDEO, status=MediaStatus.UPLOADING,
        original_filename=request.original_filename, cf_stream_uid=cf_uid,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    upload_url = resp.headers.get("Location", "") or f"{CF_STREAM_BASE}/{cf_uid}"

    return APIResponse(success=True, message="Upload URL generated", data={
        "asset_id": str(asset.id),
        "upload_url": upload_url,
        "cf_stream_uid": cf_uid,
    })


# ── Asset Presign (R2) ────────────────────────────────────────────────────────

@router.post("/media/assets/presign", response_model=APIResponse[dict], status_code=201)
async def presign_asset_upload(request: AssetPresignRequest, db: AsyncSession = Depends(get_db)):
    """Returns a presigned R2 PUT URL for direct frontend upload."""
    if not settings.R2_ACCESS_KEY_ID:
        raise HTTPException(status_code=503, detail="R2 storage not configured")

    asset = MediaAsset(
        owner_id=request.owner_id, institution_id=request.institution_id,
        asset_type=request.asset_type, status=MediaStatus.UPLOADING,
        original_filename=request.original_filename, mime_type=request.mime_type,
        is_public=request.is_public,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    r2_key = f"assets/{request.asset_type.value}/{asset.id}/{request.original_filename}"
    asset.r2_key = r2_key

    try:
        s3 = _r2_client()
        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.R2_BUCKET_NAME,
                "Key": r2_key,
                "ContentType": request.mime_type,
            },
            ExpiresIn=3600,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"R2 presign error: {e}")

    public_url = f"{settings.R2_PUBLIC_URL}/{r2_key}" if request.is_public else None
    asset.public_url = public_url
    await db.commit()

    return APIResponse(success=True, message="Presigned URL generated", data={
        "asset_id": str(asset.id),
        "upload_url": presigned_url,
        "r2_key": r2_key,
        "public_url": public_url,
    })


@router.post("/media/assets/confirm", response_model=APIResponse[MediaAssetResponse])
async def confirm_asset_upload(request: AssetConfirmRequest, db: AsyncSession = Depends(get_db)):
    """Call after successful R2 upload to mark asset as READY."""
    result = await db.execute(select(MediaAsset).where(MediaAsset.id == request.asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.status = MediaStatus.READY
    await db.commit()
    await db.refresh(asset)
    return APIResponse(success=True, message="Asset confirmed", data=_mar(asset))


# ── Cloudflare Webhook ────────────────────────────────────────────────────────

@router.post("/media/webhooks/cloudflare", response_model=APIResponse[dict])
async def cloudflare_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Cloudflare Stream ready/error webhooks."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get("meta", {}).get("name", "")
    cf_uid = payload.get("uid", "")
    stream_status = payload.get("status", {}).get("state", "")

    if cf_uid:
        result = await db.execute(select(MediaAsset).where(MediaAsset.cf_stream_uid == cf_uid))
        asset = result.scalar_one_or_none()
        if asset:
            if stream_status == "ready":
                asset.status = MediaStatus.READY
                asset.cf_stream_url = payload.get("playback", {}).get("hls", "")
                asset.cf_thumbnail_url = payload.get("thumbnail", "")
                asset.duration_seconds = int(payload.get("duration", 0)) or None
            elif stream_status in ("error", "failed"):
                asset.status = MediaStatus.FAILED
            await db.commit()

    return APIResponse(success=True, message="Webhook processed", data={"uid": cf_uid, "state": stream_status})


# ── Asset CRUD ────────────────────────────────────────────────────────────────

@router.get("/media/{asset_id}", response_model=APIResponse[MediaAssetResponse])
async def get_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    return APIResponse(success=True, message="Asset retrieved", data=_mar(a))


@router.delete("/media/{asset_id}", response_model=APIResponse[dict])
async def delete_asset(asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    # Delete from R2 if applicable
    if a.r2_key and settings.R2_ACCESS_KEY_ID:
        try:
            s3 = _r2_client()
            s3.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=a.r2_key)
        except Exception as e:
            logger.warning(f"Failed to delete R2 object {a.r2_key}: {e}")
    # Delete from CF Stream if applicable
    if a.cf_stream_uid and settings.CLOUDFLARE_STREAM_API_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.delete(f"{CF_STREAM_BASE}/{a.cf_stream_uid}", headers=CF_HEADERS)
        except Exception as e:
            logger.warning(f"Failed to delete CF Stream video {a.cf_stream_uid}: {e}")
    a.status = MediaStatus.DELETED
    await db.commit()
    return APIResponse(success=True, message="Asset deleted", data={})


@router.get("/media/owner/{owner_id}", response_model=PaginatedResponse[MediaAssetResponse])
async def list_owner_assets(
    owner_id: uuid.UUID,
    asset_type: AssetType | None = Query(None),
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import and_
    filters = [MediaAsset.owner_id == owner_id, MediaAsset.status != MediaStatus.DELETED]
    if asset_type:
        filters.append(MediaAsset.asset_type == asset_type)
    total_res = await db.execute(select(func.count(MediaAsset.id)).where(and_(*filters)))
    total = total_res.scalar_one()
    result = await db.execute(
        select(MediaAsset).where(and_(*filters))
        .order_by(MediaAsset.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Assets retrieved",
        data=[_mar(a) for a in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
