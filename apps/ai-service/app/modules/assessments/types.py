import enum
from typing import List, Dict, Any


class AssessmentType(str, enum.Enum):
    """
    14 Creator-Selectable Assessment Types supported in LearnioX.
    """
    MCQ = "MCQ"
    TRUE_FALSE = "TRUE_FALSE"
    MULTIPLE_SELECT = "MULTIPLE_SELECT"
    FILL_IN_BLANK = "FILL_IN_BLANK"
    SHORT_ANSWER = "SHORT_ANSWER"
    LONG_ANSWER_ESSAY = "LONG_ANSWER_ESSAY"
    CODING_QUESTION = "CODING_QUESTION"
    FILE_UPLOAD_ASSIGNMENT = "FILE_UPLOAD_ASSIGNMENT"
    MATCHING = "MATCHING"
    ORDERING = "ORDERING"
    CASE_STUDY = "CASE_STUDY"
    PROJECT = "PROJECT"
    PRACTICAL_LAB = "PRACTICAL_LAB"
    COURSE_FINAL_EXAM = "COURSE_FINAL_EXAM"


def get_all_assessment_types_meta() -> List[Dict[str, Any]]:
    """Returns descriptive metadata for all 14 assessment types."""
    return [
        {"type": AssessmentType.MCQ, "label": "Multiple Choice Quiz", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.TRUE_FALSE, "label": "True / False", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.MULTIPLE_SELECT, "label": "Multiple Select", "difficulty": "EASY", "category": "Objective"},
        {"type": AssessmentType.FILL_IN_BLANK, "label": "Fill in the Blank", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.SHORT_ANSWER, "label": "Short Answer", "difficulty": "MEDIUM", "category": "Subjective"},
        {"type": AssessmentType.LONG_ANSWER_ESSAY, "label": "Long Answer / Essay", "difficulty": "MEDIUM", "category": "Subjective"},
        {"type": AssessmentType.CODING_QUESTION, "label": "Coding Question", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.FILE_UPLOAD_ASSIGNMENT, "label": "Assignment / File Upload", "difficulty": "MEDIUM", "category": "Applied"},
        {"type": AssessmentType.MATCHING, "label": "Matching Columns", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.ORDERING, "label": "Ordering / Pipeline Steps", "difficulty": "MEDIUM", "category": "Objective"},
        {"type": AssessmentType.CASE_STUDY, "label": "Case Study Analysis", "difficulty": "MEDIUM", "category": "Analytical"},
        {"type": AssessmentType.PROJECT, "label": "Comprehensive Project", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.PRACTICAL_LAB, "label": "Hands-on Practical / Lab", "difficulty": "HARD", "category": "Engineering"},
        {"type": AssessmentType.COURSE_FINAL_EXAM, "label": "Course Final Exam", "difficulty": "MEDIUM", "category": "Comprehensive"},
    ]
