from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, get_curriculum_service
from app.core.response import APIResponse
from app.models.user import User
from app.schemas.curriculum import (
    CreateModuleRequest,
    ModuleResponse,
    ReorderModulesRequest,
    UpdateModuleRequest,
)
from app.services.curriculum_service import CurriculumService

router = APIRouter(tags=["Course Modules"])


@router.post(
    "/courses/{course_id}/modules",
    summary="Create Module in Course",
    response_model=APIResponse[ModuleResponse],
    status_code=201,
)
async def create_module(
    course_id: UUID,
    body: CreateModuleRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.create_module(course_id=course_id, user_id=current_user.id, payload=body)
    return APIResponse.ok(data=result, message="Module created successfully")


@router.get(
    "/courses/{course_id}/modules",
    summary="List Modules in Course",
    response_model=APIResponse[List[ModuleResponse]],
)
async def list_modules(
    course_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.list_modules(course_id=course_id)
    return APIResponse.ok(data=result, message="Course modules listed successfully")


@router.get(
    "/modules/{module_id}",
    summary="Get Module Details",
    response_model=APIResponse[ModuleResponse],
)
async def get_module_by_id(
    module_id: UUID,
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.get_module(module_id=module_id)
    return APIResponse.ok(data=result, message="Module details retrieved")


@router.patch(
    "/modules/{module_id}",
    summary="Update Module",
    response_model=APIResponse[ModuleResponse],
)
async def update_module(
    module_id: UUID,
    body: UpdateModuleRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    result = await service.update_module(module_id=module_id, user_id=current_user.id, payload=body)
    return APIResponse.ok(data=result, message="Module updated successfully")


@router.delete(
    "/modules/{module_id}",
    summary="Delete Module",
    response_model=APIResponse[None],
)
async def delete_module(
    module_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.delete_module(module_id=module_id, user_id=current_user.id)
    return APIResponse.ok(message="Module deleted successfully")


@router.patch(
    "/courses/{course_id}/modules/reorder",
    summary="Reorder Modules in Course",
    response_model=APIResponse[None],
)
async def reorder_modules(
    course_id: UUID,
    body: ReorderModulesRequest,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
):
    await service.reorder_modules(course_id=course_id, user_id=current_user.id, payload=body)
    return APIResponse.ok(message="Modules reordered successfully")
