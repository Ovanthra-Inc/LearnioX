import json
import logging
from typing import List, Optional
import google.generativeai as genai
from app.core.config import settings
from app.core.enums import AssessmentType
from app.core.base_task import BaseAITask
from app.prompts.generator_prompts import build_generation_system_prompt
from app.schemas.generation import (
    DifficultyLevel,
    GenerateAssessmentRequest,
    GenerateAssessmentResponse,
    GeneratedAssessmentItem,
    MCQOptionItem,
    MatchingPair,
    TestCaseItem,
)

logger = logging.getLogger("learniox.ai.generator")


class AssessmentGeneratorTask(BaseAITask):
    """
    Plug-and-play AI task for synthesizing any of the 14 assessment types for creators.
    """

    @property
    def task_name(self) -> str:
        return "assessment_generator"

    def __init__(self):
        self._is_configured = bool(settings.GEMINI_API_KEY)
        if self._is_configured:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel(
                model_name=settings.AI_MODEL_NAME,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.4, # Balanced creativity & precision for educational content
                    "max_output_tokens": settings.AI_MAX_OUTPUT_TOKENS,
                },
            )
        else:
            self._model = None

    async def execute(self, payload: GenerateAssessmentRequest) -> GenerateAssessmentResponse:
        """
        Synthesizes assessment questions/assignments using Google Gemini or deterministic fallback simulation.
        """
        prompt = build_generation_system_prompt(payload)

        if self._is_configured and self._model:
            try:
                response = await self._model.generate_content_async(prompt)
                raw_json = response.text.strip()
                data = json.loads(raw_json)

                items = []
                for item_dict in data.get("items", []):
                    items.append(GeneratedAssessmentItem.model_validate(item_dict))

                if items:
                    return GenerateAssessmentResponse(
                        assessment_type=payload.assessment_type,
                        topic=payload.topic,
                        difficulty=payload.difficulty,
                        count=len(items),
                        items=items,
                    )
            except Exception as exc:
                logger.error(f"Gemini generation error: {exc}. Falling back to structured simulation.")

        # Fallback deterministic generator for offline testing & dev mode
        return self._simulate_dev_generation(payload)

    def _simulate_dev_generation(self, req: GenerateAssessmentRequest) -> GenerateAssessmentResponse:
        """
        Returns rich, schema-compliant generated assessment items for offline dev testing.
        """
        items: List[GeneratedAssessmentItem] = []

        for i in range(1, req.count + 1):
            suffix = f" (Part {i})" if req.count > 1 else ""

            if req.assessment_type == AssessmentType.CODING_QUESTION:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"Implement {req.topic} Algorithm{suffix}",
                    instructions=(
                        f"Write an optimal, production-grade implementation for {req.topic}.\n"
                        "Constraints:\n"
                        "- Time Complexity: O(N)\n"
                        "- Space Complexity: O(1)\n"
                        "- Handle empty and edge-case inputs gracefully."
                    ),
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    starter_code=f"def solve_{req.topic.lower().replace(' ', '_')}(data):\n    # TODO: Implement algorithm\n    pass",
                    test_cases=[
                        TestCaseItem(input="data=[1, 2, 3, 4]", expected_output="[4, 3, 2, 1]", is_hidden=False),
                        TestCaseItem(input="data=[]", expected_output="[]", is_hidden=False),
                        TestCaseItem(input="data=[100]", expected_output="[100]", is_hidden=True),
                    ],
                    rubric_guidelines="40% Functional Logic, 20% Edge Cases, 20% Clean Code, 20% Big-O Complexity.",
                    reference_solution=f"def solve_{req.topic.lower().replace(' ', '_')}(data):\n    return data[::-1]",
                )

            elif req.assessment_type == AssessmentType.CASE_STUDY:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Architecture & Production Incident{suffix}",
                    instructions=f"Analyze the production incident scenario for {req.topic} and answer the 3 analytical questions.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    scenario=(
                        f"During a major traffic surge, the {req.topic} cluster experienced significant performance degradation. "
                        "Response times increased by 400% and connection saturation caused sporadic timeouts across client services. "
                        "The engineering team must diagnose the root cause and propose architectural safeguards."
                    ),
                    sub_questions=[
                        f"1. What is the most probable architectural bottleneck in this {req.topic} setup?",
                        "2. Propose an immediate mitigation strategy without requiring service downtime.",
                        "3. Design a long-term caching and scaling architecture to prevent future occurrences.",
                    ],
                    rubric_guidelines="30% Root Cause Identification, 30% Mitigation Feasibility, 40% Long-term Architectural Design.",
                    reference_solution="1. Bottleneck: Unindexed table scans and connection starvation.\n2. Mitigation: Scale read replicas and tune connection pooling.\n3. Long-term: Introduce Redis distributed caching layer.",
                )

            elif req.assessment_type == AssessmentType.MATCHING:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"Match Core {req.topic} Concepts{suffix}",
                    instructions=f"Match each item in Column A with its corresponding definition in Column B for {req.topic}.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    column_a=[f"{req.topic} Principle A", f"{req.topic} Pattern B", f"{req.topic} Component C", f"{req.topic} Protocol D"],
                    column_b=["High Availability", "Event-Driven Messaging", "Data Integrity", "Low Latency Routing"],
                    correct_pairs=[
                        MatchingPair(left=f"{req.topic} Principle A", right="High Availability"),
                        MatchingPair(left=f"{req.topic} Pattern B", right="Event-Driven Messaging"),
                        MatchingPair(left=f"{req.topic} Component C", right="Data Integrity"),
                        MatchingPair(left=f"{req.topic} Protocol D", right="Low Latency Routing"),
                    ],
                    rubric_guidelines="Equal points awarded per correctly mapped pair.",
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
                    title=f"{req.topic} Truth Value Statement{suffix}",
                    instructions=f"Evaluate whether the statement regarding {req.topic} is True or False.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    statement=f"{req.topic} guarantees atomic data transactions across distributed boundaries by default.",
                    correct_boolean=False,
                    rubric_guidelines="100% Correct truth value.",
                    reference_solution="False: Distributed boundaries require two-phase commit or Saga patterns to guarantee atomicity.",
                )

            elif req.assessment_type == AssessmentType.FILL_IN_BLANK:
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Terminology Recall{suffix}",
                    instructions=f"In {req.topic} architectures, the core abstraction used to manage concurrent state is ___.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    expected_answers=["Mutex", "Lock", "Semaphore"],
                    rubric_guidelines="Exact or semantic keyword proximity.",
                    reference_solution="Mutex (or Lock/Semaphore) is used to control concurrent access to shared resources.",
                )

            else:
                # General fallback for Project, Lab, Essay, etc.
                item = GeneratedAssessmentItem(
                    assessment_type=req.assessment_type,
                    title=f"{req.topic} Comprehensive {req.assessment_type.value.replace('_', ' ').title()}{suffix}",
                    instructions=f"Complete the detailed {req.assessment_type.value} assignment for topic '{req.topic}'.",
                    difficulty=req.difficulty,
                    total_marks=req.total_marks,
                    deliverables=[
                        f"1. Architectural design doc for {req.topic}",
                        f"2. Implementation code / analysis for {req.topic}",
                        f"3. Verification tests and performance benchmarks",
                    ],
                    rubric_guidelines="40% Accuracy & Completeness, 30% Architecture & Design, 30% Quality & Tests.",
                    reference_solution=f"Model deliverable package demonstrating complete coverage of {req.topic}.",
                )

            items.append(item)

        return GenerateAssessmentResponse(
            assessment_type=req.assessment_type,
            topic=req.topic,
            difficulty=req.difficulty,
            count=len(items),
            items=items,
        )


assessment_generator_task = AssessmentGeneratorTask()
