from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(
        self,
        email: str,
        name: str,
        picture: Optional[str] = None,
        provider: str = "google",
        provider_id: Optional[str] = None,
    ) -> User:
        user = User(
            email=email,
            name=name,
            picture=picture,
            provider=provider,
            provider_id=provider_id,
            is_active=True,
            is_verified=True,
            last_login=datetime.now(timezone.utc),
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user_id: UUID) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login=datetime.now(timezone.utc))
        )

    async def update_user(self, user: User, update_data: dict) -> User:
        # FIX #26: Block overwriting privileged fields via the generic update method
        _PROTECTED_FIELDS = {"is_superuser", "is_active", "provider", "provider_id", "email", "id"}
        for key, value in update_data.items():
            if key in _PROTECTED_FIELDS:
                continue  # Silently skip protected fields
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user
