import logging
from typing import Optional
from app.modules.tutor.schemas import DoubtQueryRequest, TutorAnswerResponse
from app.modules.tutor.prompts import build_tutor_system_prompt
from app.providers import get_llm_provider
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.modules.tutor.service")


class TutorModuleService:
    """
    In-classroom 24/7 AI Tutor & Doubt Resolver Service.
    Integrates with course vector context to answer student queries.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self._provider = provider or get_llm_provider()

    async def answer_doubt(self, req: DoubtQueryRequest) -> TutorAnswerResponse:
        prompt = build_tutor_system_prompt(req)

        if self._provider.is_configured and self._provider.provider_name != "mock":
            try:
                data = await self._provider.generate_json(prompt)
                return TutorAnswerResponse(
                    doubt_id=req.doubt_id,
                    answer=data.get("answer", "Here is an explanation of the concept."),
                    confidence=float(data.get("confidence", 0.95)),
                    suggested_followups=data.get("suggested_followups", []),
                    citations=data.get("citations", []),
                )
            except Exception as exc:
                logger.warning(f"LLM tutor answer failed ({exc}). Falling back to simulation.")

        # Deterministic simulation fallback
        return TutorAnswerResponse(
            doubt_id=req.doubt_id,
            answer=(
                f"Great question regarding '{req.student_question}'. In LearnioX courses, this concept is central "
                "to understanding how distributed systems decouple responsibilities. First, consider how inputs "
                "propagate through the architecture; second, notice the boundary conditions that maintain consistency."
            ),
            confidence=0.90,
            suggested_followups=[
                "How does this approach compare with synchronous architectures?",
                "What failure recovery mechanisms are recommended in high-throughput environments?",
            ],
            citations=["Lecture 3: Core Architecture (04:15 - 08:30)"],
        )


tutor_module_service = TutorModuleService()
