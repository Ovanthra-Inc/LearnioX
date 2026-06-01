import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.admin_action import AdminAction
from learniox_common.schemas import APIResponse

router = APIRouter()


def get_admin(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


class AdminActionRequest(BaseModel):
    action: str
    target_type: str
    target_id: str | None = None
    reason: str | None = None
    metadata: dict | None = None


class AdminActionResponse(BaseModel):
    id: UUID; admin_user_id: UUID; action: str; target_type: str
    target_id: str | None; reason: str | None; created_at: datetime


def _ar(a) -> AdminActionResponse:
    return AdminActionResponse(id=a.id, admin_user_id=a.admin_user_id, action=a.action,
                               target_type=a.target_type, target_id=a.target_id,
                               reason=a.reason, created_at=a.created_at)


@router.post("/admin/actions", response_model=APIResponse[AdminActionResponse])
async def record_admin_action(
    request: AdminActionRequest, admin_id: uuid.UUID = Depends(get_admin), db: AsyncSession = Depends(get_db),
):
    a = AdminAction(admin_user_id=admin_id, action=request.action, target_type=request.target_type,
                    target_id=request.target_id, reason=request.reason, metadata_json=request.metadata)
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return APIResponse(success=True, message="Action recorded", data=_ar(a))


@router.get("/admin/actions", response_model=APIResponse[list[AdminActionResponse]])
async def list_admin_actions(
    target_type: str | None = Query(None),
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AdminAction)
    if target_type:
        stmt = stmt.where(AdminAction.target_type == target_type)
    stmt = stmt.order_by(AdminAction.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    return APIResponse(success=True, message="Admin actions retrieved", data=[_ar(a) for a in result.scalars().all()])


@router.post("/admin/suspend-user", response_model=APIResponse[dict])
async def suspend_user(
    user_id: UUID = Query(...), reason: str | None = Query(None),
    admin_id: uuid.UUID = Depends(get_admin), db: AsyncSession = Depends(get_db),
):
    a = AdminAction(admin_user_id=admin_id, action="suspend_user", target_type="user",
                    target_id=str(user_id), reason=reason)
    db.add(a)
    await db.commit()
    return APIResponse(success=True, message=f"User {user_id} suspended", data={"user_id": str(user_id)})


@router.post("/admin/feature-course", response_model=APIResponse[dict])
async def feature_course(
    course_id: UUID = Query(...),
    admin_id: uuid.UUID = Depends(get_admin), db: AsyncSession = Depends(get_db),
):
    a = AdminAction(admin_user_id=admin_id, action="feature_course", target_type="course", target_id=str(course_id))
    db.add(a)
    await db.commit()
    return APIResponse(success=True, message=f"Course {course_id} featured", data={"course_id": str(course_id)})


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
