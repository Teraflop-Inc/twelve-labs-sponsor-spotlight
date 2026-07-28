"""Pass 2 — every timed appearance of the selected brands.

One ``/responses`` call **per brand**, fanned out concurrently. Splitting by
brand (rather than asking for the whole inventory at once) keeps each response
inside Jockey's budget and lets a single brand fail without losing the rest.

:func:`fetch_event_windows` is the companion pass: one call per *event kind*
("find every goal"), which recalls far better than asking the brand-focused
prompt to also notice what was happening in the match. The capture script stamps
those windows onto overlapping appearances by interval overlap.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import jockey
from domain.sponsor import prompts, provenance
from domain.sponsor.schemas import GAME_EVENTS_SCHEMA, PER_BRAND_SCHEMA
from services import scoping

log = logging.getLogger("jockey-demo")


async def fetch_brand_appearances(
    brand_name: str,
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    selections: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """Pass-2 worker: fetch full appearances for a single brand."""
    scope = prompts.scope_phrase(game_id, videos, selections)
    try:
        resp = await jockey.responses(
            instructions=prompts.active_profile(sport)["instructions"],
            user_message=prompts.per_brand_message(brand_name, scope),
            knowledge_store_id=store_id,
            session_id=None,  # independent calls, no session interleaving
            json_schema=PER_BRAND_SCHEMA,
            selections=selections,
        )
    except Exception as e:  # noqa: BLE001
        log.warning("per-brand fetch failed for %r: %s", brand_name, e)
        return None
    text, parsed = jockey.extract_json(resp)
    if text and parsed is None:
        log.warning("per-brand JSON decode failed for %r", brand_name)
    return parsed


async def fetch_event_windows(
    kind: str,
    phrase: str,
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    selections: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """One focused ``/responses`` call: find every occurrence of a single event kind.

    Returns the window list with each window stamped ``kind`` (so callers can
    flatten across kinds). The caller stamps these onto overlapping sponsor
    appearances by interval overlap.
    """
    scope = prompts.scope_phrase(game_id, videos, selections)
    try:
        resp = await jockey.responses(
            instructions=prompts.active_profile(sport)["instructions"],
            user_message=prompts.event_windows_message(phrase, scope),
            knowledge_store_id=store_id,
            session_id=None,
            json_schema=GAME_EVENTS_SCHEMA,
            selections=selections,
        )
    except Exception as e:  # noqa: BLE001
        log.warning("event fetch failed for kind=%r: %s", kind, e)
        return []
    text, data = jockey.extract_json(resp)
    if not text:
        return []
    if data is None:
        log.warning("event JSON decode failed for kind=%r", kind)
        return []

    windows = []
    for w in data.get("windows") or []:
        try:
            s, e = float(w.get("start_sec")), float(w.get("end_sec"))
        except (TypeError, ValueError):
            continue
        if e <= s:
            continue
        windows.append({**w, "kind": kind, "start_sec": s, "end_sec": e})
    return windows


async def run(
    brand_names: list[str],
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Fan out one per-brand call for each of ``brand_names`` and merge the results.

    The UI caps this at 2 brands (= 2 calls), which fits Jockey's 2 req/min limit.
    """
    t0 = time.time()
    selections = await scoping.game_selections(store_id, game_id)
    results = await asyncio.gather(
        *(
            fetch_brand_appearances(name, store_id, sport, videos, game_id, selections)
            for name in brand_names
        ),
        return_exceptions=False,
    )
    secs = round(time.time() - t0, 1)

    merged: list[dict[str, Any]] = []
    for name, r in zip(brand_names, results):
        if r:
            r.setdefault("name", name)
            merged.append(r)
    log.info("analyze: %.1fs, %d/%d brands succeeded", secs, len(merged), len(brand_names))

    return provenance.stamp_live({
        "session_id": session_id,
        "inventory": {"brands": merged, "summary": ""},
        "timings": {
            "analyze_secs": secs,
            "requested": len(brand_names),
            "succeeded": len(merged),
        },
    }, store_id=store_id, game_id=game_id)
