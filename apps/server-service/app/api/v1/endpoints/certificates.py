from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status

from app.api.deps import get_certificate_service, get_current_active_user
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.certificate import CertificateResponse, CertificateVerifyResponse
from app.services.certificate_service import CertificateService

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.post(
    "/courses/{course_id}/claim",
    response_model=APIResponse[CertificateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Claim Completion Certificate for Course",
)
async def claim_certificate(
    course_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CertificateService = Depends(get_certificate_service),
):
    result = await service.issue_certificate(
        course_id=course_id,
        user_id=current_user.id,
    )
    return APIResponse.ok(data=result, message="Certificate claimed successfully")


@router.get(
    "/me",
    response_model=APIResponse[List[CertificateResponse]],
    summary="List Logged-in User's Certificates",
)
async def list_my_certificates(
    current_user: User = Depends(get_current_active_user),
    service: CertificateService = Depends(get_certificate_service),
):
    result = await service.list_user_certificates(user_id=current_user.id)
    return APIResponse.ok(data=result, message="Certificates retrieved")


@router.get(
    "/verify/{certificate_number}",
    response_model=APIResponse[CertificateVerifyResponse],
    summary="Public Certificate Verification",
)
async def verify_certificate(
    certificate_number: str,
    service: CertificateService = Depends(get_certificate_service),
):
    result = await service.verify_certificate(certificate_number=certificate_number)
    return APIResponse.ok(data=result, message="Certificate is valid")
