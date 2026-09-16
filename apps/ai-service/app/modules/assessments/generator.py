import logging
from typing import List
from app.modules.assessments.types import AssessmentType
from app.modules.assessments.schemas import (
    DifficultyLevel,
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    GeneratedAssessmentItem,
    MCQOptionItem,
    MatchingPair,
    TestCaseItem,
)
from app.modules.assessments.prompts import build_generation_system_prompt
from app.providers.base import BaseLLMProvider

logger = logging.getLogger("learniox.ai.modules.assessments.generator")


class AssessmentGeneratorService:
    """
    Synthesizes rich, production-ready assessment items across all 14 types.
    """

    def __init__(self, llm_provider: BaseLLMProvider):
        self._provider = llm_provider

    async def generate(self, req: GenerateAssessmentRequest) -> GenerateAssessmentResponse:
        """
        Executes assessment generation using the configured LLM provider
        or deterministic simulation fallback.
        """
        prompt = build_generation_system_prompt(req)

        if self._provider.is_configured and self._provider.provider_name != "mock":
            try:
                data = await self._provider.generate_json(prompt)
                items = []
                for item_dict in data.get("items", []):
                    items.append(GeneratedAssessmentItem.model_validate(item_dict))

                if items:
                    return GenerateAssessmentResponse(
                        assessment_type=req.assessment_type,
                        topic=req.topic,
                        difficulty=req.difficulty,
                        count=len(items),
                        items=items,
                    )
            except Exception as exc:
                logger.warning(
                    f"LLM generation failed ({exc}). Falling back to deterministic simulation."
                )

        # ── Deterministic Simulation Fallback ─────────────────────────────────
        items = []
        for i in range(req.count):
            suffix = f" (Variant {i+1})" if req.count > 1 else ""

            if req.assessment_type == AssessmentType.CODING_QUESTION:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"Implement Efficient Solution for {req.topic}{suffix}",
                    instructions=f"Write a production-ready function to solve the core {req.topic} computational challenge. Consider edge cases, boundary conditions, and time/space complexity.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    starter_code=f"def solve_{req.topic.lower().replace(' ', '_')}(data: list) -> list:\n    \"\"\"\n    TODO: Implement optimal solution for {req.topic}.\n    \"\"\"\n    pass\n",
                    test_cases=[
                        TestCaseItem(input="data=[1, 2, 3, 4]", expected_output="[4, 3, 2, 1]", is_hidden=False),
                        TestCaseItem(input="data=[]", expected_output="[]", is_hidden=False),
                        TestCaseItem(input="data=[42]", expected_output="[42]", is_hidden=True),
                    ],
                    rubric_guidelines="Passes 100% of visible and hidden unit tests, optimal time/space complexity.",
                    reference_solution=f"def solve_{req.topic.lower().replace(' ', '_')}(data):\n    return data[::-1]",
                )

            elif req.assessment_type == AssessmentType.MATCHING:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Key Concepts Matching{suffix}",
                    instructions=f"Match each fundamental {req.topic} concept on the left with its corresponding definition on the right.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    matching_pairs=[
                        MatchingPair(id="m1", left="Concept Alpha", right="Primary operational definition for Alpha"),
                        MatchingPair(id="m2", left="Concept Beta", right="Secondary operational definition for Beta"),
                        MatchingPair(id="m3", left="Concept Gamma", right="Tertiary operational definition for Gamma"),
                    ],
                    rubric_guidelines="100% Exact match across all pairs.",
                )

            elif req.assessment_type == AssessmentType.ORDERING:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Pipeline Execution Order{suffix}",
                    instructions=f"Arrange the following steps in the correct chronological execution sequence for {req.topic}.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    unordered_steps=[
                        f"Step C: Validate and process {req.topic} payload",
                        f"Step A: Initialize {req.topic} context",
                        f"Step D: Persist {req.topic} transaction to database",
                        f"Step B: Authenticate incoming client request",
                    ],
                    correct_step_order=[
                        f"Step A: Initialize {req.topic} context",
                        f"Step B: Authenticate incoming client request",
                        f"Step C: Validate and process {req.topic} payload",
                        f"Step D: Persist {req.topic} transaction to database",
                    ],
                    rubric_guidelines="Evaluates sequence permutation accuracy and relative ordering.",
                )

            elif req.assessment_type == AssessmentType.MCQ:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Core Concept Assessment{suffix}",
                    instructions=f"Which statement accurately describes the primary characteristic of {req.topic}?",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    options=[
                        MCQOptionItem(id="opt_1", text=f"It enables scalable, asynchronous processing for {req.topic}."),
                        MCQOptionItem(id="opt_2", text=f"It enforces strict synchronous blocking locks for {req.topic}."),
                        MCQOptionItem(id="opt_3", text=f"It bypasses all network security layers for {req.topic}."),
                        MCQOptionItem(id="opt_4", text=f"It is deprecated in modern architectures for {req.topic}."),
                    ],
                    correct_option_id="opt_1",
                    rubric_guidelines="100% Correct option match.",
                    reference_solution=f"Option 1 is correct because {req.topic} is specifically designed for asynchronous scalability.",
                )

            elif req.assessment_type == AssessmentType.TRUE_FALSE:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Invariant Statement{suffix}",
                    instructions=f"Analyze the technical assertion below and determine whether it is True or False.",
                    statement=f"In production architectures, {req.topic} operates independently of persistent database state.",
                    correct_boolean=True,
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    rubric_guidelines="Binary truth evaluation.",
                    reference_solution=f"True: {req.topic} maintains stateless runtime processing.",
                )

            elif req.assessment_type == AssessmentType.CASE_STUDY:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"Incident Post-Mortem & Architecture: {req.topic}{suffix}",
                    instructions="Review the following production scenario and answer all sub-questions with architectural diagrams and justification.",
                    scenario=f"During peak traffic hours, the core {req.topic} system experienced unexpected cascade latency spikes, resulting in a 40% drop in throughput.",
                    sub_questions=[
                        f"Identify the most probable root cause of the {req.topic} bottleneck.",
                        "Propose an immediate mitigation strategy with minimal downtime.",
                        "Design a resilient long-term architecture preventing recurrence.",
                    ],
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    rubric_guidelines="Root Cause Diagnosis (30%), Practical Mitigation (30%), Architecture (40%).",
                )

            else:
                # Generic fallback for subjective/essay/lab/project types
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Comprehensive Assessment{suffix}",
                    instructions=f"Demonstrate your technical mastery of {req.topic} by addressing all requirements and providing concrete implementation details.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    rubric_guidelines="Depth of Understanding (40%), Execution & Precision (35%), Professional Polish (25%).",
                    reference_solution=f"A complete answer must cover the foundational principles, practical implementation, and common failure modes of {req.topic}.",
                )

            items.append(item)

        return GenerateAssessmentResponse(
            assessment_type=req.assessment_type,
            topic=req.topic,
            difficulty=req.difficulty,
            count=len(items),
            items=items,
        )
