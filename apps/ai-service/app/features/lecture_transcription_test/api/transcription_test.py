import asyncio
import os
from pathlib import Path
import uuid
import mimetypes
from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from app.core.config import settings
from app.features.lecture_transcription_test.schemas.transcription import (
    TranscriptionJobStatus,
    TranscriptionResultResponse,
    TranscriptionStatusResponse,
    TranscriptionUploadResponse,
)
from app.features.lecture_transcription_test.services.audio_service import audio_service
from app.features.lecture_transcription_test.services.transcription_service import transcription_service
from app.schemas.response import APIResponse

router = APIRouter(prefix="/test/lecture-transcription", tags=["Test — Lecture Transcription"])


@router.post(
    "/upload",
    summary="Upload Lecture Audio/Video for Transcription (Test Feature)",
    response_model=APIResponse[TranscriptionUploadResponse],
    status_code=status.HTTP_200_OK,
)
async def upload_lecture_for_transcription(
    file: UploadFile = File(...),
):
    """
    Accepts an audio or video lecture file (.mp4, .mp3, .wav, .m4a, .webm),
    validates file properties, saves to isolated storage, and kicks off asynchronous transcription.
    """
    filename = file.filename or "uploaded_lecture.mp4"
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # 1. Validate extension & size
    is_valid, err_msg = audio_service.validate_file(filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )

    # 2. Assign unique job ID & save temporary file
    job_id = str(uuid.uuid4())
    ext = Path(filename).suffix.lower()
    target_media_path = audio_service.upload_dir / f"{job_id}{ext}"

    try:
        with open(target_media_path, "wb") as f:
            f.write(file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to save uploaded test media file: {exc}",
        )

    # 3. Register and dispatch background worker
    transcription_service.register_job(job_id)
    asyncio.create_task(
        transcription_service.process_transcription_async(
            job_id=job_id,
            media_path=str(target_media_path),
            original_filename=filename,
        )
    )

    resp = TranscriptionUploadResponse(
        job_id=job_id,
        filename=filename,
        status=TranscriptionJobStatus.QUEUED,
        message="Media uploaded successfully. Transcription started.",
        file_size_bytes=file_size,
    )
    return APIResponse.ok(data=resp, message="Upload successful")


@router.get(
    "/status/{job_id}",
    summary="Get Transcription Job Status & Progress",
    response_model=APIResponse[TranscriptionStatusResponse],
)
async def get_transcription_status(job_id: str):
    """
    Polls the progress and current processing stage of a transcription job.
    """
    job_status = transcription_service.get_job_status(job_id)
    if not job_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transcription job '{job_id}' not found.",
        )
    return APIResponse.ok(data=job_status, message="Job status retrieved")


@router.get(
    "/{job_id}",
    summary="Get Completed Timestamped Lecture Transcript",
    response_model=APIResponse[TranscriptionResultResponse],
)
async def get_transcription_result(job_id: str):
    """
    Retrieves the completed timestamped transcript segments and full text for the job.
    """
    result = transcription_service.get_job_result(job_id)
    if not result:
        # Check if job is still in progress
        status_info = transcription_service.get_job_status(job_id)
        if status_info and status_info.status != TranscriptionJobStatus.COMPLETED:
            return APIResponse.ok(
                data=TranscriptionResultResponse(
                    job_id=job_id,
                    status=status_info.status,
                    filename="",
                    created_at="",
                    error=status_info.error,
                ),
                message=f"Job is currently in stage: {status_info.stage}",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transcription result for job '{job_id}' not found or still processing.",
        )
    return APIResponse.ok(data=result, message="Transcript retrieved successfully")


@router.api_route(
    "/media/{job_id}",
    methods=["GET", "HEAD"],
    summary="Stream Uploaded Video/Audio Media with HTTP 206 Range Support",
)
async def stream_lecture_media(job_id: str, request: Request):
    """
    Streams the uploaded lecture video or audio file with HTTP 206 Partial Content support,
    enabling instant seeking in HTML5 <video> / <audio> players.
    """
    # Locate media file in test_uploads
    matching_files = list(audio_service.upload_dir.glob(f"{job_id}.*"))
    if not matching_files:
        raise HTTPException(status_code=404, detail="Media file not found")

    file_path = matching_files[0]
    file_size = os.path.getsize(file_path)
    mime_type, _ = mimetypes.guess_type(str(file_path))
    mime_type = mime_type or "video/mp4"

    if request.method == "HEAD":
        return Response(
            status_code=200,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": mime_type,
            },
        )

    range_header = request.headers.get("Range") or request.headers.get("range")
    if not range_header:
        return FileResponse(
            path=file_path,
            media_type=mime_type,
            headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)},
        )

    # Parse byte range (e.g. 'bytes=0-1048576')
    try:
        range_value = range_header.strip().split("=")[1]
        start_str, end_str = range_value.split("-")
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
    except Exception:
        start = 0
        end = file_size - 1

    start = max(0, min(start, file_size - 1))
    end = max(start, min(end, file_size - 1))
    content_length = (end - start) + 1

    def iter_file():
        with open(file_path, "rb") as f:
            f.seek(start)
            bytes_left = content_length
            chunk_size = 64 * 1024
            while bytes_left > 0:
                chunk = f.read(min(chunk_size, bytes_left))
                if not chunk:
                    break
                bytes_left -= len(chunk)
                yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": mime_type,
    }
    return StreamingResponse(iter_file(), status_code=206, headers=headers)
