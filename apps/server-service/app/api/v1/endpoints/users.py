from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, get_user_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.user import AvatarRequest, UserPreferencesRequest, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    summary="Get User Profile",
    response_model=APIResponse[UserResponse],
)
async def get_user_me(
    current_user: User = Depends(get_current_active_user),
):
    return APIResponse.ok(
        data=UserResponse.model_validate(current_user),
        message="User profile retrieved successfully",
    )


@router.patch(
    "/me",
    summary="Update User Profile",
    response_model=APIResponse[UserResponse],
)
async def update_user_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.update_profile(current_user.id, body)
    return APIResponse.ok(data=updated, message="User profile updated successfully")


@router.delete(
    "/me",
    summary="Deactivate Current User Account",
    response_model=APIResponse[None],
)
async def delete_user_me(
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    await service.deactivate_account(current_user.id)
    return APIResponse.ok(message="User account deactivated successfully")


@router.patch(
    "/avatar",
    summary="Update User Profile Avatar File",
    response_model=APIResponse[UserResponse],
)
async def update_user_avatar(
    body: AvatarRequest,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.update_avatar(current_user.id, body)
    return APIResponse.ok(data=updated, message="Avatar updated successfully")


@router.delete(
    "/avatar",
    summary="Remove User Profile Avatar File",
    response_model=APIResponse[UserResponse],
)
async def delete_user_avatar(
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.delete_avatar(current_user.id)
    return APIResponse.ok(data=updated, message="Avatar removed successfully")


@router.patch(
    "/preferences",
    summary="Update User Preferences (Language, Theme)",
    response_model=APIResponse[UserResponse],
)
async def update_user_preferences(
    body: UserPreferencesRequest,
    current_user: User = Depends(get_current_active_user),
    service: UserService = Depends(get_user_service),
):
    updated = await service.update_preferences(current_user.id, body)
    return APIResponse.ok(data=updated, message="User preferences updated successfully")
