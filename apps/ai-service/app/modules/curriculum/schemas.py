from typing import List, Optional
from pydantic import BaseModel, Field


class CourseOutlineRequest(BaseModel):
    topic: str = Field(..., min_length=2, description="Course topic or title (e.g. 'Advanced Distributed Systems in Go')")
    target_audience: str = Field(default="Intermediate Developers", description="Target student skill level and background")
    level: str = Field(default="INTERMEDIATE", description="BEGINNER, INTERMEDIATE, or ADVANCED")
    num_modules: int = Field(default=4, ge=1, le=12, description="Target number of course modules")
    lessons_per_module: int = Field(default=3, ge=1, le=8, description="Target lessons per module")


class LectureOutlineItem(BaseModel):
    title: str
    duration_minutes: int = 15
    key_takeaways: List[str] = Field(default_factory=list)


class ModuleOutlineItem(BaseModel):
    module_number: int
    title: str
    description: str
    lessons: List[LectureOutlineItem] = Field(default_factory=list)


class CourseOutlineResponse(BaseModel):
    course_title: str
    subtitle: str
    description: str
    target_audience: str
    level: str
    total_estimated_hours: float
    modules: List[ModuleOutlineItem] = Field(default_factory=list)
