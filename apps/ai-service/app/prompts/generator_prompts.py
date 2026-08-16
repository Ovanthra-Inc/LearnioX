from app.core.enums import AssessmentType
from app.schemas.generation import GenerateAssessmentRequest

TYPE_SPECIFIC_GEN_INSTRUCTIONS = {
    AssessmentType.CODING_QUESTION: """
    Generate a complete, high-quality programming problem:
    - 'title': Concise title (e.g. 'Implement Async Token Bucket Rate Limiter').
    - 'instructions': Clear problem statement with constraints (time/space complexity, input formats, edge cases).
    - 'starter_code': Python/Language boilerplate template with docstrings and signature.
    - 'test_cases': Array of 3-5 test case objects with {"input": "...", "expected_output": "...", "is_hidden": false/true}.
    - 'rubric_guidelines': Scoring rubric broken into functional logic (40%), complexity (20%), edge cases (20%), clean code (20%).
    - 'reference_solution': Full, optimal Python reference implementation.
    """,

    AssessmentType.CASE_STUDY: """
    Generate a realistic, industry-relevant Case Study:
    - 'title': Catchy scenario title (e.g. 'Mitigating Distributed Cache Thundering Herd in Payment API').
    - 'instructions': The overarching challenge and guidelines for the student.
    - 'scenario': Comprehensive 2-3 paragraph background story, architecture description, incident metrics, and business constraints.
    - 'sub_questions': Array of 3-4 deep analytical questions testing root cause analysis, mitigation trade-offs, and long-term architecture.
    - 'rubric_guidelines': Grading criteria covering Diagnosis (30%), Practicality (30%), Architecture (40%).
    - 'reference_solution': Model analytical answers for all sub-questions.
    """,

    AssessmentType.LONG_ANSWER_ESSAY: """
    Generate a thought-provoking descriptive essay prompt:
    - 'title': Topic title (e.g. 'CAP Theorem in Modern Distributed Databases').
    - 'instructions': Prompt asking the student to compare, contrast, and analyze core concepts.
    - 'rubric_guidelines': Evaluation criteria for Depth (40%), Structure (25%), Real-world Examples (20%), Clarity (15%).
    - 'reference_solution': Outline of key points, arguments, and counter-arguments expected.
    """,

    AssessmentType.SHORT_ANSWER: """
    Generate a concise conceptual question:
    - 'title': Concept question title.
    - 'instructions': Direct question requiring 1-3 sentences to answer accurately.
    - 'expected_answers': List of key definitions, required technical terms, and core concept explanations.
    - 'rubric_guidelines': Conceptual Accuracy (60%), Conciseness & Precision (40%).
    - 'reference_solution': Ideal concise 2-sentence answer.
    """,

    AssessmentType.PROJECT: """
    Generate a multi-step Capstone Project specification:
    - 'title': Capstone title (e.g. 'Build an Event-Driven Notification Microservice with Celery & Redis').
    - 'instructions': High-level project objectives and overview.
    - 'deliverables': Array of 4-6 specific technical deliverables (database models, auth, endpoints, tests, docker-compose).
    - 'rubric_guidelines': Scope (35%), Architecture (25%), Quality & Tests (25%), Documentation (15%).
    - 'reference_solution': Architecture overview and component wiring guide.
    """,

    AssessmentType.PRACTICAL_LAB: """
    Generate a hands-on command-line / configuration Lab:
    - 'title': Lab title (e.g. 'Configuring PostgreSQL Read Replicas & Connection Pooling').
    - 'instructions': Step-by-step task description and verification objectives.
    - 'deliverables': Expected configuration files, commands, and terminal output snippets.
    - 'rubric_guidelines': Execution Steps (40%), Configuration Correctness (35%), Verification (25%).
    - 'reference_solution': Exact commands and configuration files.
    """,

    AssessmentType.MCQ: """
    Generate a high-quality Multiple Choice Question:
    - 'title': Question title.
    - 'instructions': The question prompt.
    - 'options': Array of 4 options [{"id": "opt_1", "text": "..."}, {"id": "opt_2", "text": "..."}, {"id": "opt_3", "text": "..."}, {"id": "opt_4", "text": "..."}].
    - 'correct_option_id': The ID of the single correct option.
    - 'rubric_guidelines': 100% Option match.
    - 'reference_solution': Detailed explanation of why the correct option is right and why each distractor is wrong.
    """,

    AssessmentType.TRUE_FALSE: """
    Generate a conceptual True/False question:
    - 'title': Question title.
    - 'statement': A clear, unambiguous technical statement.
    - 'correct_boolean': true or false.
    - 'rubric_guidelines': 100% Truth verification.
    - 'reference_solution': Explanation citing technical facts or RFC standards.
    """,

    AssessmentType.MULTIPLE_SELECT: """
    Generate a Multiple-Select question with 2-3 correct answers:
    - 'title': Question title.
    - 'instructions': Question prompt ending with '(Select all that apply)'.
    - 'options': Array of 5 options [{"id": "opt_a", "text": "..."}, ...].
    - 'correct_option_ids': Array of IDs for all correct options (e.g. ["opt_a", "opt_c", "opt_e"]).
    - 'rubric_guidelines': Partial credit formula with penalty for false positives.
    - 'reference_solution': Explanation of each correct and incorrect option.
    """,

    AssessmentType.FILL_IN_BLANK: """
    Generate a Fill-in-the-Blank prompt:
    - 'title': Prompt title.
    - 'instructions': Sentence containing '___' where a specific technical keyword belongs.
    - 'expected_answers': Array of exact keyword and acceptable synonyms.
    - 'rubric_guidelines': Semantic and exact keyword matching.
    - 'reference_solution': Correct term with context explanation.
    """,

    AssessmentType.MATCHING: """
    Generate a Matching Columns question:
    - 'title': Matching exercise title.
    - 'instructions': Matching instructions.
    - 'column_a': Array of 4-5 items (e.g. status codes, protocols, design patterns).
    - 'column_b': Array of 4-5 corresponding descriptions/purposes (shuffled).
    - 'correct_pairs': Array of paired objects [{"left": "...", "right": "..."}].
    - 'rubric_guidelines': Equal points awarded per correctly mapped pair.
    - 'reference_solution': Correct mapping table with explanations.
    """,

    AssessmentType.ORDERING: """
    Generate an Ordering / Pipeline Sequence question:
    - 'title': Sequence exercise title.
    - 'instructions': Ordering instructions.
    - 'unordered_steps': Array of 4-5 steps presented out of order.
    - 'correct_step_order': Array of strings representing the correct chronological sequence from first to last.
    - 'rubric_guidelines': Permutation correctness and relative ordering credit.
    - 'reference_solution': Detailed lifecycle explanation justifying the sequence.
    """,

    AssessmentType.FILE_UPLOAD_ASSIGNMENT: """
    Generate an open-ended Assignment specification:
    - 'title': Assignment title.
    - 'instructions': Complete project/report prompt with formatting guidelines.
    - 'deliverables': List of required sections and file formats.
    - 'rubric_guidelines': Completeness (40%), Technical Rigor (35%), Structure (25%).
    - 'reference_solution': Model outline and benchmark criteria.
    """,

    AssessmentType.COURSE_FINAL_EXAM: """
    Generate a comprehensive Final Examination section:
    - 'title': Final Exam title.
    - 'instructions': Multi-section exam instructions and time allotment.
    - 'deliverables': Section-by-section breakdown (Objective, Analytical, Practical).
    - 'rubric_guidelines': Comprehensive domain scoring rubric across all topics.
    - 'reference_solution': Comprehensive answer key for all sections.
    """,
}


