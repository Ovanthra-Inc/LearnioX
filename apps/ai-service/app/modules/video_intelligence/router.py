from fastapi import APIRouter, status
from app.schemas.response import APIResponse
from app.modules.video_intelligence.schemas import VideoSummaryRequest, VideoSummaryResponse
from app.modules.video_intelligence.service import video_intelligence_module_service

router = APIRouter(prefix="/video", tags=["Video Intelligence & Summaries"])


@router.post(
    "/summary",
    summary="Generate Video Summary, Chapters & Study Notes",
    response_model=APIResponse[VideoSummaryResponse],
    status_code=status.HTTP_200_OK,
)
async def generate_video_summary(request: VideoSummaryRequest):
    """
    Analyzes lecture transcripts to synthesize an executive summary,
    chapter timestamps, key takeaways, and formatted markdown notes.
    """
    result = await video_intelligence_module_service.generate_summary(request)
    return APIResponse.ok(data=result, message="Video summary and notes generated successfully")
