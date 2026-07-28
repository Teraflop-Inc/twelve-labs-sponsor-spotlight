"""Two-brand head-to-head in a single call.

Exists in the API but isn't surfaced in the UI (the per-brand analyze pass
supersedes it) — kept because it's the most compact illustration of asking
Jockey for a judgement (``winner`` + ``rationale``) alongside the metrics.
"""
from __future__ import annotations

from typing import Any

import jockey
from domain.sponsor import prompts
from domain.sponsor.schemas import COMPARISON_SCHEMA


async def run(
    brands: list[str],
    store_id: str,
    sport: str | None,
    videos: list[str],
    max_top_moments: int = 5,
    session_id: str | None = None,
) -> dict[str, Any]:
    scope = prompts.videos_roster_for_prompt(videos)
    resp = await jockey.responses(
        instructions=prompts.active_profile(sport)["instructions"],
        user_message=prompts.compare_message(brands, max_top_moments, scope),
        knowledge_store_id=store_id,
        session_id=session_id,
        json_schema=COMPARISON_SCHEMA,
    )
    text, parsed = jockey.extract_json(resp)

    return {
        "session_id": resp.get("session_id") or session_id,
        "comparison": parsed,
        "answer": text,
        "raw": resp,
    }
