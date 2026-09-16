import uuid
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException, ValidationException
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.institution import Institution
from app.models.user import User
from app.schemas.certificate import CertificateResponse, CertificateVerifyResponse


class CertificateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def issue_certificate(
        self,
        course_id: UUID,
        user_id: UUID,
    ) -> CertificateResponse:
        # 1. Course check
        course_res = await self.db.execute(select(Course).where(Course.id == course_id))
        course = course_res.scalars().first()
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        if not getattr(course, "certificate_enabled", True):
            raise ValidationException(
                message="Certificates are not enabled for this course.",
                error_code="CERTIFICATES_DISABLED",
            )

        # 2. Enrollment completion check
        enr_res = await self.db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id,
            )
        )
        enr = enr_res.scalars().first()
        if not enr or enr.status != EnrollmentStatus.COMPLETED:
            raise ForbiddenException(
                message="You must complete all lessons and quizzes to receive a certificate.",
                error_code="COURSE_NOT_COMPLETED",
            )

        # 3. Check existing certificate
        existing_res = await self.db.execute(
            select(Certificate).where(
                Certificate.course_id == course_id,
                Certificate.user_id == user_id,
            )
        )
        existing = existing_res.scalars().first()
        if existing:
            return CertificateResponse(
                id=existing.id,
                certificate_number=existing.certificate_number,
                user_id=existing.user_id,
                course_id=existing.course_id,
                institution_id=existing.institution_id,
                recipient_name=existing.recipient_name,
                course_title=existing.course_title,
                issued_at=existing.issued_at,
                verification_url=existing.verification_url,
                pdf_url=f"/api/v1/certificates/{existing.certificate_number}/download",
            )

        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user = user_res.scalars().first()
        recipient_name = user.name if user else "Learner"

        year = datetime.now(timezone.utc).year
        cert_num = f"LX-{year}-{uuid.uuid4().hex[:8].upper()}"
        base_url = settings.CERTIFICATE_BASE_URL.rstrip("/") if settings.CERTIFICATE_BASE_URL else "http://localhost:3000/cert"
        verify_url = f"{base_url}/{cert_num}"

        cert = Certificate(
            certificate_number=cert_num,
            user_id=user_id,
            course_id=course_id,
            institution_id=course.institution_id,
            recipient_name=recipient_name,
            course_title=course.title,
            verification_url=verify_url,
        )
        self.db.add(cert)
        await self.db.flush()
        await self.db.refresh(cert)

        return CertificateResponse(
            id=cert.id,
            certificate_number=cert.certificate_number,
            user_id=cert.user_id,
            course_id=cert.course_id,
            institution_id=cert.institution_id,
            recipient_name=cert.recipient_name,
            course_title=cert.course_title,
            issued_at=cert.issued_at,
            verification_url=cert.verification_url,
            pdf_url=f"/api/v1/certificates/{cert.certificate_number}/download",
        )

    async def list_user_certificates(self, user_id: UUID) -> List[CertificateResponse]:
        res = await self.db.execute(
            select(Certificate)
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
        )
        certs = list(res.scalars().all())
        return [
            CertificateResponse(
                id=c.id,
                certificate_number=c.certificate_number,
                user_id=c.user_id,
                course_id=c.course_id,
                institution_id=c.institution_id,
                recipient_name=c.recipient_name,
                course_title=c.course_title,
                issued_at=c.issued_at,
                verification_url=c.verification_url,
                pdf_url=f"/api/v1/certificates/{c.certificate_number}/download",
            )
            for c in certs
        ]

    async def verify_certificate(self, certificate_number: str) -> CertificateVerifyResponse:
        res = await self.db.execute(
            select(Certificate, Institution)
            .join(Institution, Certificate.institution_id == Institution.id)
            .where(Certificate.certificate_number == certificate_number.strip().upper())
        )
        row = res.first()
        if not row:
            raise NotFoundException(
                message="Certificate not found or invalid",
                error_code="INVALID_CERTIFICATE",
            )
        cert, inst = row
        return CertificateVerifyResponse(
            valid=True,
            certificate_number=cert.certificate_number,
            recipient_name=cert.recipient_name,
            course_title=cert.course_title,
            institution_name=inst.name,
            issued_at=cert.issued_at,
        )
