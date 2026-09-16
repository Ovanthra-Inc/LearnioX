from typing import Optional
from app.modules.assessments.types import AssessmentType
from app.modules.assessments.schemas import GenerateAssessmentRequest

# Specialized Rubric Guidelines for each of the 14 Assessment Types
RUBRIC_GUIDELINES_BY_TYPE = {
    AssessmentType.CODING_QUESTION: """
    Evaluation Focus for Coding Question:
    1. Functional Correctness & Logic (40% of marks): Does the code solve the problem statement completely?
    2. Edge Cases & Boundary Handling (20% of marks): Handles empty inputs, large values, off-by-one errors.
    3. Code Quality & Clean Architecture (20% of marks): Naming conventions, modularity, readability, DRY principle.
    4. Time & Space Complexity Efficiency (20% of marks): Optimal algorithmic choice (Big-O analysis).
    """,

    AssessmentType.LONG_ANSWER_ESSAY: """
    Evaluation Focus for Long Answer / Essay:
    1. Content Depth & Understanding (40% of marks): Thorough grasp of the topic and core technical concepts.
    2. Structure & Coherence (25% of marks): Clear introduction, body paragraphs, and logical conclusion.
    3. Evidence & Examples (20% of marks): Concrete real-world scenarios or citations supporting the arguments.
    4. Clarity & Language Precision (15% of marks): Professional tone, clear grammar, and precise technical terms.
    """,

    AssessmentType.SHORT_ANSWER: """
    Evaluation Focus for Short Answer:
    1. Conceptual Accuracy (60% of marks): Direct and correct answer to the core question.
    2. Conciseness & Precision (40% of marks): Free of fluff, accurately defines key terminology.
    """,

    AssessmentType.CASE_STUDY: """
    Evaluation Focus for Case Study:
    1. Problem Identification (30% of marks): Accurately pinpoints the root cause or challenge in the scenario.
    2. Analytical Depth (30% of marks): Uses framework-based thinking and data/context from the case.
    3. Practicality of Recommendations (25% of marks): Proposes actionable, feasible, and effective solutions.
    4. Risk & Trade-off Consideration (15% of marks): Acknowledges potential pitfalls and mitigation strategies.
    """,

    AssessmentType.PROJECT: """
    Evaluation Focus for Project:
    1. Scope & Requirement Fulfillment (35% of marks): Satisfies all specified project deliverables.
    2. Architectural Design & Modularity (25% of marks): Proper separation of concerns, scalability, and design patterns.
    3. Implementation Quality & Robustness (25% of marks): Error handling, security best practices, and tests.
    4. Documentation & Clarity (15% of marks): Clear README/instructions, comments, and structure.
    """,

    AssessmentType.PRACTICAL_LAB: """
    Evaluation Focus for Practical Lab:
    1. Step-by-Step Execution (40% of marks): Correct application of commands, tools, or configuration steps.
    2. Accuracy of Expected Outputs (35% of marks): Matches the expected terminal or tool output.
    3. Troubleshooting & Verification (25% of marks): Verification steps demonstrate understanding of the state.
    """,

    AssessmentType.MCQ: """
    Evaluation Focus for Multiple Choice Question:
    1. Correct Option Selection (100% of marks): Binary evaluation based on chosen option ID matching the answer key.
    """,

    AssessmentType.TRUE_FALSE: """
    Evaluation Focus for True/False:
    1. Truth Value Match (100% of marks): Binary evaluation based on student's boolean selection.
    """,

    AssessmentType.MULTIPLE_SELECT: """
    Evaluation Focus for Multiple Select Question:
    1. Partial Credit & Accuracy (100% of marks): Correct options selected minus incorrect options chosen (minimum 0).
    """,

    AssessmentType.FILL_IN_BLANK: """
    Evaluation Focus for Fill in the Blank:
    1. Keyword & Semantic Match (100% of marks): Correct term or accepted technical synonym provided.
    """,

    AssessmentType.FILE_UPLOAD_ASSIGNMENT: """
    Evaluation Focus for File Upload / Assignment:
    1. Execution of Guidelines (40% of marks): Follows the requested assignment specification and deliverables.
    2. Quality & Polish (35% of marks): Professional presentation, correctness of diagrams or calculations.
    3. Critical Thinking & Synthesis (25% of marks): Demonstrates independent thought and technical rigor.
    """,

    AssessmentType.MATCHING: """
    Evaluation Focus for Matching Columns:
    1. Mapping Accuracy (100% of marks): Percentage of Left-to-Right pairs correctly aligned.
    """,

    AssessmentType.ORDERING: """
    Evaluation Focus for Ordering / Sequence:
    1. Sequence Permutation Accuracy (100% of marks): Correct chronological or pipeline placement of steps.
    """,

    AssessmentType.COURSE_FINAL_EXAM: """
    Evaluation Focus for Course Final Exam:
    1. Comprehensive Domain Mastery (50% of marks): Demonstrates mastery across all course syllabus modules.
    2. Problem Solving & Synthesis (30% of marks): Integrates disparate concepts to address complex challenges.
    3. Precision & Technical Communication (20% of marks): Formulates concise, rigorous solutions.
    """
}

