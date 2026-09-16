import enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.modules.assessments.types import AssessmentType


class DifficultyLevel(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


# ── Assessment Generation Schemas ─────────────────────────────────────────────

class MCQOptionItem(BaseModel):
    id: str
    text: str


class MatchingPair(BaseModel):
    id: Optional[str] = None
    left: str
    right: str


class TestCaseItem(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False


class GenerateAssessmentRequest(BaseModel):
    assessment_type: AssessmentType = Field(..., description="One of the 14 supported AssessmentType values")
    topic: str = Field(..., min_length=2, max_length=255, description="Primary topic or subject (e.g. 'Binary Search Trees', 'Docker Networking')")
    lesson_content: Optional[str] = Field(None, description="Optional lecture notes, markdown text, or transcript to generate questions from")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM, description="Target difficulty level (EASY, MEDIUM, HARD)")
    target_audience: Optional[str] = Field("Intermediate Developers / University Students", description="Target learner audience description")
    count: int = Field(default=1, ge=1, le=10, description="Number of questions/items to generate (1 to 10)")
    total_marks: int = Field(default=100, ge=1, description="Total marks for each generated assessment item")
    include_rubric: bool = Field(default=True, description="Whether to include grading rubric guidelines")
    include_reference_solution: bool = Field(default=True, description="Whether to generate an ideal answer/code solution")


class GeneratedAssessmentItem(BaseModel):
    assessment_type: AssessmentType
    title: str
    instructions: str
    difficulty: DifficultyLevel
    total_marks: int
    rubric_guidelines: Optional[str] = None
    reference_solution: Optional[str] = None
    
    # Optional type-specialized fields
    options: Optional[List[MCQOptionItem]] = None
    correct_option_id: Optional[str] = None
    correct_option_ids: Optional[List[str]] = None
    statement: Optional[str] = None
    correct_boolean: Optional[bool] = None
    starter_code: Optional[str] = None
    test_cases: Optional[List[TestCaseItem]] = None
    column_a: Optional[List[str]] = None
    column_b: Optional[List[str]] = None
    matching_pairs: Optional[List[MatchingPair]] = None
    correct_pairs: Optional[List[MatchingPair]] = None
    unordered_steps: Optional[List[str]] = None
    correct_step_order: Optional[List[str]] = None
    scenario: Optional[str] = None
    sub_questions: Optional[List[str]] = None
    deliverables: Optional[List[str]] = None
    expected_answers: Optional[List[str]] = None


class GenerateAssessmentResponse(BaseModel):
    assessment_type: AssessmentType
    topic: str
    difficulty: DifficultyLevel
    count: int
    items: List[GeneratedAssessmentItem] = Field(default_factory=list)


# ── Assessment Grading Schemas ────────────────────────────────────────────────

class RubricCriterion(BaseModel):
    criterion_name: str = Field(..., description="Name of the evaluated dimension (e.g. Correctness, Code Quality, Depth)")
    max_points: int = Field(..., description="Maximum points for this criterion")
    awarded_points: int = Field(..., description="Points awarded by AI evaluation")
    criterion_feedback: str = Field(..., description="Constructive feedback explaining the score")


class GradeAssessmentRequest(BaseModel):
    assessment_type: AssessmentType = Field(..., description="Type of assessment (from 14 supported types)")
    title: str = Field(..., description="Title of the assignment / question")
    instructions: str = Field(..., description="Problem statement, question prompt, or assignment guidelines")
    student_submission: str = Field(..., description="Student's submitted answer, text, code, or essay")
    total_marks: int = Field(default=100, description="Total maximum marks for this assessment", ge=1)
    rubric_guidelines: Optional[str] = Field(None, description="Optional custom grading rubric provided by creator")
    reference_solution: Optional[str] = Field(None, description="Optional ideal solution or expected answer key")


class GradeAssessmentResponse(BaseModel):
    assessment_type: AssessmentType
    score: int = Field(..., description="Calculated total marks awarded (0 to total_marks)")
    total_marks: int
    percentage: float = Field(..., description="Percentage score (0.0 to 100.0)")
    passed: bool = Field(..., description="Whether the submission meets passing criteria (>= 50%)")
    summary_feedback: str = Field(..., description="Overall executive feedback on the submission")
    rubric_breakdown: List[RubricCriterion] = Field(default_factory=list, description="Granular criteria scoring")
    strengths: List[str] = Field(default_factory=list, description="Key strong points of the submission")
    areas_for_improvement: List[str] = Field(default_factory=list, description="Actionable points to improve")
    suggested_correction: Optional[str] = Field(None, description="Optional code snippet or conceptual fix")
