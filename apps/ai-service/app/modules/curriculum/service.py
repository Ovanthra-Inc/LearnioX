import logging
from typing import Optional
from app.modules.curriculum.schemas import (
    CourseOutlineRequest,
    CourseOutlineResponse,
    ModuleOutlineItem,
    LectureOutlineItem,
)
from app.modules.curriculum.prompts import build_course_outline_prompt
from app.providers import get_llm_provider
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.modules.curriculum.service")


class CurriculumModuleService:
    """
    Synthesizes complete course syllabi, module breakdowns, and lesson plans.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self._provider = provider or get_llm_provider()

    async def generate_outline(self, req: CourseOutlineRequest) -> CourseOutlineResponse:
        prompt = build_course_outline_prompt(req)

        if self._provider.is_configured and self._provider.provider_name != "mock":
            try:
                data = await self._provider.generate_json(prompt)
                modules = []
                for mod_data in data.get("modules", []):
                    lessons = [
                        LectureOutlineItem.model_validate(les)
                        for les in mod_data.get("lessons", [])
                    ]
                    modules.append(
                        ModuleOutlineItem(
                            module_number=mod_data.get("module_number", len(modules) + 1),
                            title=mod_data.get("title", f"Module {len(modules) + 1}"),
                            description=mod_data.get("description", ""),
                            lessons=lessons,
                        )
                    )

                return CourseOutlineResponse(
                    course_title=data.get("course_title", req.topic),
                    subtitle=data.get("subtitle", f"Master {req.topic} from scratch."),
                    description=data.get("description", f"Comprehensive course on {req.topic}."),
                    target_audience=req.target_audience,
                    level=req.level,
                    total_estimated_hours=float(data.get("total_estimated_hours", 10.0)),
                    modules=modules,
                )
            except Exception as exc:
                logger.warning(f"LLM curriculum generation failed ({exc}). Falling back to simulation.")

        # Deterministic simulation fallback
        modules = []
        for m in range(1, req.num_modules + 1):
            lessons = [
                LectureOutlineItem(
                    title=f"Lesson {m}.{les}: Fundamentals of {req.topic} Part {les}",
                    duration_minutes=20,
                    key_takeaways=[
                        f"Understand core mechanisms of {req.topic}",
                        "Apply best practices in real-world environments",
                    ],
                )
                for les in range(1, req.lessons_per_module + 1)
            ]
            modules.append(
                ModuleOutlineItem(
                    module_number=m,
                    title=f"Module {m}: Core Competency {m} in {req.topic}",
                    description=f"Deep dive into module {m} concepts and practical hands-on exercises.",
                    lessons=lessons,
                )
            )

        return CourseOutlineResponse(
            course_title=req.topic,
            subtitle=f"The Complete Guide to {req.topic} for {req.target_audience}",
            description=f"Master {req.topic} through comprehensive hands-on instruction and project-driven learning.",
            target_audience=req.target_audience,
            level=req.level,
            total_estimated_hours=round(req.num_modules * req.lessons_per_module * 0.35, 1),
            modules=modules,
        )


curriculum_module_service = CurriculumModuleService()
