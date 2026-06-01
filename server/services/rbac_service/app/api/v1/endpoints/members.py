from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse
import uuid

from app.dependencies.db import get_db
from app.schemas.responses import InstitutionMemberResponse
from app.services.member_service import MemberService

router = APIRouter()


@router.post("/initial-owner/{institution_id}", response_model=APIResponse[InstitutionMemberResponse])
async def setup_initial_owner(
    institution_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = MemberService(db)
    member = await service.add_initial_owner(user_id, institution_id)
    return APIResponse(
        success=True,
        message="Initial owner assigned successfully",
        data=InstitutionMemberResponse(
            id=member.id,
            institution_id=member.institution_id,
            user_id=member.user_id,
            role_id=member.role_id,
            status=member.status.value,
            is_owner=member.is_owner,
            created_at=member.created_at
        )
    )