def build_generation_system_prompt(req: GenerateAssessmentRequest) -> str:
    type_instruction = TYPE_SPECIFIC_GEN_INSTRUCTIONS.get(
        req.assessment_type,
        "Generate a comprehensive educational assessment tailored to the topic."
    )

    lesson_content_section = (
        f"\nSOURCE LESSON CONTENT / TRANSCRIPT TO BASE QUESTIONS ON:\n\"\"\"\n{req.lesson_content}\n\"\"\"\n"
        if req.lesson_content
        else ""
    )

    prompt = f"""
You are an expert university professor, curriculum architect, and assessment creator in LearnioX.
Generate {req.count} high-quality, educationally rigorous assessment item(s) for the following specifications:

- Assessment Type: {req.assessment_type.value}
- Topic: {req.topic}
- Difficulty Level: {req.difficulty.value}
- Target Audience: {req.target_audience}
- Total Marks per Item: {req.total_marks}
{lesson_content_section}

INSTRUCTIONS FOR {req.assessment_type.value}:
{type_instruction}

SCHEMA REQUIREMENT:
Return a JSON object conforming to:
{{
  "assessment_type": "{req.assessment_type.value}",
  "topic": "{req.topic}",
  "difficulty": "{req.difficulty.value}",
  "count": {req.count},
  "items": [
    {{
      "assessment_type": "{req.assessment_type.value}",
      "title": "<Concise descriptive title>",
      "instructions": "<Comprehensive problem statement / instructions>",
      "difficulty": "{req.difficulty.value}",
      "total_marks": {req.total_marks},
      "rubric_guidelines": "<Detailed grading rubric>",
      "reference_solution": "<Model reference solution>",
      ... (include the specific fields required for {req.assessment_type.value})
    }}
  ]
}}

Ensure technical precision, zero hallucinations, and clear educational value.
"""
    return prompt.strip()
