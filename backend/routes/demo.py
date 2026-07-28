"""Demo-mode metadata and the pre-baked exploration payload."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

import demo_cache
import games
import reels
from core import config

router = APIRouter(prefix="/api/demo")


@router.get("/info")
async def demo_info() -> dict[str, Any]:
    """Whether the locked server-key demo is available, and its collection."""
    return {
        "enabled": bool(config.demo_key()),
        "store_id": config.DEMO_STORE_ID,
        "name": config.DEMO_STORE_NAME,
        "sport": config.DEMO_SPORT,
        # The frontend pre-seeds these brands and auto-runs the cached flow.
        "demo_brands": config.DEMO_BRANDS,
        # Aggregate ("All games") is pre-baked → the classic instant-demo flag.
        "cached": demo_cache.available(),
        # Per-game selector: every game + which of them are fully pre-baked.
        "games": games.all_games(),
        "cached_games": demo_cache.cached_games(games.game_ids()),
    }


@router.get("/scope/{game_id}")
async def demo_scope(game_id: str) -> dict[str, Any]:
    """All pre-baked data for one demo scope — an exploration payload, not a run.

    Reads committed fixtures only (no Jockey, no key): the full **detected** brand
    list (``discovery``), the **analyzed** brands with appearance data
    (``inventory``), the legibility report, and any built highlight-reel URLs. The
    UI cross-references discovery (all) against inventory (run) to show which
    brands are selectable to view. ``game_id`` is a games.GAMES id or ``all``.
    """
    scope = None if game_id in ("all", demo_cache.AGGREGATE) else game_id
    disc = demo_cache.load("discover", scope) or {}
    analyze = demo_cache.load("analyze", scope) or {}
    legib = demo_cache.load("legibility", scope) or {}
    return {
        "game_id": game_id,
        "label": games.label(scope),
        "discovery": (disc.get("discovery") or {}).get("brands") or [],
        "inventory": (analyze.get("inventory") or {}).get("brands") or [],
        "legibility": legib.get("report"),
        "reels": reels.load_all(scope),
    }
