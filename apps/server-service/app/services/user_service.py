from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import AvatarRequest, UserPreferencesRequest, UserResponse, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_profile(self, user_id: UUID) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")
        return UserResponse.model_validate(user)

    async def update_profile(self, user_id: UUID, payload: UserUpdate) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")

        update_dict = payload.model_dump(exclude_unset=True)
        updated_user = await self.user_repo.update_user(user, update_dict)
        return UserResponse.model_validate(updated_user)

    async def update_avatar(self, user_id: UUID, payload: AvatarRequest) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")

        updated_user = await self.user_repo.update_user(user, {"avatar_file_id": payload.file_id})
        return UserResponse.model_validate(updated_user)

    async def delete_avatar(self, user_id: UUID) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")

        updated_user = await self.user_repo.update_user(user, {"avatar_file_id": None})
        return UserResponse.model_validate(updated_user)

    async def update_preferences(self, user_id: UUID, payload: UserPreferencesRequest) -> UserResponse:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")

        update_dict = payload.model_dump(exclude_unset=True)
        updated_user = await self.user_repo.update_user(user, update_dict)
        return UserResponse.model_validate(updated_user)

    async def deactivate_account(self, user_id: UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found", error_code="USER_NOT_FOUND")

        await self.user_repo.update_user(user, {"is_active": False})
