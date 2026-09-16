from fastapi import APIRouter, status
from app.schemas.response import APIResponse
from app.modules.curriculum.schemas import CourseOutlineRequest, CourseOutlineResponse
from app.modules.curriculum.service import curriculum_module_service

router = APIRouter(prefix="/curriculum", tags=["AI Curriculum & Course Generator"])


@router.post(
    "/course-outline",
    summary="Generate Complete Course Outline & Syllabus",
    response_model=APIResponse[CourseOutlineResponse],
    status_code=status.HTTP_200_OK,
)
async def generate_course_outline(request: CourseOutlineRequest):
    """
    Synthesizes a pedagogical course structure including title, description,
    module hierarchy, and lesson breakdowns.
    """
    result = await curriculum_module_service.generate_outline(request)
    return APIResponse.ok(
        data=result,
        message=f"Course syllabus generated successfully for '{request.topic}'",
    )
