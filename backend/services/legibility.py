"""Pass 3 — the creative & visibility audit.

Scores each brand's assets on contrast, size, position, camera angle and motion
blur, with timestamped examples of where a mark rendered poorly. This is the
step that separates "a logo was on screen" from "a logo was legible".
"""
from __future__ import annotations

from typing import Any

import jockey
from domain.sponsor import prompts, provenance
from domain.sponsor.schemas import LEGIBILITY_SCHEMA
from services import scoping


async def run(
    brands: list[str],
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    session_id: str | None = None,
    asset_id: str | None = None,
    asset_label: str | None = None,
) -> dict[str, Any]:
    profile = prompts.active_profile(sport)
    selections = await scoping.resolve(store_id, game_id, asset_id)
    scope = prompts.scope_phrase(game_id, videos, selections, asset_label)

    resp = await jockey.responses(
        instructions=profile["instructions"],
        user_message=prompts.legibility_message(brands, profile["surfaces_phrase"], scope),
        knowledge_store_id=store_id,
        session_id=session_id,
        json_schema=LEGIBILITY_SCHEMA,
        selections=selections,
    )
    text, parsed = jockey.extract_json(resp)

    return provenance.stamp_live({
        "session_id": resp.get("session_id") or session_id,
        "report": parsed,
        "answer": text,
        "raw": resp,
    }, store_id=store_id, game_id=game_id)
