from app.modules.curriculum.schemas import CourseOutlineRequest


def build_course_outline_prompt(req: CourseOutlineRequest) -> str:
    return f"""
    You are an expert Chief Academic Officer and Senior Curriculum Designer.
    Design a comprehensive, structured online course syllabus.

    COURSE REQUIREMENTS:
    - Topic: {req.topic}
    - Target Audience: {req.target_audience}
    - Level: {req.level}
    - Number of Modules: {req.num_modules}
    - Lessons Per Module: {req.lessons_per_module}

    OUTPUT SPECIFICATION:
    Return ONLY a valid JSON object strictly matching this schema:
    {{
        "course_title": "{req.topic}",
        "subtitle": "<engaging, professional 1-sentence subtitle>",
        "description": "<thorough 2-3 paragraph course overview covering what students will master>",
        "target_audience": "{req.target_audience}",
        "level": "{req.level}",
        "total_estimated_hours": 12.5,
        "modules": [
            {{
                "module_number": 1,
                "title": "<Module 1 Title>",
                "description": "<Module 1 overview>",
                "lessons": [
                    {{
                        "title": "<Lesson 1 Title>",
                        "duration_minutes": 15,
                        "key_takeaways": ["Takeaway 1", "Takeaway 2"]
                    }}
                ]
            }}
        ]
    }}
    IMPORTANT: Return ONLY the JSON object. Do not wrap with conversational text or markdown code blocks.
    """