# Prompt guidelines for generating items across all 14 types
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
    Generate a hands-on technical Lab walkthrough:
    - 'title': Lab title (e.g. 'Lab: Deploying Multi-Zone Kubernetes Ingress with TLS & Cert-Manager').
    - 'instructions': Lab objectives and prerequisites.
    - 'deliverables': Step-by-step actionable commands and verification commands.
    - 'rubric_guidelines': Correct Command Execution (40%), Expected Output Verification (35%), Troubleshooting (25%).
    - 'reference_solution': Model terminal output and configuration manifests.
    """,

    AssessmentType.FILE_UPLOAD_ASSIGNMENT: """
    Generate an applied Assignment requiring a document/code upload:
    - 'title': Assignment title.
    - 'instructions': Clear prompt detailing what files to produce (e.g. PDF Architecture Diagram, Benchmark Analysis).
    - 'deliverables': Required file formats, naming conventions, and structure.
    - 'rubric_guidelines': Completeness (40%), Polish & Accuracy (35%), Synthesis (25%).
    - 'reference_solution': Sample report structure or benchmark values.
    """,

    AssessmentType.MATCHING: """
    Generate Column Matching pairs:
    - 'title': Matching exercise title.
    - 'instructions': Directive on what relationships to match.
    - 'matching_pairs': Array of 4-6 objects with {"left": "Concept", "right": "Definition"}.
    - 'rubric_guidelines': 100% Exact match across all pairs.
    """,

    AssessmentType.ORDERING: """
    Generate a Chronological Sequence / Pipeline ordering question:
    - 'title': Sequence ordering title.
    - 'instructions': Context for what sequence the student must determine.
    - 'unordered_steps': Array of 4-6 randomly shuffled steps.
    - 'correct_step_order': Array of the same steps in strictly correct chronological order.
    - 'rubric_guidelines': Sequence permutation accuracy.
    """,

    AssessmentType.MCQ: """
    Generate a Multiple Choice Quiz question:
    - 'title': Question title.
    - 'instructions': Question prompt text.
    - 'options': Array of 4 options with {"id": "opt_1", "text": "..."}, {"id": "opt_2", "text": "..."}...
    - 'correct_option_id': The id of the single correct option (e.g. 'opt_1').
    - 'rubric_guidelines': 100% Correct option match.
    - 'reference_solution': Detailed explanation of why the correct option is right and others are distractors.
    """,

    AssessmentType.TRUE_FALSE: """
    Generate a True/False assessment item:
    - 'title': True/False statement title.
    - 'statement': A definitive, nuanced technical statement.
    - 'correct_boolean': true or false.
    - 'rubric_guidelines': Binary truth evaluation.
    - 'reference_solution': Concise justification of the true/false designation.
    """,

    AssessmentType.MULTIPLE_SELECT: """
    Generate a Multiple Select (Multi-Answer) Quiz question:
    - 'title': Multi-select question title.
    - 'instructions': Prompt specifying "Select ALL that apply".
    - 'options': Array of 4-5 options.
    - 'correct_option_ids': Array of IDs that are correct (e.g. ["opt_1", "opt_3"]).
    - 'rubric_guidelines': Partial credit based on correctly identified choices.
    - 'reference_solution': Comprehensive explanation of each option.
    """,

    AssessmentType.FILL_IN_BLANK: """
    Generate a Fill in the Blank question:
    - 'title': Fill in the blank title.
    - 'instructions': Sentence with a prominent blank (e.g. '_____ algorithm provides O(N log N) worst-case time.').
    - 'expected_answers': Array of accepted correct string variants.
    - 'rubric_guidelines': Keyword match with case-insensitivity.
    - 'reference_solution': Primary canonical word.
    """,

    AssessmentType.COURSE_FINAL_EXAM: """
    Generate a comprehensive Final Exam specification:
    - 'title': Course Final Exam.
    - 'instructions': Examination guidelines, duration constraints, and honor code statement.
    - 'sub_questions': Array of 5 multi-part questions spanning basic, intermediate, and advanced topics.
    - 'rubric_guidelines': Section-by-section points breakdown.
    - 'reference_solution': Complete answer key for all sections.
    """
}


def build_generation_system_prompt(request: GenerateAssessmentRequest) -> str:
    """Builds prompt instructing LLM to generate assessment items in structured JSON."""
    type_guide = TYPE_SPECIFIC_GEN_INSTRUCTIONS.get(
        request.assessment_type,
        "Generate a rigorous assessment question testing deep mastery of the topic."
    )

    lesson_context_block = ""
    if request.lesson_content:
        lesson_context_block = f"""
        COURSE/LESSON CONTEXT:
        The questions MUST be strictly based on and directly derived from the following lecture material:
        ---
        {request.lesson_content[:4000]}
        ---
        """

    return f"""
    You are an expert instructional designer and senior university curriculum engineer.
    Your mission is to generate exactly {request.count} production-ready assessment item(s) of type: {request.assessment_type.value}.

    TARGET SPECIFICATIONS:
    - Primary Topic: {request.topic}
    - Difficulty Level: {request.difficulty.value}
    - Target Audience: {request.target_audience}
    - Total Marks Per Item: {request.total_marks}
    {lesson_context_block}

    TYPE-SPECIFIC REQUIREMENTS FOR {request.assessment_type.value}:
    {type_guide}

    JSON OUTPUT FORMAT REQUIREMENTS:
    Return ONLY a valid JSON object with a single root key 'items' containing an array of {request.count} item(s).
    Every item in 'items' must follow this schema:
    {{
        "items": [
            {{
                "assessment_type": "{request.assessment_type.value}",
                "title": "...",
                "instructions": "...",
                "difficulty": "{request.difficulty.value}",
                "total_marks": {request.total_marks},
                "rubric_guidelines": "...",
                "reference_solution": "..."
            }}
        ]
    }}
    IMPORTANT: Respond ONLY with the JSON object. Do not include markdown code block markers (```json) or conversational text.
    """


def build_evaluation_prompt(
    assessment_type: AssessmentType,
    title: str,
    instructions: str,
    student_submission: str,
    total_marks: int,
    rubric_guidelines: Optional[str] = None,
    reference_solution: Optional[str] = None,
) -> str:
    """Builds prompt instructing LLM to grade student submission in structured JSON."""
    type_rubric = RUBRIC_GUIDELINES_BY_TYPE.get(assessment_type, "")
    user_rubric = rubric_guidelines or type_rubric

    reference_block = ""
    if reference_solution:
        reference_block = f"""
        IDEAL REFERENCE SOLUTION / ANSWER KEY:
        {reference_solution}
        """

    return f"""
    You are an objective, encouraging, and rigorous AI Professor and Educational Evaluator.
    Your mission is to grade a student submission for a '{assessment_type.value}' assessment item.

    ASSESSMENT DETAILS:
    - Title: {title}
    - Problem Statement / Instructions: {instructions}
    - Maximum Marks: {total_marks}
    {reference_block}

    STUDENT SUBMISSION:
    \"\"\"
    {student_submission}
    \"\"\"

    EVALUATION RUBRIC GUIDELINES:
    {user_rubric}

    GRADING INSTRUCTIONS:
    1. Score objectively based on how thoroughly the student satisfied the requirements and rubric.
    2. Provide constructive, positive, actionable feedback.
    3. Return your evaluation strictly in the following JSON format:

    {{
        "assessment_type": "{assessment_type.value}",
        "score": <integer awarded marks between 0 and {total_marks}>,
        "total_marks": {total_marks},
        "percentage": <float rounded to 1 decimal place>,
        "passed": <boolean: true if percentage >= 50.0 else false>,
        "summary_feedback": "<comprehensive 2-3 sentence executive review of the submission>",
        "rubric_breakdown": [
            {{
                "criterion_name": "<dimension name, e.g. Functional Correctness>",
                "max_points": <int>,
                "awarded_points": <int>,
                "criterion_feedback": "<specific observation explaining score>"
            }}
        ],
        "strengths": [
            "<bullet point 1>",
            "<bullet point 2>"
        ],
        "areas_for_improvement": [
            "<actionable feedback point 1>",
            "<actionable feedback point 2>"
        ],
        "suggested_correction": "<optional improved code snippet or corrected explanation, or null>"
    }}

    IMPORTANT: Respond ONLY with the valid JSON object. No conversational prelude or markdown wrappers.
    """
