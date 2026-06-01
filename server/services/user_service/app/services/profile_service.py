import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user_profile import UserProfile, UserType
from app.repositories.profile_repository import ProfileRepository
from app.schemas.requests import CreateUserProfileRequest, UpdateUserProfileRequest


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_repo = ProfileRepository(db)

    async def create_profile(self, request: CreateUserProfileRequest) -> UserProfile:
        existing = await self.profile_repo.get_by_auth_user_id(request.auth_user_id)
        if existing:
            return existing

        # Basic unique username generator
        base_username = request.email.split("@")[0] if request.email else f"user_{str(uuid.uuid4())[:8]}"
        username = base_username
        counter = 1
        while await self.profile_repo.get_by_username(username):
            username = f"{base_username}_{counter}"
            counter += 1

        profile = UserProfile(
            auth_user_id=request.auth_user_id,
            full_name=request.full_name,
            username=username,
            user_type=UserType.LEARNER
        )
        return await self.profile_repo.create(profile)

    async def get_profile_by_auth_user_id(self, auth_user_id: uuid.UUID) -> UserProfile:
        profile = await self.profile_repo.get_by_auth_user_id(auth_user_id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        return profile

    async def update_profile(self, auth_user_id: uuid.UUID, request: UpdateUserProfileRequest) -> UserProfile:
        profile = await self.get_profile_by_auth_user_id(auth_user_id)

        if request.full_name is not None:
            profile.full_name = request.full_name
        if request.username is not None:
            # Check username uniqueness if changing
            if request.username != profile.username:
                existing = await self.profile_repo.get_by_username(request.username)
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Username is already taken"
                    )
            profile.username = request.username
        if request.avatar_url is not None:
            profile.avatar_url = request.avatar_url
        if request.bio is not None:
            profile.bio = request.bio
        if request.language is not None:
            profile.language = request.language
        if request.country is not None:
            profile.country = request.country

        return await self.profile_repo.update(profile)

    async def update_preferences(self, auth_user_id: uuid.UUID, preferences: dict) -> UserProfile:
        profile = await self.get_profile_by_auth_user_id(auth_user_id)
        profile.preferences = preferences
        return await self.profile_repo.update(profile)

    async def update_interests(self, auth_user_id: uuid.UUID, interests: list[str]) -> UserProfile:
        profile = await self.get_profile_by_auth_user_id(auth_user_id)
        profile.interests = {"interests": interests}
        return await self.profile_repo.update(profile)
