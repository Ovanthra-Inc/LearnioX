Below is the **service-wise backend contract blueprint** for **LearnioX V1**.

I am giving you:

```text
1. Common backend conventions
2. Shared base models
3. Shared Pydantic response/request patterns
4. Shared settings/config pattern
5. Service-wise:
   - SQLAlchemy models
   - .env variables
   - Pydantic Settings class
   - Request schemas
   - Response schemas
```

This is not MVP thinking. This is your **V1 service contract foundation**.

---

# 0. Common Backend Standard for All Services

Every FastAPI microservice should follow this internal structure:

```text
services/
└── auth_service/
    ├── app/
    │   ├── main.py
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   ├── logging.py
    │   │   └── exceptions.py
    │   ├── db/
    │   │   ├── base.py
    │   │   └── session.py
    │   ├── models/
    │   ├── schemas/
    │   │   ├── requests.py
    │   │   └── responses.py
    │   ├── repositories/
    │   ├── services/
    │   ├── api/
    │   │   └── v1/
    │   │       └── routes.py
    │   └── clients/
    ├── alembic/
    ├── tests/
    ├── .env
    ├── Dockerfile
    └── pyproject.toml
```

---

# 1. Shared SQLAlchemy Base Models

Create this in every service or inside a shared internal package.

```python
# app/db/base.py

import uuid
from datetime import datetime
from sqlalchemy import DateTime, Boolean, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    pass


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
```

---

# 2. Shared API Response Models

Use a consistent response envelope everywhere.

```python
# app/schemas/common.py

from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel


T = TypeVar("T")


class APIError(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None


class APIResponse(GenericModel, Generic[T]):
    success: bool = True
    message: str = "Request successful"
    data: Optional[T] = None
    error: Optional[APIError] = None


class PaginationMeta(BaseModel):
    page: int = 1
    limit: int = 20
    total: int = 0
    total_pages: int = 0


class PaginatedResponse(GenericModel, Generic[T]):
    success: bool = True
    message: str = "Request successful"
    data: list[T]
    meta: PaginationMeta


class EmptyResponse(BaseModel):
    success: bool = True
    message: str
```

---

# 3. Shared Pydantic Settings Pattern

Every service should have a `config.py` like this.

```python
# app/core/config.py

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "learniox-service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str | None = None

    INTERNAL_API_KEY: str
    SERVICE_NAME: str

    LOG_LEVEL: str = "INFO"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    REQUEST_TIMEOUT_SECONDS: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

# 4. Common `.env` Pattern

Every service should have these minimum variables:

```env
APP_NAME=learniox-auth-service
APP_ENV=local
DEBUG=true
SERVICE_NAME=auth_service
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379/0

INTERNAL_API_KEY=dev-internal-secret
LOG_LEVEL=INFO
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
REQUEST_TIMEOUT_SECONDS=30
```

---

# 5. Auth Service

## Responsibility

Owns login, signup, password, sessions, refresh token, OAuth, email verification.

---

## SQLAlchemy Models

```python
# app/models/user_identity.py

import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    GOOGLE = "google"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING_VERIFICATION = "pending_verification"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class UserIdentity(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_identities"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, index=True, nullable=True)

    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)

    provider: Mapped[AuthProvider] = mapped_column(Enum(AuthProvider), default=AuthProvider.EMAIL)
    provider_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION)

    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

```python
# app/models/session.py

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class UserSession(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    refresh_token_hash: Mapped[str] = mapped_column(Text, nullable=False)

    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

```python
# app/models/verification_token.py

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class VerificationPurpose(str, enum.Enum):
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"
    PHONE_VERIFY = "phone_verify"


