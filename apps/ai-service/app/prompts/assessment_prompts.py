from app.core.enums import AssessmentType

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
    Evaluation Focus for MCQ:
    1. Option Selection Correctness (100% of marks): Matches the correct single choice option.
    """,

    AssessmentType.TRUE_FALSE: """
    Evaluation Focus for True/False:
    1. Truth Value Correctness (100% of marks): Matches the correct boolean state with sound reasoning.
    """,

    AssessmentType.MULTIPLE_SELECT: """
    Evaluation Focus for Multiple Select:
    1. Comprehensive Option Matching (100% of marks): Partial credit awarded for correctly identified options without selecting false distractors.
    """,

    AssessmentType.FILL_IN_BLANK: """
    Evaluation Focus for Fill in the Blank:
    1. Exact or Semantic Terminology Match (100% of marks): Matches the expected keyword or exact synonym.
    """,

    AssessmentType.MATCHING: """
    Evaluation Focus for Matching:
    1. Pairwise Association Accuracy (100% of marks): Evaluates correctness of mapped pairs across columns.
    """,

    AssessmentType.ORDERING: """
    Evaluation Focus for Ordering:
    1. Sequence Permutation Correctness (100% of marks): Evaluates the logical order of steps in the pipeline.
    """,

    AssessmentType.FILE_UPLOAD_ASSIGNMENT: """
    Evaluation Focus for File Upload / Assignment:
    1. Deliverable Completeness (40% of marks): Covers all requested assignment sections.
    2. Quality & Rigor (35% of marks): Technical depth and adherence to submission guidelines.
    3. Presentation & Structure (25% of marks): Well-organized, readable, and structured deliverables.
    """,

    AssessmentType.COURSE_FINAL_EXAM: """
    Evaluation Focus for Course Final Exam:
    1. Comprehensive Domain Mastery (50% of marks): Demonstrates mastery across all course topics.
    2. Problem Solving & Application (30% of marks): Ability to apply concepts to novel problems.
    3. Accuracy & Technical Rigor (20% of marks): High precision in answers and solutions.
    """,
}


def build_evaluation_prompt(
    assessment_type: AssessmentType,
    title: str,
    instructions: str,
    student_submission: str,
    total_marks: int,
    rubric_guidelines: str = None,
    reference_solution: str = None,
) -> str:
    type_rubric = RUBRIC_GUIDELINES_BY_TYPE.get(
        assessment_type,
        "Evaluate the submission for correctness, clarity, and completeness against the instructions."
    )

    custom_rubric_section = f"\nCreator's Custom Rubric Guidelines:\n{rubric_guidelines}" if rubric_guidelines else ""
    ref_solution_section = f"\nCreator's Reference Solution / Expected Answer:\n{reference_solution}" if reference_solution else ""

    prompt = f"""
You are an expert university professor, lead educator, and grading evaluator in LearnioX.
Your role is to rigorously, fairly, and constructively evaluate the student's submission.

Assessment Type: {assessment_type.value}
Assessment Title: {title}
Total Maximum Marks: {total_marks}

Problem Statement / Assignment Instructions:
\"\"\"
{instructions}
\"\"\"
{type_rubric}
{custom_rubric_section}
{ref_solution_section}

Student's Submitted Work:
\"\"\"
{student_submission}
\"\"\"

GRADING INSTRUCTIONS:
1. Carefully compare the student's submission against the instructions, rubric guidelines, and total marks ({total_marks}).
2. Award a fair integer 'score' between 0 and {total_marks}.
3. Calculate the percentage: (score / {total_marks}) * 100.
4. Set 'passed': true if percentage >= 50.0 else false.
5. Provide a constructive 'summary_feedback' with positive reinforcement and direct insights.
6. Provide a 'rubric_breakdown' where the sum of 'max_points' equals {total_marks}, and the sum of 'awarded_points' equals 'score'.
7. List 2-4 concrete 'strengths'.
8. List 2-4 actionable 'areas_for_improvement'.
9. If applicable (e.g. coding error or conceptual mistake), provide a 'suggested_correction'.

Return a JSON object conforming strictly to the requested schema.
"""
    return prompt.strip()
