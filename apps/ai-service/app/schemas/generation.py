import enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.core.enums import AssessmentType


class DifficultyLevel(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


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


class MCQOptionItem(BaseModel):
    id: str
    text: str


class MatchingPair(BaseModel):
    left: str
    right: str


class TestCaseItem(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False


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
