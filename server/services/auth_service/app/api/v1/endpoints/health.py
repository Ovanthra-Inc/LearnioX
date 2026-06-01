from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies.db import get_db
from learniox_common.schemas import APIResponse

router = APIRouter()


@router.get("", response_model=APIResponse[dict])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Check database connection
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return APIResponse(
        success=db_status == "connected",
        message="Service health check",
        data={
            "status": "healthy" if db_status == "connected" else "unhealthy",
            "database": db_status,
        }
    )