class VerificationToken(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "verification_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[VerificationPurpose] = mapped_column(Enum(VerificationPurpose), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
```

---

## `.env`

```env
APP_NAME=learniox-auth-service
APP_ENV=local
DEBUG=true
SERVICE_NAME=auth_service
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/auth_db
REDIS_URL=redis://localhost:6379/0

JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/oauth/google/callback

INTERNAL_API_KEY=dev-internal-secret
USER_SERVICE_URL=http://user_service:8000
AUDIT_SERVICE_URL=http://audit_service:8000
NOTIFICATION_SERVICE_URL=http://notification_service:8000

LOG_LEVEL=INFO
```

---

## Settings

```python
# app/core/config.py

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str
    APP_ENV: str = "local"
    DEBUG: bool = True
    SERVICE_NAME: str = "auth_service"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    COOKIE_DOMAIN: str = "localhost"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = None

    INTERNAL_API_KEY: str
    USER_SERVICE_URL: str
    AUDIT_SERVICE_URL: str | None = None
    NOTIFICATION_SERVICE_URL: str | None = None

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

## Request Schemas

```python
# app/schemas/requests.py

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class LogoutRequest(BaseModel):
    session_id: str | None = None
    logout_all_devices: bool = False


class TokenIntrospectRequest(BaseModel):
    token: str
```

---

## Response Schemas

```python
# app/schemas/responses.py

from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID


class AuthUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: str | None = None
    status: str
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int


class LoginResponse(BaseModel):
    user: AuthUserResponse
    tokens: TokenPairResponse


class SessionResponse(BaseModel):
    id: UUID
    user_agent: str | None
    ip_address: str | None
    is_active: bool
    created_at: datetime
    expires_at: datetime


class TokenIntrospectResponse(BaseModel):
    active: bool
    user_id: UUID | None = None
    email: str | None = None
    expires_at: datetime | None = None
```

---

# 6. User Profile Service

## Responsibility

Owns learner profile, preferences, saved courses, followed institutions.

---

## Models

```python
# app/models/user_profile.py

import uuid
from sqlalchemy import String, Text, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class UserType(str, enum.Enum):
    LEARNER = "learner"
    CREATOR = "creator"
    PLATFORM_ADMIN = "platform_admin"


class UserProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_profiles"

    auth_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True, nullable=False)

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    username: Mapped[str | None] = mapped_column(String(80), unique=True, index=True, nullable=True)

    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    user_type: Mapped[UserType] = mapped_column(Enum(UserType), default=UserType.LEARNER)

    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country: Mapped[str | None] = mapped_column(String(80), nullable=True)

    interests: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

```python
# app/models/saved_course.py

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class SavedCourse(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "saved_courses"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
```

```python
# app/models/followed_institution.py

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class FollowedInstitution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "followed_institutions"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
```

---

## `.env`

```env
APP_NAME=learniox-user-service
SERVICE_NAME=user_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/user_db
REDIS_URL=redis://localhost:6379/1

INTERNAL_API_KEY=dev-internal-secret
AUTH_SERVICE_URL=http://auth_service:8000
ASSET_SERVICE_URL=http://asset_service:8000

LOG_LEVEL=INFO
```

---

## Settings

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str
    SERVICE_NAME: str = "user_service"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str | None = None

    INTERNAL_API_KEY: str
    AUTH_SERVICE_URL: str
    ASSET_SERVICE_URL: str | None = None

    LOG_LEVEL: str = "INFO"
```

---

## Request Schemas

```python
class CreateUserProfileRequest(BaseModel):
    auth_user_id: UUID
    full_name: str
    email: EmailStr | None = None


class UpdateUserProfileRequest(BaseModel):
    full_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    language: str | None = None
    country: str | None = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict


class UpdateInterestsRequest(BaseModel):
    interests: list[str]


class SaveCourseRequest(BaseModel):
    course_id: UUID


class FollowInstitutionRequest(BaseModel):
    institution_id: UUID
```

---

## Response Schemas

```python
class UserProfileResponse(BaseModel):
    id: UUID
    auth_user_id: UUID
    full_name: str
    username: str | None
    avatar_url: str | None
    bio: str | None
    user_type: str
    language: str | None
    country: str | None
    interests: dict | None
    preferences: dict | None
    created_at: datetime
    updated_at: datetime


class SavedCourseResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    created_at: datetime


class FollowedInstitutionResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    created_at: datetime
```

---

# 7. Institution Service

## Responsibility

Owns academy/institution profile, slug, branding, verification, public identity.

---

## Models

```python
# app/models/institution.py

import enum
from sqlalchemy import String, Text, Enum, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class InstitutionStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class InstitutionType(str, enum.Enum):
    SOLO_CREATOR = "solo_creator"
    COACHING_INSTITUTE = "coaching_institute"
    SCHOOL = "school"
    COMPANY = "company"


class Institution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "institutions"

    name: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(255), nullable=True)

    institution_type: Mapped[InstitutionType] = mapped_column(Enum(InstitutionType), default=InstitutionType.SOLO_CREATOR)
    status: Mapped[InstitutionStatus] = mapped_column(Enum(InstitutionStatus), default=InstitutionStatus.DRAFT)

    owner_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)

    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    branding: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
```

```python
# app/models/institution_verification.py

import uuid
import enum
from sqlalchemy import String, Text, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InstitutionVerification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "institution_verifications"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    status: Mapped[VerificationStatus] = mapped_column(Enum(VerificationStatus), default=VerificationStatus.PENDING)

    document_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-institution-service
SERVICE_NAME=institution_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/institution_db
REDIS_URL=redis://localhost:6379/2

INTERNAL_API_KEY=dev-internal-secret
RBAC_SERVICE_URL=http://rbac_service:8000
ASSET_SERVICE_URL=http://asset_service:8000
AUDIT_SERVICE_URL=http://audit_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CreateInstitutionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=3, max_length=120)
    tagline: str | None = None
    description: str | None = None
    institution_type: str = "solo_creator"
    category: str | None = None


class UpdateInstitutionRequest(BaseModel):
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    category: str | None = None
    website_url: str | None = None


class UpdateInstitutionBrandingRequest(BaseModel):
    logo_url: str | None = None
    banner_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    theme: dict | None = None


class UpdateInstitutionSettingsRequest(BaseModel):
    settings: dict


class SubmitVerificationRequest(BaseModel):
    document_url: str
    notes: str | None = None
```

---

## Response Schemas

```python
class InstitutionResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    tagline: str | None
    description: str | None
    institution_type: str
    status: str
    owner_user_id: UUID | str
    logo_url: str | None
    banner_url: str | None
    category: str | None
    website_url: str | None
    branding: dict | None
    settings: dict | None
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class InstitutionPublicResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    tagline: str | None
    description: str | None
    logo_url: str | None
    banner_url: str | None
    category: str | None
    is_verified: bool


class InstitutionVerificationResponse(BaseModel):
    id: UUID
    institution_id: UUID
    status: str
    document_url: str | None
    rejection_reason: str | None
    created_at: datetime
```

---

# 8. RBAC Service

## Responsibility

Owns institution team, roles, permissions, invitations.

---

## Models

```python
# app/models/institution_member.py

import uuid
import enum
from sqlalchemy import Enum, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class MemberStatus(str, enum.Enum):
    ACTIVE = "active"
    INVITED = "invited"
    REMOVED = "removed"


class InstitutionMember(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "institution_members"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    status: Mapped[MemberStatus] = mapped_column(Enum(MemberStatus), default=MemberStatus.ACTIVE)
    invited_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)
```

```python
# app/models/role.py

import uuid
from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class Role(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "roles"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False)
```

```python
# app/models/permission.py

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class Permission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    module: Mapped[str] = mapped_column(String(80), nullable=False)
```

```python
# app/models/role_permission.py

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class RolePermission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    permission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
```

```python
# app/models/invite.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class InviteStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"


class InstitutionInvite(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "institution_invites"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    invited_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(Enum(InviteStatus), default=InviteStatus.PENDING)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
```

---

## `.env`

```env
APP_NAME=learniox-rbac-service
SERVICE_NAME=rbac_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/rbac_db
REDIS_URL=redis://localhost:6379/3

INTERNAL_API_KEY=dev-internal-secret
AUTH_SERVICE_URL=http://auth_service:8000
USER_SERVICE_URL=http://user_service:8000
NOTIFICATION_SERVICE_URL=http://notification_service:8000
AUDIT_SERVICE_URL=http://audit_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CreateRoleRequest(BaseModel):
    name: str
    code: str
    description: str | None = None
    permission_codes: list[str] = []


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_codes: list[str] | None = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role_id: UUID


class UpdateMemberRoleRequest(BaseModel):
    role_id: UUID


class PermissionCheckRequest(BaseModel):
    user_id: UUID
    institution_id: UUID
    permission: str


class BulkPermissionCheckRequest(BaseModel):
    user_id: UUID
    institution_id: UUID
    permissions: list[str]
```

---

## Response Schemas

```python
class PermissionResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    module: str


class RoleResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    name: str
    code: str
    description: str | None
    is_system_role: bool
    permissions: list[PermissionResponse] = []


class InstitutionMemberResponse(BaseModel):
    id: UUID
    institution_id: UUID
    user_id: UUID
    role_id: UUID
    status: str
    is_owner: bool
    created_at: datetime


class InviteResponse(BaseModel):
    id: UUID
    institution_id: UUID
    email: EmailStr
    role_id: UUID
    status: str
    expires_at: datetime


class PermissionCheckResponse(BaseModel):
    allowed: bool
    user_id: UUID
    institution_id: UUID
    permission: str


class BulkPermissionCheckResponse(BaseModel):
    user_id: UUID
    institution_id: UUID
    results: dict[str, bool]
```

---

# 9. Course Service

## Responsibility

Owns course/program metadata, pricing metadata, publish status, SEO, instructors.

---

## Models

```python
# app/models/course.py

import uuid
import enum
from sqlalchemy import String, Text, Enum, Boolean, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseAccessType(str, enum.Enum):
    FREE = "free"
    PAID = "paid"
    MEMBERSHIP = "membership"
    PRIVATE = "private"


class CourseLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Course(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "courses"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(220), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    promo_video_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True)

    language: Mapped[str | None] = mapped_column(String(40), nullable=True)
    level: Mapped[CourseLevel] = mapped_column(Enum(CourseLevel), default=CourseLevel.BEGINNER)

    status: Mapped[CourseStatus] = mapped_column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    access_type: Mapped[CourseAccessType] = mapped_column(Enum(CourseAccessType), default=CourseAccessType.FREE)

    price_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    learning_outcomes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    prerequisites: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    seo: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
```

```python
# app/models/course_instructor.py

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CourseInstructor(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "course_instructors"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
```

---

## `.env`

```env
APP_NAME=learniox-course-service
SERVICE_NAME=course_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/course_db
REDIS_URL=redis://localhost:6379/4

INTERNAL_API_KEY=dev-internal-secret
INSTITUTION_SERVICE_URL=http://institution_service:8000
RBAC_SERVICE_URL=http://rbac_service:8000
LESSON_SERVICE_URL=http://lesson_service:8000
SEARCH_SERVICE_URL=http://search_service:8000
AUDIT_SERVICE_URL=http://audit_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=3, max_length=220)
    slug: str = Field(min_length=3, max_length=160)
    subtitle: str | None = None
    description: str | None = None
    category: str | None = None
    subcategory: str | None = None
    language: str | None = "English"
    level: str = "beginner"
    access_type: str = "free"
    price_amount: float | None = None
    currency: str = "INR"


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    category: str | None = None
    subcategory: str | None = None
    language: str | None = None
    level: str | None = None


class UpdateCoursePricingRequest(BaseModel):
    access_type: str
    price_amount: float | None = None
    currency: str = "INR"


class UpdateCourseSEORequest(BaseModel):
    meta_title: str | None = None
    meta_description: str | None = None
    keywords: list[str] = []


class UpdateCourseOutcomesRequest(BaseModel):
    learning_outcomes: list[str]
    prerequisites: list[str] = []


class AddCourseInstructorRequest(BaseModel):
    user_id: UUID
```

---

## Response Schemas

```python
class CourseResponse(BaseModel):
    id: UUID
    institution_id: UUID
    title: str
    slug: str
    subtitle: str | None
    description: str | None
    thumbnail_url: str | None
    promo_video_id: UUID | None
    category: str | None
    subcategory: str | None
    language: str | None
    level: str
    status: str
    access_type: str
    price_amount: float | None
    currency: str
    learning_outcomes: dict | None
    prerequisites: dict | None
    seo: dict | None
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class CoursePublicResponse(BaseModel):
    id: UUID
    institution_id: UUID
    title: str
    slug: str
    subtitle: str | None
    thumbnail_url: str | None
    category: str | None
    level: str
    language: str | None
    access_type: str
    price_amount: float | None
    currency: str


class CourseInstructorResponse(BaseModel):
    id: UUID
    course_id: UUID
    user_id: UUID
    created_at: datetime
```

---

# 10. Lesson / Curriculum Service

## Responsibility

Owns modules, lessons, lesson ordering, lesson access rules.

---

## Models

```python
# app/models/course_module.py

import uuid
from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CourseModule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "course_modules"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    order_index: Mapped[int] = mapped_column(Integer, default=0)
```

```python
# app/models/lesson.py

import uuid
import enum
from sqlalchemy import String, Text, Integer, Boolean, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class LessonType(str, enum.Enum):
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    LIVE_CLASS = "live_class"
    EXTERNAL_LINK = "external_link"


class LessonAccessType(str, enum.Enum):
    FREE_PREVIEW = "free_preview"
    ENROLLED_ONLY = "enrolled_only"
    MEMBERSHIP_ONLY = "membership_only"
    PRIVATE = "private"


class Lesson(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "lessons"

    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    module_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    lesson_type: Mapped[LessonType] = mapped_column(Enum(LessonType), default=LessonType.VIDEO)
    access_type: Mapped[LessonAccessType] = mapped_column(Enum(LessonAccessType), default=LessonAccessType.ENROLLED_ONLY)

    order_index: Mapped[int] = mapped_column(Integer, default=0)

    video_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-lesson-service
SERVICE_NAME=lesson_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lesson_db
REDIS_URL=redis://localhost:6379/5

INTERNAL_API_KEY=dev-internal-secret
COURSE_SERVICE_URL=http://course_service:8000
MEDIA_SERVICE_URL=http://media_service:8000
ASSET_SERVICE_URL=http://asset_service:8000
RBAC_SERVICE_URL=http://rbac_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CreateModuleRequest(BaseModel):
    title: str
    description: str | None = None
    order_index: int = 0


class UpdateModuleRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    order_index: int | None = None


class CreateLessonRequest(BaseModel):
    title: str
    description: str | None = None
    lesson_type: str = "video"
    access_type: str = "enrolled_only"
    order_index: int = 0
    video_id: UUID | None = None
    asset_id: UUID | None = None
    content: str | None = None
    external_url: str | None = None
    duration_seconds: int | None = None


class UpdateLessonRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    access_type: str | None = None
    video_id: UUID | None = None
    asset_id: UUID | None = None
    content: str | None = None
    external_url: str | None = None
    duration_seconds: int | None = None


class ReorderCurriculumRequest(BaseModel):
    modules: list[dict]
```

---

## Response Schemas

```python
class CourseModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    description: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    module_id: UUID
    title: str
    description: str | None
    lesson_type: str
    access_type: str
    order_index: int
    video_id: UUID | None
    asset_id: UUID | None
    content: str | None
    external_url: str | None
    duration_seconds: int | None
    is_published: bool
    metadata_json: dict | None
    created_at: datetime
    updated_at: datetime


class CurriculumResponse(BaseModel):
    course_id: UUID
    modules: list[CourseModuleResponse]
    lessons: list[LessonResponse]
```

---

# 11. Media Service

## Responsibility

Owns video upload, processing status, playback metadata, subtitles, chapters.

---

## Models

```python
# app/models/video.py

import uuid
import enum
from sqlalchemy import String, Text, Integer, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class VideoStatus(str, enum.Enum):
    UPLOAD_PENDING = "upload_pending"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"


class Video(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "videos"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    uploaded_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    title: Mapped[str | None] = mapped_column(String(220), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    provider: Mapped[str] = mapped_column(String(50), default="cloudflare_stream")
    provider_video_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)

    status: Mapped[VideoStatus] = mapped_column(Enum(VideoStatus), default=VideoStatus.UPLOAD_PENDING)

    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    playback_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

```python
# app/models/video_chapter.py

import uuid
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class VideoChapter(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "video_chapters"

    video_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    start_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    end_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
```

```python
# app/models/video_subtitle.py

import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class VideoSubtitle(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "video_subtitles"

    video_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    language: Mapped[str] = mapped_column(String(40), nullable=False)
    subtitle_url: Mapped[str] = mapped_column(Text, nullable=False)
```

---

## `.env`

```env
APP_NAME=learniox-media-service
SERVICE_NAME=media_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/media_db
REDIS_URL=redis://localhost:6379/6

INTERNAL_API_KEY=dev-internal-secret

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_API_TOKEN=
CLOUDFLARE_STREAM_WEBHOOK_SECRET=

RBAC_SERVICE_URL=http://rbac_service:8000
AI_SERVICE_URL=http://ai_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class VideoUploadInitRequest(BaseModel):
    institution_id: UUID
    title: str | None = None
    description: str | None = None
    max_duration_seconds: int | None = None


class VideoUploadCompleteRequest(BaseModel):
    video_id: UUID
    provider_video_id: str


class UpdateVideoRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None


class CreateVideoChapterRequest(BaseModel):
    title: str
    start_seconds: int
    end_seconds: int | None = None


class CreateSubtitleRequest(BaseModel):
    language: str
    subtitle_url: str
```

---

## Response Schemas

```python
class VideoUploadInitResponse(BaseModel):
    video_id: UUID
    upload_url: str
    provider: str
    expires_at: datetime | None = None


class VideoResponse(BaseModel):
    id: UUID
    institution_id: UUID
    uploaded_by_user_id: UUID
    title: str | None
    description: str | None
    provider: str
    provider_video_id: str | None
    status: str
    duration_seconds: int | None
    thumbnail_url: str | None
    playback_url: str | None
    metadata_json: dict | None
    created_at: datetime
    updated_at: datetime


class VideoPlaybackResponse(BaseModel):
    video_id: UUID
    playback_url: str
    signed_token: str | None = None
    expires_at: datetime | None = None


class VideoChapterResponse(BaseModel):
    id: UUID
    video_id: UUID
    title: str
    start_seconds: int
    end_seconds: int | None


class VideoSubtitleResponse(BaseModel):
    id: UUID
    video_id: UUID
    language: str
    subtitle_url: str
```

---

# 12. Enrollment & Access Service

## Responsibility

Owns enrollments and course/lesson access checks.

---

## Models

```python
# app/models/enrollment.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class EnrollmentSource(str, enum.Enum):
    FREE = "free"
    PURCHASE = "purchase"
    MEMBERSHIP = "membership"
    MANUAL = "manual"


class Enrollment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "enrollments"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    source: Mapped[EnrollmentSource] = mapped_column(Enum(EnrollmentSource), default=EnrollmentSource.FREE)
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE)

    payment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    subscription_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-enrollment-service
SERVICE_NAME=enrollment_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/enrollment_db
REDIS_URL=redis://localhost:6379/7

INTERNAL_API_KEY=dev-internal-secret
COURSE_SERVICE_URL=http://course_service:8000
LESSON_SERVICE_URL=http://lesson_service:8000
MEMBERSHIP_SERVICE_URL=http://membership_service:8000
PAYMENT_SERVICE_URL=http://payment_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class EnrollCourseRequest(BaseModel):
    user_id: UUID | None = None
    source: str = "free"
    payment_id: UUID | None = None
    subscription_id: UUID | None = None


class CourseAccessCheckRequest(BaseModel):
    user_id: UUID
    course_id: UUID


class LessonAccessCheckRequest(BaseModel):
    user_id: UUID
    lesson_id: UUID
    course_id: UUID


class BulkAccessCheckRequest(BaseModel):
    user_id: UUID
    course_ids: list[UUID] = []
    lesson_ids: list[UUID] = []
```

---

## Response Schemas

```python
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
```

---

# 13. Membership Service

## Responsibility

Owns institution membership plans, benefits, subscriptions.

---

## Models

```python
# app/models/membership_plan.py

import uuid
import enum
from sqlalchemy import String, Text, Enum, Numeric, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class BillingInterval(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    ONE_TIME = "one_time"


class MembershipPlan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "membership_plans"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    billing_interval: Mapped[BillingInterval] = mapped_column(Enum(BillingInterval), default=BillingInterval.MONTHLY)

    benefits: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

```python
# app/models/subscription.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import Enum, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PAYMENT_FAILED = "payment_failed"


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), default=SubscriptionStatus.PENDING)

    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-membership-service
SERVICE_NAME=membership_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/membership_db
REDIS_URL=redis://localhost:6379/8

INTERNAL_API_KEY=dev-internal-secret
PAYMENT_SERVICE_URL=http://payment_service:8000
INSTITUTION_SERVICE_URL=http://institution_service:8000
ENROLLMENT_SERVICE_URL=http://enrollment_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CreateMembershipPlanRequest(BaseModel):
    name: str
    description: str | None = None
    price_amount: float
    currency: str = "INR"
    billing_interval: str = "monthly"
    benefits: dict | None = None


class UpdateMembershipPlanRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price_amount: float | None = None
    currency: str | None = None
    billing_interval: str | None = None
    benefits: dict | None = None
    is_active: bool | None = None


class CreateSubscriptionRequest(BaseModel):
    user_id: UUID | None = None
    plan_id: UUID
    payment_id: UUID | None = None


class UpdateSubscriptionStatusRequest(BaseModel):
    status: str
    provider_subscription_id: str | None = None
```

---

## Response Schemas

```python
class MembershipPlanResponse(BaseModel):
    id: UUID
    institution_id: UUID
    name: str
    description: str | None
    price_amount: float
    currency: str
    billing_interval: str
    benefits: dict | None
    is_active: bool
    created_at: datetime


class SubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    plan_id: UUID
    status: str
    provider: str | None
    provider_subscription_id: str | None
    current_period_start: datetime | None
    current_period_end: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class MembershipStatusResponse(BaseModel):
    user_id: UUID
    institution_id: UUID
    has_active_membership: bool
    subscription_id: UUID | None
    plan_id: UUID | None
```

---

# 14. Payment Service

## Responsibility

Owns checkout, transactions, coupons, refunds, payouts, payment webhooks.

---

## Models

```python
# app/models/payment.py

import uuid
import enum
from sqlalchemy import String, Enum, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class PaymentPurpose(str, enum.Enum):
    COURSE_PURCHASE = "course_purchase"
    MEMBERSHIP = "membership"
    LIVE_BATCH = "live_batch"


class PaymentStatus(str, enum.Enum):
    CREATED = "created"
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    purpose: Mapped[PaymentPurpose] = mapped_column(Enum(PaymentPurpose), nullable=False)
    reference_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")

    provider: Mapped[str] = mapped_column(String(50), default="razorpay")
    provider_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.CREATED)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

```python
# app/models/coupon.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Enum, Numeric, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class Coupon(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "coupons"

    institution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    code: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    discount_type: Mapped[DiscountType] = mapped_column(Enum(DiscountType), nullable=False)
    discount_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    max_uses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0)

    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

---

## `.env`

```env
APP_NAME=learniox-payment-service
SERVICE_NAME=payment_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/payment_db
REDIS_URL=redis://localhost:6379/9

INTERNAL_API_KEY=dev-internal-secret

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

ENROLLMENT_SERVICE_URL=http://enrollment_service:8000
MEMBERSHIP_SERVICE_URL=http://membership_service:8000
NOTIFICATION_SERVICE_URL=http://notification_service:8000
AUDIT_SERVICE_URL=http://audit_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class CourseCheckoutRequest(BaseModel):
    user_id: UUID | None = None
    course_id: UUID
    institution_id: UUID
    coupon_code: str | None = None


class MembershipCheckoutRequest(BaseModel):
    user_id: UUID | None = None
    plan_id: UUID
    institution_id: UUID
    coupon_code: str | None = None


class VerifyPaymentRequest(BaseModel):
    provider_order_id: str
    provider_payment_id: str
    provider_signature: str


class RefundPaymentRequest(BaseModel):
    reason: str | None = None
    amount: float | None = None


class CreateCouponRequest(BaseModel):
    institution_id: UUID
    code: str
    discount_type: str
    discount_value: float
    max_uses: int | None = None
    expires_at: datetime | None = None


class ValidateCouponRequest(BaseModel):
    institution_id: UUID
    code: str
    amount: float
```

---

## Response Schemas

```python
class CheckoutResponse(BaseModel):
    payment_id: UUID
    provider: str
    provider_order_id: str
    amount: float
    currency: str
    checkout_payload: dict


class PaymentResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID
    purpose: str
    reference_id: UUID
    amount: float
    currency: str
    provider: str
    provider_order_id: str | None
    provider_payment_id: str | None
    status: str
    metadata_json: dict | None
    created_at: datetime


class CouponResponse(BaseModel):
    id: UUID
    institution_id: UUID
    code: str
    discount_type: str
    discount_value: float
    max_uses: int | None
    used_count: int
    expires_at: datetime | None
    is_active: bool


class CouponValidationResponse(BaseModel):
    valid: bool
    discount_amount: float
    final_amount: float
    reason: str | None = None
```

---

# 15. Progress Service

## Responsibility

Owns watch progress, lesson completion, course completion, continue learning.

---

## Models

```python
# app/models/lesson_progress.py

import uuid
from datetime import datetime
from sqlalchemy import Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class LessonProgress(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "lesson_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    lesson_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    watched_seconds: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_watched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

```python
# app/models/course_progress.py

import uuid
from datetime import datetime
from sqlalchemy import Integer, Numeric, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class CourseProgress(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "course_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    total_lessons: Mapped[int] = mapped_column(Integer, default=0)
    completed_lessons: Mapped[int] = mapped_column(Integer, default=0)

    completion_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0)

    last_lesson_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-progress-service
SERVICE_NAME=progress_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/progress_db
REDIS_URL=redis://localhost:6379/10

INTERNAL_API_KEY=dev-internal-secret
COURSE_SERVICE_URL=http://course_service:8000
LESSON_SERVICE_URL=http://lesson_service:8000
CERTIFICATE_SERVICE_URL=http://certificate_service:8000
ANALYTICS_SERVICE_URL=http://analytics_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class WatchProgressRequest(BaseModel):
    user_id: UUID | None = None
    course_id: UUID
    lesson_id: UUID
    watched_seconds: int
    duration_seconds: int | None = None


class MarkLessonCompleteRequest(BaseModel):
    user_id: UUID | None = None
    course_id: UUID
    lesson_id: UUID


class RecalculateCourseProgressRequest(BaseModel):
    user_id: UUID
    course_id: UUID
```

---

## Response Schemas

```python
class LessonProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    lesson_id: UUID
    watched_seconds: int
    duration_seconds: int | None
    is_completed: bool
    completed_at: datetime | None
    last_watched_at: datetime | None


class CourseProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    total_lessons: int
    completed_lessons: int
    completion_percentage: float
    last_lesson_id: UUID | None
    is_completed: bool
    completed_at: datetime | None


class ContinueLearningItemResponse(BaseModel):
    course_id: UUID
    lesson_id: UUID | None
    progress_percentage: float
    last_watched_at: datetime | None
```

---

# 16. Search & Discovery Service

## Responsibility

Owns public discovery, search index, autocomplete, category pages.

---

## Models

```python
# app/models/search_document.py

import uuid
from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class SearchDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "search_documents"

    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)

    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    searchable_text: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-search-service
SERVICE_NAME=search_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/search_db
REDIS_URL=redis://localhost:6379/11

MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_API_KEY=masterKey

COURSE_SERVICE_URL=http://course_service:8000
INSTITUTION_SERVICE_URL=http://institution_service:8000

INTERNAL_API_KEY=dev-internal-secret
LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class SearchRequest(BaseModel):
    query: str
    entity_type: str | None = None
    category: str | None = None
    page: int = 1
    limit: int = 20


class IndexCourseRequest(BaseModel):
    course_id: UUID


class IndexInstitutionRequest(BaseModel):
    institution_id: UUID


class SearchDocumentUpsertRequest(BaseModel):
    entity_id: UUID
    entity_type: str
    title: str
    description: str | None = None
    institution_id: UUID | None = None
    category: str | None = None
    tags: list[str] = []
    metadata: dict | None = None
```

---

## Response Schemas

```python
class SearchResultResponse(BaseModel):
    entity_id: UUID
    entity_type: str
    title: str
    description: str | None
    image_url: str | None = None
    category: str | None = None
    institution_id: UUID | None = None
    score: float | None = None
    metadata: dict | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultResponse]
    total: int
    page: int
    limit: int


class SuggestionResponse(BaseModel):
    suggestions: list[str]
```

---

# 17. AI Copilot Service

## Responsibility

Owns AI generation jobs, video summarization, course outline, quiz generation, doubt answer draft, marketing copy.

---

## Models

```python
# app/models/ai_job.py

import uuid
import enum
from sqlalchemy import String, Text, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class AIJobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AIJobType(str, enum.Enum):
    COURSE_OUTLINE = "course_outline"
    LESSON_PLAN = "lesson_plan"
    VIDEO_SUMMARY = "video_summary"
    VIDEO_CHAPTERS = "video_chapters"
    QUIZ_GENERATION = "quiz_generation"
    DOUBT_DRAFT_ANSWER = "doubt_draft_answer"
    MARKETING_COPY = "marketing_copy"


class AIJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ai_jobs"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    requested_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)

    job_type: Mapped[AIJobType] = mapped_column(Enum(AIJobType), nullable=False)
    status: Mapped[AIJobStatus] = mapped_column(Enum(AIJobStatus), default=AIJobStatus.QUEUED)

    input_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    output_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-ai-service
SERVICE_NAME=ai_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_db
REDIS_URL=redis://localhost:6379/12

INTERNAL_API_KEY=dev-internal-secret

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_LLM_MODEL=openai/gpt-4o-mini

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

VECTOR_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/vector_db

MEDIA_SERVICE_URL=http://media_service:8000
COURSE_SERVICE_URL=http://course_service:8000
DOUBT_SERVICE_URL=http://doubt_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class GenerateCourseOutlineRequest(BaseModel):
    institution_id: UUID | None = None
    topic: str
    target_audience: str
    level: str = "beginner"
    language: str = "English"
    number_of_modules: int = 8


class GenerateLessonPlanRequest(BaseModel):
    course_title: str
    module_title: str
    lesson_topic: str
    duration_minutes: int | None = None


class GenerateQuizRequest(BaseModel):
    source_text: str
    number_of_questions: int = 10
    difficulty: str = "medium"
    question_types: list[str] = ["mcq"]


class GenerateVideoSummaryRequest(BaseModel):
    video_id: UUID
    transcript: str | None = None


class GenerateDoubtAnswerRequest(BaseModel):
    doubt_id: UUID
    question: str
    course_context: str | None = None


class GenerateMarketingCopyRequest(BaseModel):
    course_id: UUID | None = None
    product_name: str
    target_audience: str
    channel: str
```

---

## Response Schemas

```python
class AIJobResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    requested_by_user_id: UUID
    job_type: str
    status: str
    input_payload: dict
    output_payload: dict | None
    error_message: str | None
    provider: str | None
    model_name: str | None
    created_at: datetime
    updated_at: datetime


class CourseOutlineResponse(BaseModel):
    title: str
    description: str
    modules: list[dict]
    outcomes: list[str]
    prerequisites: list[str]


class QuizGenerationResponse(BaseModel):
    questions: list[dict]


class MarketingCopyResponse(BaseModel):
    title: str
    body: str
    variants: list[dict] = []
```

---

# 18. Analytics Service

## Responsibility

Owns event tracking and dashboard metrics.

---

## Models

```python
# app/models/analytics_event.py

import uuid
from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class AnalyticsEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "analytics_events"

    event_name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)

    session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(80), nullable=True)

    properties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-analytics-service
