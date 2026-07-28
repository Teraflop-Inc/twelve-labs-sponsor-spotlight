"""Free-form question against the knowledge store.

Optionally schema-constrained via ``SPONSOR_MOMENTS_SCHEMA`` — the simplest
demonstration of the same ``/responses`` call with and without ``json_schema``.
"""
from __future__ import annotations

from typing import Any

import jockey
from domain.sponsor import prompts
from domain.sponsor.schemas import SPONSOR_MOMENTS_SCHEMA


async def run(
    question: str,
    store_id: str,
    sport: str | None,
    videos: list[str],
    structured: bool = False,
    session_id: str | None = None,
) -> dict[str, Any]:
    resp = await jockey.responses(
        instructions=prompts.active_profile(sport)["instructions"],
        user_message=question + prompts.videos_roster_for_prompt(videos),
        knowledge_store_id=store_id,
        session_id=session_id,
        json_schema=SPONSOR_MOMENTS_SCHEMA if structured else None,
    )
    if structured:
        text, parsed = jockey.extract_json(resp)
    else:
        text, parsed = jockey.extract_text(resp), None

    return {
        "session_id": resp.get("session_id") or session_id,
        "answer": text,
        "structured": parsed,
        "raw": resp,
    }
