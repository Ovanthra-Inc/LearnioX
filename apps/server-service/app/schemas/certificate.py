from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    certificate_number: str
    user_id: UUID
    course_id: UUID
    institution_id: UUID
    recipient_name: str
    course_title: str
    issued_at: datetime
    verification_url: str
    pdf_url: Optional[str] = None


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate_number: str
    recipient_name: str
    course_title: str
    institution_name: str
    issued_at: datetime