SERVICE_NAME=analytics_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/analytics_db
REDIS_URL=redis://localhost:6379/13

INTERNAL_API_KEY=dev-internal-secret
COURSE_SERVICE_URL=http://course_service:8000
PAYMENT_SERVICE_URL=http://payment_service:8000
PROGRESS_SERVICE_URL=http://progress_service:8000

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class TrackEventRequest(BaseModel):
    event_name: str
    user_id: UUID | None = None
    institution_id: UUID | None = None
    course_id: UUID | None = None
    lesson_id: UUID | None = None
    session_id: str | None = None
    source: str | None = None
    properties: dict | None = None


class BatchTrackEventRequest(BaseModel):
    events: list[TrackEventRequest]


class AnalyticsDateRangeRequest(BaseModel):
    start_date: datetime
    end_date: datetime
```

---

## Response Schemas

```python
class AnalyticsEventResponse(BaseModel):
    id: UUID
    event_name: str
    user_id: UUID | None
    institution_id: UUID | None
    course_id: UUID | None
    lesson_id: UUID | None
    session_id: str | None
    source: str | None
    properties: dict | None
    created_at: datetime


class InstitutionAnalyticsOverviewResponse(BaseModel):
    institution_id: UUID
    total_learners: int
    total_courses: int
    total_revenue: float
    total_watch_time_seconds: int
    active_learners: int
    conversion_rate: float


