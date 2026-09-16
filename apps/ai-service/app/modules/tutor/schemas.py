from typing import List, Optional
from pydantic import BaseModel, Field


class DoubtQueryRequest(BaseModel):
    student_question: str = Field(..., min_length=3, description="The student's doubt or conceptual question")
    course_id: Optional[str] = Field(None, description="Course context UUID")
    lesson_id: Optional[str] = Field(None, description="Lesson context UUID")
    doubt_id: Optional[str] = Field(None, description="Discussion / doubt thread UUID if replying to an existing thread")
    context_snippet: Optional[str] = Field(None, description="Lecture transcript or textbook excerpt related to the question")


class TutorAnswerResponse(BaseModel):
    doubt_id: Optional[str] = None
    answer: str = Field(..., description="Pedagogical, clear explanation addressing the student's question")
    confidence: float = Field(default=0.95, description="Confidence score of the generated answer")
    suggested_followups: List[str] = Field(default_factory=list, description="Follow-up exploration questions")
    citations: List[str] = Field(default_factory=list, description="Lesson timestamps or transcript citations used")
