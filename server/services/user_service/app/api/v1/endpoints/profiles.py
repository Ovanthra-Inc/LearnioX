from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from learniox_common.schemas import APIResponse, EmptyResponse
import uuid

from app.dependencies.db import get_db
from app.schemas.requests import (
    CreateUserProfileRequest,
    UpdateUserProfileRequest,
    UpdatePreferencesRequest,
    UpdateInterestsRequest,
)
from app.schemas.responses import UserProfileResponse, SavedCourseResponse, FollowedInstitutionResponse
from app.services.profile_service import ProfileService
from app.services.saved_course_service import SavedCourseService
from app.services.follow_service import FollowService

router = APIRouter()


def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="x-user-id header is missing"
        )
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid x-user-id header"
        )


def _to_profile_response(p) -> UserProfileResponse:
    return UserProfileResponse(
        id=p.id,
        auth_user_id=p.auth_user_id,
        full_name=p.full_name,
        username=p.username,
        avatar_url=p.avatar_url,
        bio=p.bio,
        user_type=p.user_type.value,
        language=p.language,
        country=p.country,
        interests=p.interests or {},
        preferences=p.preferences or {},
        created_at=p.created_at,
        updated_at=p.updated_at
    )


# ------------------ PROFILE CRUD ------------------

@router.post("", response_model=APIResponse[UserProfileResponse])
async def create_profile(request: CreateUserProfileRequest, db: AsyncSession = Depends(get_db)):
    service = ProfileService(db)
    profile = await service.create_profile(request)
    return APIResponse(
        success=True,
        message="Profile created successfully",
        data=_to_profile_response(profile)
    )


@router.get("/me/profile", response_model=APIResponse[UserProfileResponse])
async def get_my_profile(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.get_profile_by_auth_user_id(user_id)
    return APIResponse(
        success=True,
        message="Profile retrieved",
        data=_to_profile_response(profile)
    )


@router.patch("/me/profile", response_model=APIResponse[UserProfileResponse])
async def update_my_profile(
    request: UpdateUserProfileRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.update_profile(user_id, request)
    return APIResponse(
        success=True,
        message="Profile updated",
        data=_to_profile_response(profile)
    )


@router.get("/{user_id}/public-profile", response_model=APIResponse[UserProfileResponse])
async def get_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.get_profile_by_auth_user_id(user_id)
    return APIResponse(
        success=True,
        message="Public profile retrieved",
        data=_to_profile_response(profile)
    )


# ------------------ PREFERENCES / INTERESTS ------------------

@router.get("/me/preferences", response_model=APIResponse[dict])
async def get_preferences(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.get_profile_by_auth_user_id(user_id)
    return APIResponse(
        success=True,
        message="Preferences retrieved",
        data=profile.preferences or {}
    )


@router.patch("/me/preferences", response_model=APIResponse[UserProfileResponse])
async def update_preferences(
    request: UpdatePreferencesRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.update_preferences(user_id, request.preferences)
    return APIResponse(
        success=True,
        message="Preferences updated",
        data=_to_profile_response(profile)
    )


@router.get("/me/interests", response_model=APIResponse[dict])
async def get_interests(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.get_profile_by_auth_user_id(user_id)
    return APIResponse(
        success=True,
        message="Interests retrieved",
        data=profile.interests or {}
    )


@router.put("/me/interests", response_model=APIResponse[UserProfileResponse])
async def update_interests(
    request: UpdateInterestsRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = ProfileService(db)
    profile = await service.update_interests(user_id, request.interests)
    return APIResponse(
        success=True,
        message="Interests updated",
        data=_to_profile_response(profile)
    )


# ------------------ SAVED COURSES ------------------

@router.get("/me/saved-courses", response_model=APIResponse[list[SavedCourseResponse]])
async def get_saved_courses(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = SavedCourseService(db)
    saved_list = await service.get_saved_courses(user_id)
    res = [SavedCourseResponse(id=s.id, user_id=s.user_id, course_id=s.course_id, created_at=s.created_at) for s in saved_list]
    return APIResponse(
        success=True,
        message="Saved courses retrieved",
        data=res
    )


@router.post("/me/saved-courses/{course_id}", response_model=APIResponse[SavedCourseResponse])
async def save_course(
    course_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = SavedCourseService(db)
    saved = await service.save_course(user_id, course_id)
    return APIResponse(
        success=True,
        message="Course saved successfully",
        data=SavedCourseResponse(id=saved.id, user_id=saved.user_id, course_id=saved.course_id, created_at=saved.created_at)
    )


@router.delete("/me/saved-courses/{course_id}", response_model=APIResponse[dict])
async def unsave_course(
    course_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = SavedCourseService(db)
    removed = await service.unsave_course(user_id, course_id)
    return APIResponse(
        success=removed,
        message="Course unsaved successfully" if removed else "Course was not saved",
        data={}
    )


# ------------------ FOLLOWED INSTITUTIONS ------------------

@router.get("/me/following/institutions", response_model=APIResponse[list[FollowedInstitutionResponse]])
async def get_followed_institutions(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    followed_list = await service.get_followed_institutions(user_id)
    res = [FollowedInstitutionResponse(id=f.id, user_id=f.user_id, institution_id=f.institution_id, created_at=f.created_at) for f in followed_list]
    return APIResponse(
        success=True,
        message="Followed institutions retrieved",
        data=res
    )


@router.post("/me/following/institutions/{institution_id}", response_model=APIResponse[FollowedInstitutionResponse])
async def follow_institution(
    institution_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    followed = await service.follow_institution(user_id, institution_id)
    return APIResponse(
        success=True,
        message="Institution followed successfully",
        data=FollowedInstitutionResponse(id=followed.id, user_id=followed.user_id, institution_id=followed.institution_id, created_at=followed.created_at)
    )


@router.delete("/me/following/institutions/{institution_id}", response_model=APIResponse[dict])
async def unfollow_institution(
    institution_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    service = FollowService(db)
    removed = await service.unfollow_institution(user_id, institution_id)
    return APIResponse(
        success=removed,
        message="Institution unfollowed successfully" if removed else "Institution was not followed",
        data={}
    )
