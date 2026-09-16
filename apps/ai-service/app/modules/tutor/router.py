from fastapi import APIRouter, status
from app.schemas.response import APIResponse
from app.modules.tutor.schemas import DoubtQueryRequest, TutorAnswerResponse
from app.modules.tutor.service import tutor_module_service

router = APIRouter(prefix="/tutor", tags=["AI Tutor & Doubt Resolver"])


@router.post(
    "/ask",
    summary="Ask In-Classroom AI Tutor a Question",
    response_model=APIResponse[TutorAnswerResponse],
    status_code=status.HTTP_200_OK,
)
async def ask_tutor(request: DoubtQueryRequest):
    """
    Evaluates student questions using course lecture context and provides
    contextual, Socratic, pedagogical explanations.
    """
    result = await tutor_module_service.answer_doubt(request)
    return APIResponse.ok(data=result, message="Tutor response generated successfully")


@router.post(
    "/draft-answer",
    summary="Draft Instructor Answer to a Discussion Thread",
    response_model=APIResponse[TutorAnswerResponse],
    status_code=status.HTTP_200_OK,
)
async def draft_doubt_answer(request: DoubtQueryRequest):
    """
    Assists instructors by drafting a high-quality suggested response to a student's public discussion doubt.
    """
    result = await tutor_module_service.answer_doubt(request)
    return APIResponse.ok(data=result, message="Draft answer generated")
