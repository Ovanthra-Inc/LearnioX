from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class EnrollmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    institution_id: UUID
    source: str
    status: str
    payment_id: UUID | None
    subscription_id: UUID | None
    expires_at: datetime | None
    created_at: datetime


class AccessCheckResponse(BaseModel):
    allowed: bool
    reason: str | None = None
    access_type: str | None = None
    enrollment_id: UUID | None = None


class BulkAccessCheckResponse(BaseModel):
    user_id: UUID
    courses: dict[str, bool]
    lessons: dict[str, bool]
