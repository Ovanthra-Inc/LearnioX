from app.modules.video_intelligence.schemas import VideoSummaryRequest


def build_video_summary_prompt(req: VideoSummaryRequest) -> str:
    return f"""
    You are an expert Educational Content Producer and Cognitive Note-Taking Assistant.
    Analyze the following lecture transcript and synthesize a structured executive summary,
    actionable key takeaways, video chapters with timestamps, and formatted Markdown study notes.

    LECTURE TITLE:
    "{req.video_title}"

    TRANSCRIPT CONTENT:
    \"\"\"
    {req.transcript_text[:6000]}
    \"\"\"

    OUTPUT REQUIREMENTS:
    Return ONLY a valid JSON object strictly matching this schema:
    {{
        "video_title": "{req.video_title}",
        "executive_summary": "<high-level 2-3 sentence overview>",
        "key_takeaways": [
            "<Key takeaway 1>",
            "<Key takeaway 2>",
            "<Key takeaway 3>"
        ],
        "chapters": [
            {{
                "start_seconds": 0.0,
                "end_seconds": 120.0,
                "title": "<Chapter 1 Title>",
                "summary": "<Synopsis of chapter 1>"
            }}
        ],
        "generated_notes_markdown": "# Study Notes\\n\\n## Overview\\n...\\n\\n## Key Concepts\\n..."
    }}
    IMPORTANT: Respond ONLY with the JSON object. Do not include markdown ticks or conversational chatter.
    """
