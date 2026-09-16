from typing import List, Optional
from pydantic import BaseModel, Field


class ChapterItem(BaseModel):
    start_seconds: float = Field(..., description="Chapter start time in seconds")
    end_seconds: float = Field(..., description="Chapter end time in seconds")
    title: str = Field(..., description="Descriptive chapter title")
    summary: str = Field(..., description="Brief synopsis of this chapter")


class VideoSummaryRequest(BaseModel):
    video_title: str = Field(..., description="Lecture video title")
    transcript_text: str = Field(..., min_length=20, description="Full transcript or excerpt of the lecture")
    target_chapters_count: int = Field(default=4, ge=2, le=10, description="Desired number of chapters")


class VideoSummaryResponse(BaseModel):
    video_title: str
    executive_summary: str
    key_takeaways: List[str] = Field(default_factory=list)
    chapters: List[ChapterItem] = Field(default_factory=list)
    generated_notes_markdown: str
