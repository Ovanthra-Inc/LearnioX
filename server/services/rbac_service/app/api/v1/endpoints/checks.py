from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse

from app.dependencies.db import get_db
from app.schemas.requests import PermissionCheckRequest, BulkPermissionCheckRequest
from app.schemas.responses import PermissionCheckResponse, BulkPermissionCheckResponse
from app.services.permission_service import PermissionService

router = APIRouter()


@router.post("/check", response_model=APIResponse[PermissionCheckResponse])
async def check_permission(request: PermissionCheckRequest, db: AsyncSession = Depends(get_db)):
    service = PermissionService(db)
    allowed = await service.check_permission(request.user_id, request.institution_id, request.permission)
    return APIResponse(
        success=True,
        message="Permission check completed",
        data=PermissionCheckResponse(
            allowed=allowed,
            user_id=request.user_id,
            institution_id=request.institution_id,
            permission=request.permission
        )
    )


@router.post("/bulk-check", response_model=APIResponse[BulkPermissionCheckResponse])
async def bulk_check_permissions(request: BulkPermissionCheckRequest, db: AsyncSession = Depends(get_db)):
    service = PermissionService(db)
    results = await service.check_bulk_permissions(request.user_id, request.institution_id, request.permissions)
    return APIResponse(
        success=True,
        message="Bulk permission check completed",
        data=BulkPermissionCheckResponse(
            user_id=request.user_id,
            institution_id=request.institution_id,
            results=results
        )
    )
