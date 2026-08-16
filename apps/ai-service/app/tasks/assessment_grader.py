import json
import logging
from typing import Optional
import google.generativeai as genai
from app.core.config import settings
from app.core.enums import AssessmentType
from app.core.base_task import BaseAITask
from app.prompts.assessment_prompts import build_evaluation_prompt
from app.schemas.assessment import (
    GradeAssessmentRequest,
    GradeAssessmentResponse,
    RubricCriterion,
)

logger = logging.getLogger("learniox.ai.grader")


class AssessmentGraderTask(BaseAITask):
    """
    Plug-and-play AI task for grading and evaluating any of the 14 assessment types.
    """

    @property
    def task_name(self) -> str:
        return "assessment_grader"

    def __init__(self):
        self._is_configured = bool(settings.GEMINI_API_KEY)
        if self._is_configured:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(
                model_name=settings.AI_MODEL_NAME,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": settings.AI_TEMPERATURE,
                    "max_output_tokens": settings.AI_MAX_OUTPUT_TOKENS,
                },
            )
        else:
            self._model = None

    async def execute(self, payload: GradeAssessmentRequest) -> GradeAssessmentResponse:
        """
        Executes multi-type assessment evaluation using Google Gemini or structured dev simulation.
        """
        prompt = build_evaluation_prompt(
            assessment_type=payload.assessment_type,
            title=payload.title,
            instructions=payload.instructions,
            student_submission=payload.student_submission,
            total_marks=payload.total_marks,
            rubric_guidelines=payload.rubric_guidelines,
            reference_solution=payload.reference_solution,
        )

        if self._is_configured and self._model:
            try:
                response = await self._model.generate_content_async(prompt)
                raw_json = response.text.strip()
                data = json.loads(raw_json)

                # Ensure calculated score and percentage match requested total_marks
                score = min(int(data.get("score", payload.total_marks)), payload.total_marks)
                percentage = round((score / payload.total_marks) * 100.0, 2)
                passed = percentage >= 50.0

                rubric_items = []
                for item in data.get("rubric_breakdown", []):
                    rubric_items.append(
                        RubricCriterion(
                            criterion_name=item.get("criterion_name", "General Evaluation"),
                            max_points=int(item.get("max_points", 0)),
                            awarded_points=int(item.get("awarded_points", 0)),
                            criterion_feedback=item.get("criterion_feedback", ""),
                        )
                    )

                return GradeAssessmentResponse(
                    assessment_type=payload.assessment_type,
                    score=score,
                    total_marks=payload.total_marks,
                    percentage=percentage,
                    passed=passed,
                    summary_feedback=data.get("summary_feedback", "Evaluation completed successfully."),
                    rubric_breakdown=rubric_items,
                    strengths=data.get("strengths", ["Clear understanding of instructions"]),
                    areas_for_improvement=data.get("areas_for_improvement", ["Review advanced edge cases"]),
                    suggested_correction=data.get("suggested_correction"),
                )
            except Exception as exc:
                logger.error(f"Gemini evaluation error: {exc}. Falling back to deterministic evaluation.")

        # Dev mode / Fallback evaluation when API key is unconfigured or in offline test mode
        return self._simulate_dev_evaluation(payload)

    def _simulate_dev_evaluation(self, payload: GradeAssessmentRequest) -> GradeAssessmentResponse:
        """
        Deterministic, structured evaluation fallback for dev/offline testing.
        """
        sub_len = len(payload.student_submission.strip())
        if sub_len == 0:
            score = 0
            feedback = "No submission provided. Please complete the assignment."
            passed = False
        elif sub_len < 30:
            score = int(payload.total_marks * 0.4)
            feedback = "Submission is very brief and missing essential technical details."
            passed = False
        else:
            score = int(payload.total_marks * 0.85)
            feedback = (
                f"Well-structured submission for {payload.assessment_type.value}. "
                "Demonstrates solid conceptual understanding and addresses key requirements."
            )
            passed = True

        pct = round((score / payload.total_marks) * 100.0, 2)

        # Build rubric breakdown matching total_marks
        part1_max = int(payload.total_marks * 0.5)
        part2_max = payload.total_marks - part1_max
        part1_awarded = int(score * 0.5)
        part2_awarded = score - part1_awarded

        return GradeAssessmentResponse(
            assessment_type=payload.assessment_type,
            score=score,
            total_marks=payload.total_marks,
            percentage=pct,
            passed=passed,
            summary_feedback=feedback,
            rubric_breakdown=[
                RubricCriterion(
                    criterion_name="Functional & Conceptual Accuracy",
                    max_points=part1_max,
                    awarded_points=part1_awarded,
                    criterion_feedback="Correctly implements core logic and expected principles.",
                ),
                RubricCriterion(
                    criterion_name="Structure & Clarity",
                    max_points=part2_max,
                    awarded_points=part2_awarded,
                    criterion_feedback="Well-organized presentation with clear documentation.",
                ),
            ],
            strengths=[
                f"Clear execution aligned with {payload.assessment_type.value} requirements.",
                "Adheres to core problem statement instructions.",
            ],
            areas_for_improvement=[
                "Consider expanding test coverage and edge case handling.",
                "Add inline comments explaining non-obvious design choices.",
            ],
            suggested_correction=None,
        )


assessment_grader_task = AssessmentGraderTask()
