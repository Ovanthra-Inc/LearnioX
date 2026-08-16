from typing import List
from fastapi import APIRouter, status
from app.schemas.response import APIResponse
from app.core.enums import AssessmentType
from app.schemas.assessment import GradeAssessmentRequest, GradeAssessmentResponse
from app.schemas.generation import GenerateAssessmentRequest, GenerateAssessmentResponse
from app.tasks.assessment_grader import assessment_grader_task
from app.tasks.assessment_generator import assessment_generator_task

router = APIRouter(prefix="/assessments", tags=["Assessments AI"])


@router.get(
    "/types",
    summary="Get All 14 Supported Assessment Types",
    response_model=APIResponse[List[dict]],
)
async def get_supported_assessment_types():
    """
    Returns the list of 14 creator-selectable assessment types with descriptive metadata.
    """
    types_meta = [
        {"type": AssessmentType.MCQ, "label": "Multiple Choice Quiz", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.TRUE_FALSE, "label": "True / False", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.MULTIPLE_SELECT, "label": "Multiple Select", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.FILL_IN_BLANK, "label": "Fill in the Blank", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.SHORT_ANSWER, "label": "Short Answer", "difficulty": "MEDIUM", "category": "Subjective"},
        {"type": AssessmentType.LONG_ANSWER_ESSAY, "label": "Long Answer / Essay", "difficulty": "MEDIUM", "category": "Subjective"},
        {"type": AssessmentType.CODING_QUESTION, "label": "Coding Question", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.FILE_UPLOAD_ASSIGNMENT, "label": "Assignment / File Upload", "difficulty": "MEDIUM", "category": "Applied"},
        {"type": AssessmentType.MATCHING, "label": "Matching Columns", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.ORDERING, "label": "Ordering / Pipeline Steps", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.CASE_STUDY, "label": "Case Study Analysis", "difficulty": "MEDIUM", "category": "Analytical"},
        {"type": AssessmentType.PROJECT, "label": "Comprehensive Project", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.PRACTICAL_LAB, "label": "Hands-on Practical / Lab", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.COURSE_FINAL_EXAM, "label": "Course Final Exam", "difficulty": "MEDIUM", "category": "Comprehensive"},
    ]
    return APIResponse.ok(
        data=types_meta,
        message="Supported assessment types retrieved successfully",
    )

@router.post(
    "/generate",
    summary="Synthesize & Generate Assessments with AI (All 14 Types)",
    response_model=APIResponse[GenerateAssessmentResponse],
    status_code=status.HTTP_200_OK,
)
async def generate_assessments(request: GenerateAssessmentRequest):
    """
    Synthesizes complete, ready-to-use assessment items (problem statement, starter code,
    test cases, options, matching pairs, rubrics) for creators across any of the 14 assessment types.
    """
    result = await assessment_generator_task.execute(request)
    return APIResponse.ok(
        data=result,
        message=f"Generated {result.count} {request.assessment_type.value} assessment item(s) for topic '{request.topic}'",
    )


@router.post(
    "/grade",
    summary="Evaluate & Grade Student Assessment Submission",
    response_model=APIResponse[GradeAssessmentResponse],
    status_code=status.HTTP_200_OK,
)
async def grade_assessment(request: GradeAssessmentRequest):
    """
    Evaluates a student's submission across any of the 14 assessment types using
    specialized AI rubrics and returns an objective score, rubric breakdown, and constructive feedback.
    """
    result = await assessment_grader_task.execute(request)
    return APIResponse.ok(
        data=result,
        message=f"Assessment evaluated successfully as {request.assessment_type.value}",
    )