class CourseAnalyticsOverviewResponse(BaseModel):
    course_id: UUID
    total_views: int
    total_enrollments: int
    completion_rate: float
    average_watch_percentage: float
    revenue: float
```

---

# 19. Notification Service

## Responsibility

Owns in-app notifications, email, SMS, WhatsApp templates.

---

## Models

```python
# app/models/notification.py

import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Enum, Boolean, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)

    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel), default=NotificationChannel.IN_APP)

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[NotificationStatus] = mapped_column(Enum(NotificationStatus), default=NotificationStatus.PENDING)

    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

```python
# app/models/notification_template.py

import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class NotificationTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notification_templates"

    institution_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), index=True, nullable=True)
    code: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    channel: Mapped[str] = mapped_column(String(40), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
```

---

## `.env`

```env
APP_NAME=learniox-notification-service
SERVICE_NAME=notification_service
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/notification_db
REDIS_URL=redis://localhost:6379/14

INTERNAL_API_KEY=dev-internal-secret

EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=noreply@learniox.com

SMS_PROVIDER=msg91
MSG91_AUTH_KEY=

WHATSAPP_PROVIDER=gupshup
GUPSHUP_API_KEY=

LOG_LEVEL=INFO
```

---

## Request Schemas

```python
class SendNotificationRequest(BaseModel):
    user_id: UUID
    institution_id: UUID | None = None
    channel: str = "in_app"
    title: str
    body: str
    metadata: dict | None = None


class BulkSendNotificationRequest(BaseModel):
    user_ids: list[UUID]
    institution_id: UUID | None = None
    channel: str = "in_app"
    title: str
    body: str
    metadata: dict | None = None


class CreateNotificationTemplateRequest(BaseModel):
    institution_id: UUID | None = None
    code: str
    channel: str
    subject: str | None = None
    body: str


class UpdateNotificationPreferenceRequest(BaseModel):
    email_enabled: bool | None = None
    sms_enabled: bool | None = None
    whatsapp_enabled: bool | None = None
    in_app_enabled: bool | None = None
```

