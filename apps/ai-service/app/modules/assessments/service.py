from typing import List, Dict, Any, Optional
from app.modules.assessments.types import get_all_assessment_types_meta
from app.modules.assessments.schemas import (
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    GradeAssessmentRequest,
    GradeAssessmentResponse,
)
from app.modules.assessments.generator import AssessmentGeneratorService
from app.modules.assessments.grader import AssessmentGraderService
from app.providers import get_llm_provider
from app.providers.base import BaseLLMProvider


class AssessmentModuleService:
    """
    Unified Domain Service for the Assessments module.
    Orchestrates generation and grading workflows.
    """

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self._explicit_provider = provider

    def _get_active_provider(self) -> BaseLLMProvider:
        return self._explicit_provider or get_llm_provider()

    def get_supported_types(self) -> List[Dict[str, Any]]:
        """Returns descriptive metadata for all 14 assessment types."""
        return get_all_assessment_types_meta()

    async def generate_assessments(
        self, request: GenerateAssessmentRequest
    ) -> GenerateAssessmentResponse:
        """Synthesizes assessment items based on topic, type, and difficulty."""
        generator = AssessmentGeneratorService(self._get_active_provider())
        return await generator.generate(request)

    async def grade_assessment(
        self, request: GradeAssessmentRequest
    ) -> GradeAssessmentResponse:
        """Evaluates student submission against specialized rubrics."""
        grader = AssessmentGraderService(self._get_active_provider())
        return await grader.grade(request)


# Default singleton instance for dependency injection
assessment_module_service = AssessmentModuleService()

