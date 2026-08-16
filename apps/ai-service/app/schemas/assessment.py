from typing import List, Optional
from pydantic import BaseModel, Field
from app.core.enums import AssessmentType


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