---

## Response Schemas

```python
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    institution_id: UUID | None
    channel: str
    title: str
    body: str
    status: str
    metadata_json: dict | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class NotificationTemplateResponse(BaseModel):
    id: UUID
    institution_id: UUID | None
    code: str
    channel: str
    subject: str | None
    body: str
    created_at: datetime
```

---

# 20. API Gateway / BFF Service

## Responsibility

Does not own business models. Owns route aggregation, request context, auth verification, proxy clients.

---

## Models

Usually no SQLAlchemy models are required.

Optional models:

```python
# app/models/request_log.py

from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class GatewayRequestLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "gateway_request_logs"

    request_id: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)

    method: Mapped[str] = mapped_column(String(20))
    path: Mapped[str] = mapped_column(Text)
    status_code: Mapped[int] = mapped_column(Integer)
    latency_ms: Mapped[float] = mapped_column(Float)

    upstream_service: Mapped[str | None] = mapped_column(String(120), nullable=True)
```

---

## `.env`

```env
APP_NAME=learniox-api-gateway
SERVICE_NAME=api_gateway
APP_ENV=local
DEBUG=true
API_V1_PREFIX=/api/v1

REDIS_URL=redis://localhost:6379/15
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/gateway_db

INTERNAL_API_KEY=dev-internal-secret

AUTH_SERVICE_URL=http://auth_service:8000
USER_SERVICE_URL=http://user_service:8000
INSTITUTION_SERVICE_URL=http://institution_service:8000
RBAC_SERVICE_URL=http://rbac_service:8000
COURSE_SERVICE_URL=http://course_service:8000
LESSON_SERVICE_URL=http://lesson_service:8000
MEDIA_SERVICE_URL=http://media_service:8000
ENROLLMENT_SERVICE_URL=http://enrollment_service:8000
MEMBERSHIP_SERVICE_URL=http://membership_service:8000
PAYMENT_SERVICE_URL=http://payment_service:8000
PROGRESS_SERVICE_URL=http://progress_service:8000
SEARCH_SERVICE_URL=http://search_service:8000
AI_SERVICE_URL=http://ai_service:8000
ANALYTICS_SERVICE_URL=http://analytics_service:8000
NOTIFICATION_SERVICE_URL=http://notification_service:8000

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
RATE_LIMIT_PER_MINUTE=120
REQUEST_TIMEOUT_SECONDS=30

LOG_LEVEL=INFO
```

