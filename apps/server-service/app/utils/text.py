"""
Shared text utilities for LearnioX Server Service.
"""
import re


def slugify(text: str) -> str:
    """
    Convert arbitrary text into a URL-safe slug.

    Rules:
    - Lowercase and strip leading/trailing whitespace.
    - Remove characters that are not word characters, spaces, or hyphens.
    - Replace runs of whitespace/underscores/hyphens with a single dash.
    - Strip leading/trailing dashes.
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")
