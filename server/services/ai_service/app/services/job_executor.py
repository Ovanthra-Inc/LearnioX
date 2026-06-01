"""
AI Job Executor — runs individual job types against the LLM.
Each job_type maps to a specific prompt template and output parser.
"""
import json
import logging
from app.models.ai_job import AIJobType
from app.services.llm_client import call_llm

logger = logging.getLogger(__name__)


# ── Prompt Templates ──────────────────────────────────────────────────────────

def _course_outline_prompt(payload: dict) -> str:
    return f"""Generate a detailed course outline for the following course.
Title: {payload.get("title", "Untitled")}
Subject: {payload.get("subject", "")}
Target audience: {payload.get("target_audience", "general learners")}
Duration: {payload.get("duration_weeks", 4)} weeks
Difficulty: {payload.get("difficulty", "beginner")}

Return JSON with this exact structure:
{{
  "title": "...",
  "description": "...",
  "learning_outcomes": ["...", "..."],
  "modules": [
    {{
      "title": "...",
      "description": "...",
      "duration_minutes": 60,
      "lessons": [
        {{"title": "...", "type": "video|reading|quiz", "duration_minutes": 15}}
      ]
    }}
  ]
}}"""


def _lesson_plan_prompt(payload: dict) -> str:
    return f"""Create a detailed lesson plan for the following lesson.
Course: {payload.get("course_title", "")}
Lesson title: {payload.get("lesson_title", "")}
Duration: {payload.get("duration_minutes", 30)} minutes
Learning objectives: {payload.get("objectives", "")}

Return JSON:
{{
  "objectives": ["..."],
  "introduction": "...",
  "main_content": [{{"topic": "...", "explanation": "...", "duration_minutes": 5}}],
  "activities": ["..."],
  "summary": "...",
  "assessment_questions": ["..."]
}}"""


def _quiz_generation_prompt(payload: dict) -> str:
    content = payload.get("content", "")
    n = payload.get("num_questions", 5)
    return f"""Generate {n} quiz questions based on the following content.
Content: {content[:3000]}

Return JSON:
{{
  "questions": [
    {{
      "question": "...",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "..."
    }}
  ]
}}"""


def _doubt_draft_answer_prompt(payload: dict) -> str:
    return f"""A student asked the following question in an online course. Provide a clear, helpful answer.
Course: {payload.get("course_title", "")}
Question: {payload.get("question", "")}

Return JSON:
{{"answer": "...", "confidence": 0.9, "references": []}}"""


def _marketing_copy_prompt(payload: dict) -> str:
    return f"""Write compelling marketing copy for the following course.
Course title: {payload.get("title", "")}
Description: {payload.get("description", "")}
Target audience: {payload.get("target_audience", "")}

Return JSON:
{{
  "headline": "...",
  "subheadline": "...",
  "body": "...",
  "cta": "...",
  "bullet_points": ["...", "...", "..."]
}}"""


def _video_summary_prompt(payload: dict) -> str:
    transcript = payload.get("transcript", "")[:6000]
    return f"""Summarize this video transcript concisely for learners.
Transcript: {transcript}

Return JSON:
{{
  "summary": "...",
  "key_points": ["...", "...", "..."],
  "duration_estimate_minutes": 5
}}"""


def _video_chapters_prompt(payload: dict) -> str:
    transcript = payload.get("transcript", "")[:6000]
    duration = payload.get("duration_seconds", 300)
    return f"""Split this video transcript into chapters with timestamps.
Duration: {duration} seconds
Transcript: {transcript}

Return JSON:
{{
  "chapters": [
    {{"title": "...", "start_seconds": 0, "summary": "..."}}
  ]
}}"""


# ── Dispatch ──────────────────────────────────────────────────────────────────

PROMPT_MAP = {
    AIJobType.COURSE_OUTLINE: _course_outline_prompt,
    AIJobType.LESSON_PLAN: _lesson_plan_prompt,
    AIJobType.QUIZ_GENERATION: _quiz_generation_prompt,
    AIJobType.DOUBT_DRAFT_ANSWER: _doubt_draft_answer_prompt,
    AIJobType.MARKETING_COPY: _marketing_copy_prompt,
    AIJobType.VIDEO_SUMMARY: _video_summary_prompt,
    AIJobType.VIDEO_CHAPTERS: _video_chapters_prompt,
}


async def execute_job(job_type: AIJobType, input_payload: dict, model: str | None = None) -> dict:
    """Execute an AI job and return the parsed output payload."""
    prompt_fn = PROMPT_MAP.get(job_type)
    if not prompt_fn:
        raise ValueError(f"No prompt template for job type: {job_type}")

    prompt = prompt_fn(input_payload)
    raw_output = await call_llm(prompt, model=model)

    # Try to parse as JSON, fallback to raw text
    try:
        # Strip markdown code fences if present
        clean = raw_output.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean)
    except json.JSONDecodeError:
        logger.warning(f"LLM output was not valid JSON for job_type={job_type}")
        return {"raw_output": raw_output}
