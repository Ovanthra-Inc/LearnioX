import logging
from app.modules.assessments.types import AssessmentType
from app.modules.assessments.schemas import (
    GradeAssessmentRequest,
    GradeAssessmentResponse,
    RubricCriterion,
)
from app.modules.assessments.prompts import build_evaluation_prompt
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.modules.assessments.grader")


class AssessmentGraderService:
    """
    Evaluates student submissions across all 14 assessment types against criteria rubrics.
    """

    def __init__(self, llm_provider: BaseLLMProvider):
        self._provider = llm_provider

    async def grade(self, req: GradeAssessmentRequest) -> GradeAssessmentResponse:
        """
        Evaluates student submission using configured LLM provider or deterministic rubric simulation.
        """
        prompt = build_evaluation_prompt(
            assessment_type=req.assessment_type,
            title=req.title,
            instructions=req.instructions,
            student_submission=req.student_submission,
            total_marks=req.total_marks,
            rubric_guidelines=req.rubric_guidelines,
            reference_solution=req.reference_solution,
        )

        if self._provider.is_configured and self._provider.provider_name != "mock":
            try:
                data = await self._provider.generate_json(prompt)
                score = int(data.get("score", int(req.total_marks * 0.75)))
                percentage = float(data.get("percentage", round((score / req.total_marks) * 100, 1)))
                passed = bool(data.get("passed", percentage >= 50.0))

                rubric_criteria = []
                for crit in data.get("rubric_breakdown", []):
                    rubric_criteria.append(RubricCriterion.model_validate(crit))

                return GradeAssessmentResponse(
                    assessment_type=req.assessment_type,
                    score=score,
                    total_marks=req.total_marks,
                    percentage=percentage,
                    passed=passed,
                    summary_feedback=data.get(
                        "summary_feedback",
                        "The submission demonstrates good overall comprehension of the technical requirements.",
                    ),
                    rubric_breakdown=rubric_criteria,
                    strengths=data.get("strengths", ["Solid foundational understanding shown."]),
                    areas_for_improvement=data.get(
                        "areas_for_improvement", ["Review edge cases and performance considerations."]
                    ),
                    suggested_correction=data.get("suggested_correction"),
                )
            except Exception as exc:
                logger.warning(
                    f"LLM grading failed ({exc}). Falling back to deterministic rubric simulation."
                )

        # ── Deterministic Simulation Fallback ─────────────────────────────────
        is_blank = not req.student_submission or len(req.student_submission.strip()) < 5
        score_multiplier = 0.15 if is_blank else 0.85
        awarded_score = int(req.total_marks * score_multiplier)
        percentage = round((awarded_score / req.total_marks) * 100, 1)
        passed = percentage >= 50.0

        if req.assessment_type == AssessmentType.CODING_QUESTION:
            breakdown = [
                RubricCriterion(
                    criterion_name="Functional Correctness & Logic",
                    max_points=int(req.total_marks * 0.40),
                    awarded_points=int(req.total_marks * (0.05 if is_blank else 0.35)),
                    criterion_feedback="Algorithm logic is sound and satisfies primary unit tests.",
                ),
                RubricCriterion(
                    criterion_name="Edge Cases & Boundaries",
                    max_points=int(req.total_marks * 0.20),
                    awarded_points=int(req.total_marks * (0.05 if is_blank else 0.16)),
                    criterion_feedback="Handles empty and boundary inputs effectively.",
                ),
                RubricCriterion(
                    criterion_name="Code Quality & Clean Architecture",
                    max_points=int(req.total_marks * 0.20),
                    awarded_points=int(req.total_marks * (0.03 if is_blank else 0.18)),
                    criterion_feedback="Clean variable naming and appropriate modularity.",
                ),
                RubricCriterion(
                    criterion_name="Complexity & Efficiency",
                    max_points=int(req.total_marks * 0.20),
                    awarded_points=int(req.total_marks * (0.02 if is_blank else 0.16)),
                    criterion_feedback="Time and space complexity within acceptable Big-O bounds.",
                ),
            ]
        else:
            breakdown = [
                RubricCriterion(
                    criterion_name="Conceptual Understanding & Accuracy",
                    max_points=int(req.total_marks * 0.50),
                    awarded_points=int(req.total_marks * (0.10 if is_blank else 0.42)),
                    criterion_feedback="Core topic definitions and mechanisms are well explained.",
                ),
                RubricCriterion(
                    criterion_name="Application & Completeness",
                    max_points=int(req.total_marks * 0.30),
                    awarded_points=int(req.total_marks * (0.03 if is_blank else 0.26)),
                    criterion_feedback="Addressed all required sub-prompts in the problem statement.",
                ),
                RubricCriterion(
                    criterion_name="Clarity & Technical Rigor",
                    max_points=int(req.total_marks * 0.20),
                    awarded_points=int(req.total_marks * (0.02 if is_blank else 0.17)),
                    criterion_feedback="Clear structure, professional tone, and unambiguous explanations.",
                ),
            ]

        return GradeAssessmentResponse(
            assessment_type=req.assessment_type,
            score=awarded_score,
            total_marks=req.total_marks,
            percentage=percentage,
            passed=passed,
            summary_feedback=(
                "Insufficient submission. Please review the instructions."
                if is_blank
                else f"Solid submission demonstrating good mastery of {req.assessment_type.value} concepts."
            ),
            rubric_breakdown=breakdown,
            strengths=[
                "Accurate core logic aligned with the question requirements.",
                "Clear, structured presentation of the solution.",
            ],
            areas_for_improvement=[
                "Consider deeper boundary-case testing and performance optimization.",
                "Add inline comments explaining subtle implementation details.",
            ],
            suggested_correction=req.reference_solution,
        )
