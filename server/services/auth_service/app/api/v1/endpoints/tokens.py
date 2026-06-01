from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse
import uuid
from datetime import datetime, timezone

from app.dependencies.db import get_db
from app.schemas.requests import TokenIntrospectRequest
from app.schemas.responses import TokenIntrospectResponse
from app.services.token_service import TokenService
from app.repositories.user_identity_repository import UserIdentityRepository

router = APIRouter()


@router.post("/introspect", response_model=APIResponse[TokenIntrospectResponse])
async def introspect(request: TokenIntrospectRequest, db: AsyncSession = Depends(get_db)):
    payload = TokenService.decode_access_token(request.token)
    if not payload:
        return APIResponse(
            success=True,
            message="Token check complete",
            data=TokenIntrospectResponse(active=False)
        )

    user_id_str = payload.get("sub")
    email = payload.get("email")
    exp = payload.get("exp")

    if not user_id_str:
        return APIResponse(
            success=True,
            message="Token check complete",
            data=TokenIntrospectResponse(active=False)
        )

    user_id = uuid.UUID(user_id_str)
    user_repo = UserIdentityRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or user.status.value != "active":
        return APIResponse(
            success=True,
            message="Token check complete",
            data=TokenIntrospectResponse(active=False)
        )

    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

    return APIResponse(
        success=True,
        message="Token check complete",
        data=TokenIntrospectResponse(
            active=True,
            user_id=user.id,
            email=user.email,
            expires_at=expires_at
        )
    )
