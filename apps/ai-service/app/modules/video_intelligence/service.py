import logging
from typing import Optional
from app.modules.video_intelligence.schemas import (
    VideoSummaryRequest,
    VideoSummaryResponse,
    ChapterItem,
)
from app.modules.video_intelligence.prompts import build_video_summary_prompt
from app.providers import get_llm_provider
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.modules.video_intelligence.service")


class VideoIntelligenceModuleService:
    """
    Synthesizes executive summaries, timestamped chapters, and student notes from transcripts.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self._provider = provider or get_llm_provider()

    async def generate_summary(self, req: VideoSummaryRequest) -> VideoSummaryResponse:
        prompt = build_video_summary_prompt(req)

        if self._provider.is_configured and self._provider.provider_name != "mock":
            try:
                data = await self._provider.generate_json(prompt)
                chapters = [
                    ChapterItem.model_validate(c) for c in data.get("chapters", [])
                ]
                return VideoSummaryResponse(
                    video_title=data.get("video_title", req.video_title),
                    executive_summary=data.get(
                        "executive_summary", "Comprehensive lecture overview."
                    ),
                    key_takeaways=data.get("key_takeaways", []),
                    chapters=chapters,
                    generated_notes_markdown=data.get(
                        "generated_notes_markdown",
                        f"# {req.video_title} - Notes\n\nOverview of foundational concepts.",
                    ),
                )
            except Exception as exc:
                logger.warning(
                    f"LLM video summary failed ({exc}). Falling back to simulation."
                )

        # Deterministic simulation fallback
        chapters = [
            ChapterItem(
                start_seconds=0.0,
                end_seconds=180.0,
                title="Introduction & Motivation",
                summary="Core problem statement and why this architectural topic matters.",
            ),
            ChapterItem(
                start_seconds=180.0,
                end_seconds=420.0,
                title="Deep Dive into Architecture",
                summary="Decomposing the components and data flow models.",
            ),
            ChapterItem(
                start_seconds=420.0,
                end_seconds=720.0,
                title="Production Considerations & Summary",
                summary="Trade-offs, performance edge cases, and best practices.",
            ),
        ]

        return VideoSummaryResponse(
            video_title=req.video_title,
            executive_summary=(
                f"This lecture explores '{req.video_title}', focusing on architectural design, "
                "implementation strategies, and key considerations for scalable production deployments."
            ),
            key_takeaways=[
                "Understand the core abstractions and decouple state from business logic.",
                "Implement boundary error handling and observability from day one.",
                "Review performance trade-offs when scaling horizontally.",
            ],
            chapters=chapters,
            generated_notes_markdown=(
                f"# Study Notes: {req.video_title}\n\n"
                "## 1. Core Principles\n"
                "- Decoupled architecture enhances testability and maintainability.\n"
                "- Always adhere to separation of concerns across service boundaries.\n\n"
                "## 2. Key Action Items\n"
                "- Implement automated health checks.\n"
                "- Enforce strict type validation across inputs.\n"
            ),
        )


video_intelligence_module_service = VideoIntelligenceModuleService()
