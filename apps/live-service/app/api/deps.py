from typing import Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, status
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.session import get_db
from app.services.classroom_service import ClassroomService


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Optional[UUID]:
    """Extracts verified user ID from gateway header or direct JWT Bearer token."""
    if x_user_id:
        try:
            return UUID(x_user_id)
        except ValueError:
            pass

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            sub = payload.get("sub")
            if sub:
                return UUID(sub)
        except Exception:
            pass

    return None


async def require_user_id(
    user_id: Optional[UUID] = Depends(get_current_user_id),
) -> UUID:
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Authentication required",
                "data": None,
                "error": {"code": "UNAUTHORIZED", "details": ["Missing authentication identity"]},
            },
        )
    return user_id


async def get_classroom_service(
    db: AsyncSession = Depends(get_db),
) -> ClassroomService:
    return ClassroomService(db)