---

## Settings

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str
    SERVICE_NAME: str = "api_gateway"
    APP_ENV: str = "local"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str | None = None
    REDIS_URL: str

    INTERNAL_API_KEY: str

    AUTH_SERVICE_URL: str
    USER_SERVICE_URL: str
    INSTITUTION_SERVICE_URL: str
    RBAC_SERVICE_URL: str
    COURSE_SERVICE_URL: str
    LESSON_SERVICE_URL: str
    MEDIA_SERVICE_URL: str
    ENROLLMENT_SERVICE_URL: str
    MEMBERSHIP_SERVICE_URL: str
    PAYMENT_SERVICE_URL: str
    PROGRESS_SERVICE_URL: str
    SEARCH_SERVICE_URL: str
    AI_SERVICE_URL: str
    ANALYTICS_SERVICE_URL: str
    NOTIFICATION_SERVICE_URL: str

    CORS_ALLOWED_ORIGINS: str
    RATE_LIMIT_PER_MINUTE: int = 120
    REQUEST_TIMEOUT_SECONDS: int = 30

    LOG_LEVEL: str = "INFO"
```

---

## BFF Request Schemas

```python
class PublicSearchQuery(BaseModel):
    query: str
    category: str | None = None
    page: int = 1
    limit: int = 20


