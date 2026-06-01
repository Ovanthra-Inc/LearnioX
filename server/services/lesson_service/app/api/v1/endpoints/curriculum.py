import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.schemas.requests import (
    CreateModuleRequest,
    UpdateModuleRequest,
    CreateLessonRequest,
    UpdateLessonRequest,
    ReorderCurriculumRequest
)
from app.schemas.responses import (
    CourseModuleResponse,
    LessonResponse,
    CurriculumResponse
)
from app.services.curriculum_service import CurriculumService
from learniox_common.schemas import APIResponse

router = APIRouter()


def _to_module_response(m) -> CourseModuleResponse:
    return CourseModuleResponse(
        id=m.id,
        course_id=m.course_id,
        title=m.title,
        description=m.description,
        order_index=m.order_index,
        created_at=m.created_at,
        updated_at=m.updated_at
    )


def _to_lesson_response(l) -> LessonResponse:
    return LessonResponse(
        id=l.id,
        course_id=l.course_id,
        module_id=l.module_id,
        title=l.title,
        description=l.description,
        lesson_type=l.lesson_type.value,
        access_type=l.access_type.value,
        order_index=l.order_index,
        video_id=l.video_id,
        asset_id=l.asset_id,
        content=l.content,
        external_url=l.external_url,
        duration_seconds=l.duration_seconds,
        is_published=l.is_published,
        metadata_json=l.metadata_json or {},
        created_at=l.created_at,
        updated_at=l.updated_at
    )


# ------------------ CURRICULUM OVERVIEW ------------------

