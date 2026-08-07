from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse as FastAPIFileResponse

from app.api.deps import get_current_active_user, get_storage_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.storage import (
    FileListResponse,
    FileMoveRequest,
    FileRenameRequest,
    FileResponse,
    FolderRequest,
    FolderResponse,
    MultiUploadResponse,
    StorageStatistics,
    StorageUsageResponse,
    UpdateFileRequest,
)
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Storage Service"])


@router.post(
    "/upload",
    summary="Universal File Upload Endpoint",
    response_model=APIResponse[FileResponse],
)
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("files"),
    is_public: bool = Form(False),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.upload_file(
        upload_file=file, user_id=current_user.id, folder=folder, is_public=is_public
    )
    return APIResponse.ok(data=result, message="File uploaded successfully")


@router.post(
    "/upload/image",
    summary="Upload Image File (jpg, jpeg, png, webp)",
    response_model=APIResponse[FileResponse],
)
async def upload_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.upload_file(
        upload_file=image,
        user_id=current_user.id,
        folder="images",
        category="image",
    )
    return APIResponse.ok(data=result, message="Image uploaded successfully")


@router.post(
    "/upload/video",
    summary="Upload Video File (mp4, mov, mkv)",
    response_model=APIResponse[FileResponse],
)
async def upload_video(
    video: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.upload_file(
        upload_file=video,
        user_id=current_user.id,
        folder="videos",
        category="video",
    )
    return APIResponse.ok(data=result, message="Video uploaded successfully")


@router.post(
    "/upload/pdf",
    summary="Upload PDF Document",
    response_model=APIResponse[FileResponse],
)
async def upload_pdf(
    pdf: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.upload_file(
        upload_file=pdf,
        user_id=current_user.id,
        folder="pdfs",
        category="pdf",
    )
    return APIResponse.ok(data=result, message="PDF uploaded successfully")


@router.post(
    "/upload/multiple",
    summary="Batch Upload Multiple Files",
    response_model=APIResponse[MultiUploadResponse],
)
async def upload_multiple(
    files: List[UploadFile] = File(...),
    folder: str = Form("files"),
    is_public: bool = Form(False),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.upload_multiple(
        files=files, user_id=current_user.id, folder=folder, is_public=is_public
    )
    return APIResponse.ok(data=result, message="Batch upload processed")


@router.get(
    "/files",
    summary="List Uploaded Files with Filters & Pagination",
    response_model=APIResponse[FileListResponse],
)
async def list_files(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    folder: Optional[str] = Query(None),
    mime: Optional[str] = Query(None),
    extension: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),

    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.list_files(
        user_id=current_user.id,
        page=page,
        limit=limit,
        folder=folder,
        mime=mime,
        extension=extension,
        search=search,
        sort=sort,
        is_deleted=False,
    )
    return APIResponse.ok(data=result, message="Files retrieved successfully")


@router.get(
    "/trash",
    summary="List Soft-Deleted Files in Trash",
    response_model=APIResponse[FileListResponse],
)
async def list_trash(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.list_files(
        user_id=current_user.id,
        page=page,
        limit=limit,
        search=search,
        is_deleted=True,
    )
    return APIResponse.ok(data=result, message="Trash files retrieved successfully")


@router.get(
    "/files/{id}",
    summary="Get File Metadata by ID",
    response_model=APIResponse[FileResponse],
)
async def get_file_metadata(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.get_file_metadata(file_id=id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="File metadata retrieved successfully")


@router.get(
    "/files/{id}/download",
    summary="Download File Binary Stream",
)
async def download_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    return await service.download_file(file_id=id, user_id=current_user.id)


@router.get(
    "/files/{id}/preview",
    summary="Inline File Preview Stream",
)
async def preview_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    return await service.preview_file(file_id=id, user_id=current_user.id)


@router.patch(
    "/files/{id}",
    summary="Update File Metadata",
    response_model=APIResponse[FileResponse],
)
async def update_file(
    id: UUID,
    body: UpdateFileRequest,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.update_metadata(
        file_id=id, user_id=current_user.id, update_dict=body.model_dump(exclude_unset=True)
    )
    return APIResponse.ok(data=result, message="File metadata updated successfully")


@router.patch(
    "/files/{id}/rename",
    summary="Rename File",
    response_model=APIResponse[FileResponse],
)
async def rename_file(
    id: UUID,
    body: FileRenameRequest,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.rename_file(
        file_id=id, user_id=current_user.id, new_name=body.new_name
    )
    return APIResponse.ok(data=result, message="File renamed successfully")


@router.patch(
    "/files/{id}/move",
    summary="Move File to Target Folder",
    response_model=APIResponse[FileResponse],
)
async def move_file(
    id: UUID,
    body: FileMoveRequest,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.move_file(
        file_id=id, user_id=current_user.id, target_folder=body.folder
    )
    return APIResponse.ok(data=result, message="File moved successfully")


@router.delete(
    "/files/{id}",
    summary="Soft Delete File (Move to Trash)",
    response_model=APIResponse[None],
)
async def soft_delete_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    await service.soft_delete(file_id=id, user_id=current_user.id)
    return APIResponse.ok(message="File moved to trash")


@router.delete(
    "/files/{id}/force",
    summary="Permanently Delete File from Disk and DB",
    response_model=APIResponse[None],
)
async def force_delete_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    await service.force_delete(file_id=id, user_id=current_user.id)
    return APIResponse.ok(message="File permanently deleted")


@router.post(
    "/files/{id}/restore",
    summary="Restore File from Trash",
    response_model=APIResponse[FileResponse],
)
async def restore_file(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.restore_file(file_id=id, user_id=current_user.id)
    return APIResponse.ok(data=result, message="File restored from trash")


# Folder Management Endpoints
@router.post(
    "/folders",
    summary="Create Storage Folder",
    response_model=APIResponse[FolderResponse],
)
async def create_folder(
    body: FolderRequest,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.create_folder(
        name=body.name, user_id=current_user.id, parent_id=body.parent_id
    )
    return APIResponse.ok(data=result, message="Folder created successfully")


@router.get(
    "/folders",
    summary="List User Storage Folders",
    response_model=APIResponse[List[FolderResponse]],
)
async def list_folders(
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.list_folders(user_id=current_user.id)
    return APIResponse.ok(data=result, message="Folders retrieved successfully")


@router.patch(
    "/folders/{id}",
    summary="Rename Storage Folder",
    response_model=APIResponse[FolderResponse],
)
async def update_folder(
    id: UUID,
    body: FolderRequest,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.update_folder(
        folder_id=id, user_id=current_user.id, name=body.name
    )
    return APIResponse.ok(data=result, message="Folder updated successfully")


@router.delete(
    "/folders/{id}",
    summary="Delete Storage Folder",
    response_model=APIResponse[None],
)
async def delete_folder(
    id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    await service.delete_folder(folder_id=id, user_id=current_user.id)
    return APIResponse.ok(message="Folder deleted successfully")


# Storage Usage & Statistics Endpoints
@router.get(
    "/usage",
    summary="Get User Storage Usage Metrics",
    response_model=APIResponse[StorageUsageResponse],
)
async def get_storage_usage(
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.get_usage(user_id=current_user.id)
    return APIResponse.ok(data=result, message="Storage usage metrics retrieved")


@router.get(
    "/statistics",
    summary="Get Overall Storage Service Statistics",
    response_model=APIResponse[StorageStatistics],
)
async def get_storage_statistics(
    current_user: User = Depends(get_current_active_user),
    service: StorageService = Depends(get_storage_service),
):
    result = await service.get_statistics()
    return APIResponse.ok(data=result, message="Storage statistics retrieved")