class StudioDashboardRequest(BaseModel):
    institution_id: UUID


class CheckoutCourseBFFRequest(BaseModel):
    course_id: UUID
    coupon_code: str | None = None


class CheckoutMembershipBFFRequest(BaseModel):
    plan_id: UUID
    coupon_code: str | None = None
```

---

## BFF Response Schemas

```python
class PublicHomeResponse(BaseModel):
    featured_courses: list[dict]
    trending_courses: list[dict]
    trending_institutions: list[dict]
    categories: list[dict]
    free_courses: list[dict]


class PublicCourseDetailResponse(BaseModel):
    course: dict
    institution: dict
    curriculum_preview: dict
    reviews_summary: dict | None = None
    access: dict | None = None


class PublicInstitutionPageResponse(BaseModel):
    institution: dict
    landing_page: dict | None = None
    courses: list[dict]
    membership_plans: list[dict]
    reviews_summary: dict | None = None


class LearnerDashboardResponse(BaseModel):
    profile: dict
    enrolled_courses: list[dict]
    continue_learning: list[dict]
    memberships: list[dict]
    notifications: list[dict]


class StudioDashboardResponse(BaseModel):
    institution: dict
    metrics: dict
    recent_enrollments: list[dict]
    revenue_summary: dict
    pending_doubts: list[dict]
    course_performance: list[dict]
```

---

# 21. Remaining Services: Model Contract Summary

To keep your architecture clean, these services should follow the same structure.

## Landing Page Service

### Models

```text
LandingPage
- id
- institution_id
- status
- theme_json
- seo_json
- published_at

LandingPageSection
- id
- landing_page_id
- section_type
- title
- content_json
- order_index
- is_visible
```

### Request Models

```text
CreateLandingPageRequest
UpdateLandingPageRequest
CreateLandingSectionRequest
UpdateLandingSectionRequest
ReorderLandingSectionsRequest
UpdateLandingThemeRequest
UpdateLandingSEORequest
```

### Response Models

```text
LandingPageResponse
LandingPageSectionResponse
PublicLandingPageResponse
```

---

## Doubt Service

### Models

```text
Doubt
- id
- institution_id
- course_id
- lesson_id
- user_id
- title
- body
- status
- assigned_to_user_id

