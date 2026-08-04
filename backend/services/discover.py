"""Pass 1 — which sponsor brands appear at all.

One ``/responses`` call over the whole broadcast, deliberately *without*
timestamps: enumerating every appearance here would blow the response budget.
Timing is Pass 2's job (:mod:`services.analyze`).
"""
from __future__ import annotations

import logging
import time
from typing import Any

import jockey
from domain.sponsor import prompts, provenance
from domain.sponsor.schemas import DISCOVERY_SCHEMA
from services import scoping

log = logging.getLogger("jockey-demo")


async def run(
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    session_id: str | None = None,
    asset_id: str | None = None,
    asset_label: str | None = None,
) -> dict[str, Any]:
    profile = prompts.active_profile(sport)
    t0 = time.time()
    selections = await scoping.resolve(store_id, game_id, asset_id)
    scope = prompts.scope_phrase(game_id, videos, selections, asset_label)

    resp = await jockey.responses(
        instructions=profile["instructions"],
        user_message=prompts.discovery_message(profile["surfaces_phrase"], scope),
        knowledge_store_id=store_id,
        session_id=session_id,
        json_schema=DISCOVERY_SCHEMA,
        selections=selections,
    )
    text, parsed = jockey.extract_json(resp)

    secs = round(time.time() - t0, 1)
    log.info("discover: %.1fs, %d brands", secs, len((parsed or {}).get("brands", [])))
    return provenance.stamp_live({
        "session_id": resp.get("session_id") or session_id,
        "discovery": parsed or {"brands": [], "summary": ""},
        "answer": text,
        "raw": resp,
        "timings": {"discover_secs": secs},
    }, store_id=store_id, game_id=game_id)
