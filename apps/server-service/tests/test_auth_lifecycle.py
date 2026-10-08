import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.core.exceptions import ConflictException, UnauthorizedException, ValidationException
from app.core.security import get_password_hash, create_refresh_token
from app.schemas.auth import LoginRequest, SignupRequest
from app.services.auth_service import AuthService


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.flush = AsyncMock()
    return session


@pytest.fixture
def auth_service(mock_db):
    service = AuthService(db=mock_db)
    service.user_repo = MagicMock()
    service.token_repo = MagicMock()
    return service


def _create_fake_user(user_id, email, name, hashed_pw=None):
    user = MagicMock()
    user.id = user_id
    user.email = email
    user.name = name
    user.hashed_password = hashed_pw
    user.is_verified = True
    user.is_active = True
    user.role = "STUDENT"
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    user.avatar_file_id = None
    user.picture = None
    user.headline = None
    user.bio = None
    user.last_login_at = None
    user.last_login_method = None
    user.phone = None
    user.language = "en"
    user.theme = "dark"
    user.language_preference = "en"
    user.timezone = "UTC"
    user.provider = "LOCAL"
    user.signup_method = "EMAIL"
    return user


@pytest.mark.asyncio
async def test_user_signup_and_password_hashing(auth_service):
    """Test user signup with secure password hashing and verification token generation."""
    user_id = uuid.uuid4()
    signup_payload = SignupRequest(
        name="Ada Lovelace",
        email="ada@example.com",
        password="SuperSecretPassword123!",
    )

    # Email not taken
    auth_service.user_repo.get_by_email = AsyncMock(return_value=None)
    fake_user = _create_fake_user(user_id, "ada@example.com", "Ada Lovelace")
    fake_user.is_verified = False

    auth_service.user_repo.create_email_user = AsyncMock(return_value=fake_user)
    auth_service.user_repo.log_auth_audit = AsyncMock()
    auth_service.token_repo.create_refresh_token = AsyncMock()

    with patch("app.services.email_service.EmailService.send_verification_email", new_callable=AsyncMock):
        res = await auth_service.register_email_user(signup_payload)
        assert res.access_token is not None
        assert res.refresh_token is not None
        assert res.user.email == "ada@example.com"

        # Verify password was hashed and not stored in plaintext
        call_args = auth_service.user_repo.create_email_user.call_args[1]
        assert call_args["hashed_password"] != "SuperSecretPassword123!"
        assert call_args["hashed_password"].startswith("$2b$") or len(call_args["hashed_password"]) > 20


@pytest.mark.asyncio
async def test_user_signup_duplicate_email_conflict(auth_service):
    """Test user signup rejects existing email with ConflictException."""
    auth_service.user_repo.get_by_email = AsyncMock(return_value=MagicMock())
    payload = SignupRequest(name="Existing", email="existing@example.com", password="Password123!")

    with pytest.raises(ConflictException):
        await auth_service.register_email_user(payload)


@pytest.mark.asyncio
async def test_email_verification_lifecycle(auth_service):
    """Test valid verification token activates email and expired token is rejected."""
    user_id = uuid.uuid4()
    fake_user = MagicMock()
    fake_user.id = user_id
    fake_user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=2)

    auth_service.user_repo.get_by_verification_token = AsyncMock(return_value=fake_user)
    auth_service.user_repo.set_email_verified = AsyncMock()
    auth_service.user_repo.log_auth_audit = AsyncMock()

    verified = await auth_service.verify_email("valid_token_123")
    assert verified is True
    auth_service.user_repo.set_email_verified.assert_called_once_with(user_id)

    # Expired token rejection
    fake_user.verification_token_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    with pytest.raises(ValidationException):
        await auth_service.verify_email("expired_token_123")


@pytest.mark.asyncio
async def test_authenticate_with_password_success_and_disabled(auth_service):
    """Test successful credential verification, audit trail, and disabled account guard."""
    user_id = uuid.uuid4()
    raw_pw = "ValidPass123!"
    hashed_pw = get_password_hash(raw_pw)

    fake_user = _create_fake_user(user_id, "student@learniox.com", "Student", hashed_pw=hashed_pw)

    auth_service.user_repo.get_by_email = AsyncMock(return_value=fake_user)
    auth_service.user_repo.log_auth_audit = AsyncMock()
    auth_service.user_repo.update_last_login = AsyncMock()
    auth_service.token_repo.create_refresh_token = AsyncMock()

    # 1. Valid password
    req = LoginRequest(email="student@learniox.com", password=raw_pw)
    res = await auth_service.authenticate_with_password(req)
    assert res.access_token is not None
    assert res.refresh_token is not None
    assert res.user.email == "student@learniox.com"

    # 2. Invalid password
    req_bad = LoginRequest(email="student@learniox.com", password="WrongPassword!")
    with pytest.raises(UnauthorizedException):
        await auth_service.authenticate_with_password(req_bad)

    # 3. Disabled account
    fake_user.is_active = False
    with pytest.raises(UnauthorizedException):
        await auth_service.authenticate_with_password(req)


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_revocation(auth_service):
    """Test refresh token rotation issues fresh tokens and revokes old tokens."""
    user_id = uuid.uuid4()
    raw_refresh, token_hash, expires_at = create_refresh_token(str(user_id))

    fake_token = MagicMock()
    fake_token.revoked_at = None
    fake_token.expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    fake_user = MagicMock()
    fake_user.id = user_id
    fake_user.email = "student@learniox.com"
    fake_user.is_active = True

    auth_service.token_repo.get_by_hash = AsyncMock(return_value=fake_token)
    auth_service.token_repo.rotate_refresh_token = AsyncMock()
    auth_service.user_repo.get_by_id = AsyncMock(return_value=fake_user)

    res = await auth_service.refresh_access_token(raw_refresh)
    assert res.access_token is not None
    assert res.refresh_token is not None
    assert res.refresh_token != raw_refresh
    auth_service.token_repo.rotate_refresh_token.assert_called_once()

    # Test already revoked token fails
    fake_token.revoked_at = datetime.now(timezone.utc)
    with pytest.raises(UnauthorizedException):
        await auth_service.refresh_access_token(raw_refresh)