@router.get("/courses/{course_id}/curriculum", response_model=APIResponse[CurriculumResponse])
async def get_curriculum(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    modules, lessons = await service.get_curriculum(course_id)
    return APIResponse(
        success=True,
        message="Curriculum retrieved",
        data=CurriculumResponse(
            course_id=course_id,
            modules=[_to_module_response(m) for m in modules],
            lessons=[_to_lesson_response(l) for l in lessons]
        )
    )


@router.put("/courses/{course_id}/curriculum/reorder", response_model=APIResponse[CurriculumResponse])
async def reorder_curriculum(
    course_id: uuid.UUID,
    request: ReorderCurriculumRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    modules, lessons = await service.reorder_curriculum(course_id, request)
    return APIResponse(
        success=True,
        message="Curriculum reordered successfully",
        data=CurriculumResponse(
            course_id=course_id,
            modules=[_to_module_response(m) for m in modules],
            lessons=[_to_lesson_response(l) for l in lessons]
        )
    )


# ------------------ MODULES CRUD ------------------

@router.post("/courses/{course_id}/modules", response_model=APIResponse[CourseModuleResponse])
async def create_module(
    course_id: uuid.UUID,
    request: CreateModuleRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    module = await service.create_module(course_id, request)
    return APIResponse(
        success=True,
        message="Module created successfully",
        data=_to_module_response(module)
    )


@router.get("/courses/{course_id}/modules", response_model=APIResponse[list[CourseModuleResponse]])
async def list_modules(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    modules = await service.list_modules(course_id)
    return APIResponse(
        success=True,
        message="Modules retrieved",
        data=[_to_module_response(m) for m in modules]
    )


@router.patch("/modules/{module_id}", response_model=APIResponse[CourseModuleResponse])
async def update_module(
    module_id: uuid.UUID,
    request: UpdateModuleRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    module = await service.update_module(module_id, request)
    return APIResponse(
        success=True,
        message="Module updated successfully",
        data=_to_module_response(module)
    )


@router.delete("/modules/{module_id}", response_model=APIResponse[dict])
async def delete_module(module_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    deleted = await service.delete_module(module_id)
    return APIResponse(
        success=deleted,
        message="Module and associated lessons deleted successfully" if deleted else "Module not found",
        data={}
    )


@router.put("/modules/{module_id}/reorder", response_model=APIResponse[list[LessonResponse]])
async def reorder_module_lessons(
    module_id: uuid.UUID,
    lesson_orders: dict[str, int], # maps lesson_id string to order_index int
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    orders = {uuid.UUID(k): v for k, v in lesson_orders.items()}
    await service.reorder_lessons(orders)
    lessons = await service.list_lessons(module_id)
    return APIResponse(
        success=True,
        message="Module lessons reordered successfully",
        data=[_to_lesson_response(l) for l in lessons]
    )


# ------------------ LESSONS CRUD ------------------

@router.post("/modules/{module_id}/lessons", response_model=APIResponse[LessonResponse])
async def create_lesson(
    module_id: uuid.UUID,
    request: CreateLessonRequest,
    course_id: uuid.UUID = Query(..., description="Course ID context for the lesson"),
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    lesson = await service.create_lesson(course_id, module_id, request)
    return APIResponse(
        success=True,
        message="Lesson created successfully",
        data=_to_lesson_response(lesson)
    )


@router.get("/modules/{module_id}/lessons", response_model=APIResponse[list[LessonResponse]])
async def list_lessons(module_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    lessons = await service.list_lessons(module_id)
    return APIResponse(
        success=True,
        message="Lessons retrieved",
        data=[_to_lesson_response(l) for l in lessons]
    )


@router.get("/lessons/{lesson_id}", response_model=APIResponse[LessonResponse])
async def get_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    lesson = await service.get_lesson_by_id(lesson_id)
    return APIResponse(
        success=True,
        message="Lesson retrieved",
        data=_to_lesson_response(lesson)
    )


@router.patch("/lessons/{lesson_id}", response_model=APIResponse[LessonResponse])
async def update_lesson(
    lesson_id: uuid.UUID,
    request: UpdateLessonRequest,
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    lesson = await service.update_lesson(lesson_id, request)
    return APIResponse(
        success=True,
        message="Lesson updated successfully",
        data=_to_lesson_response(lesson)
    )


@router.delete("/lessons/{lesson_id}", response_model=APIResponse[dict])
async def delete_lesson(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    deleted = await service.delete_lesson(lesson_id)
    return APIResponse(
        success=deleted,
        message="Lesson deleted successfully" if deleted else "Lesson not found",
        data={}
    )


@router.put("/lessons/{lesson_id}/reorder", response_model=APIResponse[dict])
async def reorder_single_lesson(
    lesson_id: uuid.UUID,
    order_index: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    lesson = await service.get_lesson_by_id(lesson_id)
    await service.reorder_lessons({lesson_id: order_index})
    return APIResponse(
        success=True,
        message="Lesson order updated successfully",
        data={"lesson_id": lesson_id, "order_index": order_index}
    )


# ------------------ SPECIALIZED LESSON PATCHES ------------------

@router.patch("/lessons/{lesson_id}/access", response_model=APIResponse[LessonResponse])
async def patch_lesson_access(
    lesson_id: uuid.UUID,
    access_type: str = Query(..., description="Access type: free_preview, enrolled_only, membership_only, private"),
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    lesson = await service.patch_lesson_access(lesson_id, access_type)
    return APIResponse(
        success=True,
        message="Lesson access updated",
        data=_to_lesson_response(lesson)
    )


@router.patch("/lessons/{lesson_id}/drip-schedule", response_model=APIResponse[LessonResponse])
async def patch_lesson_drip_schedule(
    lesson_id: uuid.UUID,
    drip_config: dict,
    db: AsyncSession = Depends(get_db)
):
    service = CurriculumService(db)
    lesson = await service.patch_lesson_drip(lesson_id, drip_config)
    return APIResponse(
        success=True,
        message="Lesson drip schedule updated",
        data=_to_lesson_response(lesson)
    )


@router.post("/lessons/{lesson_id}/mark-preview", response_model=APIResponse[LessonResponse])
async def mark_lesson_preview(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    lesson = await service.mark_preview(lesson_id)
    return APIResponse(
        success=True,
        message="Lesson marked as free preview",
        data=_to_lesson_response(lesson)
    )


@router.post("/lessons/{lesson_id}/remove-preview", response_model=APIResponse[LessonResponse])
async def remove_lesson_preview(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    lesson = await service.remove_preview(lesson_id)
    return APIResponse(
        success=True,
        message="Lesson removed from free preview",
        data=_to_lesson_response(lesson)
    )


# ------------------ PUBLIC CURRICULUM PREVIEW ------------------

@router.get("/public/courses/{course_id}/curriculum-preview", response_model=APIResponse[CurriculumResponse])
async def get_public_curriculum_preview(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CurriculumService(db)
    modules, lessons = await service.get_curriculum(course_id)
    
    # Filter only published modules or lessons, or just return them labeled correctly
    # Let's return all modules, but for lessons, let's filter out private lessons or customize
    # Let's filter out private lessons, return only non-private or free previews if it's public preview
    public_lessons = [l for l in lessons if l.access_type.value in ["free_preview", "enrolled_only", "membership_only"]]
    
    return APIResponse(
        success=True,
        message="Public curriculum preview retrieved",
        data=CurriculumResponse(
            course_id=course_id,
            modules=[_to_module_response(m) for m in modules],
            lessons=[_to_lesson_response(l) for l in public_lessons]
        )
    )
