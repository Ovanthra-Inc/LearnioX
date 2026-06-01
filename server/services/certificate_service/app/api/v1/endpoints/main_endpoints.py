import uuid
import secrets
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.dependencies.db import get_db
from app.models.certificate import Certificate, CertificateTemplate
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateCertificateRequest(BaseModel):
    user_id: uuid.UUID
    course_id: uuid.UUID
    institution_id: uuid.UUID
    template_id: uuid.UUID | None = None
    certificate_url: str | None = None


class CertificateResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    course_id: uuid.UUID
    institution_id: uuid.UUID
    template_id: uuid.UUID | None = None
    verification_code: str
    certificate_url: str | None = None
    issued_at: datetime | None = None
    created_at: datetime


class VerificationResponse(BaseModel):
    valid: bool
    certificate: CertificateResponse | None = None


class CreateTemplateRequest(BaseModel):
    name: str
    template_json: dict | None = None
    background_asset_id: uuid.UUID | None = None
    is_default: bool = False


class UpdateTemplateRequest(BaseModel):
    name: str | None = None
    template_json: dict | None = None
    background_asset_id: uuid.UUID | None = None
    is_default: bool | None = None


class TemplateResponse(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID | None = None
    name: str
    template_json: dict | None = None
    background_asset_id: uuid.UUID | None = None
    is_default: bool
    created_at: datetime


class CourseCertificateSettingsRequest(BaseModel):
    template_id: uuid.UUID | None = None
    auto_generate: bool = True
    completion_threshold: int = 100  # % completion required


class CourseCertificateSettingsResponse(BaseModel):
    course_id: uuid.UUID
    template_id: uuid.UUID | None = None
    auto_generate: bool
    completion_threshold: int


# ── Serialisers ───────────────────────────────────────────────────────────────

def _cr(c) -> CertificateResponse:
    return CertificateResponse(
        id=c.id, user_id=c.user_id, course_id=c.course_id, institution_id=c.institution_id,
        template_id=c.template_id, verification_code=c.verification_code,
        certificate_url=c.certificate_url, issued_at=c.issued_at, created_at=c.created_at,
    )


def _tr(t) -> TemplateResponse:
    return TemplateResponse(
        id=t.id, institution_id=t.institution_id, name=t.name,
        template_json=t.template_json, background_asset_id=t.background_asset_id,
        is_default=t.is_default, created_at=t.created_at,
    )


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_uid(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


# ── Certificate Templates ─────────────────────────────────────────────────────

@router.post(
    "/institutions/{institution_id}/certificate-templates",
    response_model=APIResponse[TemplateResponse],
    status_code=201,
)
async def create_template(
    institution_id: uuid.UUID,
    request: CreateTemplateRequest,
    db: AsyncSession = Depends(get_db),
):
    template = CertificateTemplate(
        institution_id=institution_id,
        name=request.name,
        template_json=request.template_json,
        background_asset_id=request.background_asset_id,
        is_default=request.is_default,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return APIResponse(success=True, message="Template created", data=_tr(template))


@router.get(
    "/institutions/{institution_id}/certificate-templates",
    response_model=APIResponse[list[TemplateResponse]],
)
async def list_templates(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.institution_id == institution_id)
        .order_by(CertificateTemplate.created_at.desc())
    )
    return APIResponse(success=True, message="Templates retrieved", data=[_tr(t) for t in result.scalars().all()])


@router.get("/certificate-templates/{template_id}", response_model=APIResponse[TemplateResponse])
async def get_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return APIResponse(success=True, message="Template retrieved", data=_tr(t))


@router.patch("/certificate-templates/{template_id}", response_model=APIResponse[TemplateResponse])
async def update_template(
    template_id: uuid.UUID, request: UpdateTemplateRequest, db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if request.name is not None:
        t.name = request.name
    if request.template_json is not None:
        t.template_json = request.template_json
    if request.background_asset_id is not None:
        t.background_asset_id = request.background_asset_id
    if request.is_default is not None:
        t.is_default = request.is_default
    await db.commit()
    await db.refresh(t)
    return APIResponse(success=True, message="Template updated", data=_tr(t))


@router.delete("/certificate-templates/{template_id}", response_model=APIResponse[dict])
async def delete_template(template_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CertificateTemplate).where(CertificateTemplate.id == template_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(t)
    await db.commit()
    return APIResponse(success=True, message="Template deleted", data={})


# ── Course Certificate Settings ───────────────────────────────────────────────
# Lightweight in-memory/cache store for course settings (real implementation would
# have a dedicated CourseCertificateSettings table — left as future migration).

_course_cert_settings: dict[str, dict] = {}


@router.post(
    "/courses/{course_id}/certificate-settings",
    response_model=APIResponse[CourseCertificateSettingsResponse],
)
async def set_course_certificate_settings(
    course_id: uuid.UUID, request: CourseCertificateSettingsRequest, db: AsyncSession = Depends(get_db),
):
    _course_cert_settings[str(course_id)] = {
        "template_id": str(request.template_id) if request.template_id else None,
        "auto_generate": request.auto_generate,
        "completion_threshold": request.completion_threshold,
    }
    return APIResponse(
        success=True, message="Certificate settings saved",
        data=CourseCertificateSettingsResponse(
            course_id=course_id, template_id=request.template_id,
            auto_generate=request.auto_generate, completion_threshold=request.completion_threshold,
        ),
    )


@router.get(
    "/courses/{course_id}/certificate-settings",
    response_model=APIResponse[CourseCertificateSettingsResponse],
)
async def get_course_certificate_settings(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    cfg = _course_cert_settings.get(str(course_id), {"template_id": None, "auto_generate": True, "completion_threshold": 100})
    tid = uuid.UUID(cfg["template_id"]) if cfg.get("template_id") else None
    return APIResponse(
        success=True, message="Certificate settings retrieved",
        data=CourseCertificateSettingsResponse(
            course_id=course_id, template_id=tid,
            auto_generate=cfg["auto_generate"], completion_threshold=cfg["completion_threshold"],
        ),
    )


# ── Certificate Generation ────────────────────────────────────────────────────

@router.post("/certificates/generate", response_model=APIResponse[CertificateResponse])
async def generate_certificate(request: GenerateCertificateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Certificate).where(
            and_(Certificate.user_id == request.user_id, Certificate.course_id == request.course_id)
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return APIResponse(success=True, message="Certificate already exists", data=_cr(existing))

    cert = Certificate(
        user_id=request.user_id, course_id=request.course_id,
        institution_id=request.institution_id, template_id=request.template_id,
        certificate_url=request.certificate_url,
        verification_code=secrets.token_urlsafe(32),
        issued_at=datetime.now(timezone.utc),
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return APIResponse(success=True, message="Certificate generated", data=_cr(cert))


# ── User Certificates ─────────────────────────────────────────────────────────

@router.get("/users/me/certificates", response_model=PaginatedResponse[CertificateResponse])
async def list_my_certificates(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(select(func.count(Certificate.id)).where(Certificate.user_id == user_id))
    total = total_result.scalar_one()
    result = await db.execute(
        select(Certificate).where(Certificate.user_id == user_id)
        .order_by(Certificate.issued_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Certificates retrieved",
        data=[_cr(c) for c in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/certificates/users/{user_id}", response_model=APIResponse[list[CertificateResponse]])
async def list_user_certificates(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Internal endpoint — list certificates by user_id (for admin/institution use)."""
    result = await db.execute(
        select(Certificate).where(Certificate.user_id == user_id).order_by(Certificate.issued_at.desc())
    )
    return APIResponse(success=True, message="Certificates retrieved", data=[_cr(c) for c in result.scalars().all()])


@router.get("/certificates/{certificate_id}", response_model=APIResponse[CertificateResponse])
async def get_certificate(certificate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == certificate_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return APIResponse(success=True, message="Certificate retrieved", data=_cr(cert))


@router.get("/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Redirect to the certificate file URL (e.g. R2/S3 signed URL)."""
    result = await db.execute(select(Certificate).where(Certificate.id == certificate_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not cert.certificate_url:
        raise HTTPException(status_code=404, detail="Certificate file not available yet")
    return RedirectResponse(url=cert.certificate_url)


# ── Public Verification ───────────────────────────────────────────────────────

@router.get("/certificates/verify/{verification_code}", response_model=APIResponse[VerificationResponse])
async def verify_certificate(verification_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.verification_code == verification_code))
    cert = result.scalar_one_or_none()
    return APIResponse(
        success=True, message="Verification complete",
        data=VerificationResponse(valid=cert is not None, certificate=_cr(cert) if cert else None),
    )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
