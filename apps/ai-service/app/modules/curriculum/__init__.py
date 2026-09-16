from app.modules.curriculum.schemas import (
    CourseOutlineRequest,
    CourseOutlineResponse,
    ModuleOutlineItem,
    LectureOutlineItem,
)
from app.modules.curriculum.service import (
    CurriculumModuleService,
    curriculum_module_service,
)
from app.modules.curriculum.router import router as curriculum_router

__all__ = [
    "CourseOutlineRequest",
    "CourseOutlineResponse",
    "ModuleOutlineItem",
    "LectureOutlineItem",
    "CurriculumModuleService",
    "curriculum_module_service",
    "curriculum_router",
]