DoubtAnswer
- id
- doubt_id
- user_id
- body
- is_instructor_answer
- is_ai_generated
```

### Request Models

```text
CreateDoubtRequest
UpdateDoubtRequest
CreateDoubtAnswerRequest
UpdateDoubtAnswerRequest
AssignDoubtRequest
AIDraftAnswerRequest
```

### Response Models

```text
DoubtResponse
DoubtAnswerResponse
DoubtThreadResponse
```

---

## Quiz Service

### Models

```text
Quiz
- id
- course_id
- lesson_id
- title
- description
- status
- time_limit_minutes
- passing_score

Question
- id
- quiz_id
- question_type
- question_text
- options_json
- correct_answer_json
- marks

QuizAttempt
- id
- quiz_id
- user_id
- status
- score
- submitted_at
```

### Request Models

```text
CreateQuizRequest
UpdateQuizRequest
CreateQuestionRequest
UpdateQuestionRequest
StartQuizAttemptRequest
SubmitQuizAttemptRequest
```

### Response Models

```text
QuizResponse
QuestionResponse
QuizAttemptResponse
QuizResultResponse
```

---

## Assignment Service

### Models

```text
Assignment
- id
- course_id
- lesson_id
- title
- description
- due_date
- max_marks
- status

AssignmentSubmission
- id
- assignment_id
- user_id
- text_answer
- file_asset_id
- status
- marks_obtained
- feedback
```

### Request Models

```text
CreateAssignmentRequest
UpdateAssignmentRequest
SubmitAssignmentRequest
ReviewAssignmentRequest
RequestResubmissionRequest
```

### Response Models

```text
AssignmentResponse
AssignmentSubmissionResponse
AssignmentReviewResponse
```

---

## Certificate Service

### Models

```text
CertificateTemplate
- id
- institution_id
- name
- template_json
- background_asset_id
- is_default

Certificate
- id
- user_id
- course_id
- institution_id
- template_id
- verification_code
- certificate_url
- issued_at
```

### Request Models

```text
CreateCertificateTemplateRequest
UpdateCertificateTemplateRequest
GenerateCertificateRequest
VerifyCertificateRequest
```

### Response Models

```text
CertificateTemplateResponse
CertificateResponse
CertificateVerificationResponse
```

---

## Community Service

### Models

```text
CommunitySpace
- id
- institution_id
- course_id
- name
- description
- visibility

CommunityPost
- id
- space_id
- user_id
- title
- body
- post_type

CommunityComment
- id
- post_id
- user_id
- body
```

### Request Models

```text
CreateCommunitySpaceRequest
CreatePostRequest
UpdatePostRequest
CreateCommentRequest
UpdateCommentRequest
```

### Response Models

```text
CommunitySpaceResponse
CommunityPostResponse
CommunityCommentResponse
```

---

## Review Service

### Models

```text
Review
- id
- user_id
- institution_id
- course_id
- rating
- title
- body
- status

ReviewHelpfulVote
- id
- review_id
- user_id
```

### Request Models

```text
CreateCourseReviewRequest
CreateInstitutionReviewRequest
UpdateReviewRequest
ReportReviewRequest
```

### Response Models

```text
ReviewResponse
RatingSummaryResponse
```

---

## Marketing Service

### Models

```text
Campaign
- id
- institution_id
- name
- campaign_type
- status
- start_date
- end_date
- metadata_json

LeadForm
- id
- institution_id
- title
- fields_json

Lead
- id
- institution_id
- lead_form_id
- name
- email
- phone
- source

ReferralProgram
- id
- institution_id
- name
- reward_json
- is_active
```

### Request Models

```text
CreateCampaignRequest
UpdateCampaignRequest
LaunchCampaignRequest
CreateLeadFormRequest
SubmitLeadRequest
CreateReferralProgramRequest
```

### Response Models

```text
CampaignResponse
LeadFormResponse
LeadResponse
ReferralProgramResponse
CampaignAnalyticsResponse
```

---

## Admin Service

### Models

```text
AdminAction
- id
- admin_user_id
- action
- target_type
- target_id
- reason
- metadata_json
```

### Request Models

```text
SuspendUserRequest
ApproveInstitutionRequest
RejectInstitutionRequest
FeatureCourseRequest
ResolveReportRequest
UpdatePlatformSettingsRequest
```

### Response Models

```text
AdminUserResponse
AdminInstitutionResponse
AdminCourseResponse
AdminDashboardResponse
AdminActionResponse
```

---

## Audit Service

### Models

```text
AuditEvent
- id
- actor_user_id
- institution_id
- action
- resource_type
- resource_id
- ip_address
- user_agent
- metadata_json
```

### Request Models

```text
CreateAuditEventRequest
AuditSearchRequest
```

### Response Models

```text
AuditEventResponse
AuditEventListResponse
```

---

# 22. Final Service-to-Database Mapping

```text
auth_service             → auth_db
user_service             → user_db
institution_service      → institution_db
rbac_service             → rbac_db
course_service           → course_db
lesson_service           → lesson_db
media_service            → media_db
asset_service            → asset_db
enrollment_service       → enrollment_db
membership_service       → membership_db
payment_service          → payment_db
progress_service         → progress_db
search_service           → search_db + Meilisearch
ai_service               → ai_db + vector_db
analytics_service        → analytics_db
notification_service     → notification_db
landing_page_service     → landing_page_db
doubt_service            → doubt_db
quiz_service             → quiz_db
assignment_service       → assignment_db
certificate_service      → certificate_db
community_service        → community_db
review_service           → review_db
marketing_service        → marketing_db
admin_service            → admin_db
audit_service            → audit_db
api_gateway              → optional gateway_db
```

---

# 23. Most Important Rule for Your Coding Agent

Tell your agent this:

```text
Do not mix service responsibilities.

Auth service must not store learner profile.
Course service must not store lesson structure.
Lesson service must not store video files.
Payment service must not activate membership directly without event/API confirmation.
RBAC service must be checked before every institution/studio write action.
Gateway/BFF must not own business data.
Each service must have its own models, schemas, config, database session, repository layer, and service layer.
```

---

# 24. Recommended Immediate Implementation Order

Start with this exact order:

```text
1. shared backend template
2. api_gateway
3. auth_service
4. user_service
5. institution_service
6. rbac_service
7. course_service
8. lesson_service
9. media_service
10. enrollment_service
11. membership_service
12. payment_service
13. progress_service
14. search_service
15. notification_service
16. analytics_service
17. ai_service
```

After this, add:

```text
18. landing_page_service
19. doubt_service
20. quiz_service
21. assignment_service
22. certificate_service
23. community_service
24. review_service
25. marketing_service
26. admin_service
27. audit_service
```

This gives you a clean, scalable LearnioX V1 backend foundation.
