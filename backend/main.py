"""Sponsor Spotlight — Jockey-only FastAPI backend.

Stateless by design: every request carries the caller's TwelveLabs API key in an
``x-api-key`` header (entered in the UI), plus the active knowledge-store id, its
sport, and the ready-video roster. There is no server-side state file, no
background work, and no local media — so it runs unchanged on serverless
platforms (Vercel). Footage is uploaded by the user in the TwelveLabs dashboard;
this app only creates/selects knowledge stores and runs Jockey analyses.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jockey-demo")

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import demo_cache
import games
import jockey
import reels
import report as report_tpl
import sports

app = FastAPI(title="Sponsor Spotlight (Jockey-only) Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# --- Demo mode ----------------------------------------------------------------
# A locked, server-key demo. Requests carrying the ``x-demo`` header use the
# backend SPONSOR_SPOTLIGHT_TL_KEY and are pinned to one read-only collection —
# the caller never supplies a key and cannot point our key at another store.
DEMO_STORE_ID = os.environ.get(
    "SPONSOR_SPOTLIGHT_STORE_ID", "ks_019e955d-a87a-7c80-b96b-5eb52838a136"
)
DEMO_STORE_NAME = os.environ.get("SPONSOR_SPOTLIGHT_STORE_NAME", "PL Classics (enriched)")
DEMO_SPORT = os.environ.get("SPONSOR_SPOTLIGHT_SPORT", "soccer")

# The canonical brand pair the demo tab pre-bakes (see demo_cache / capture script).
# Analyze + legibility cache hits require the request to match this set.
DEMO_BRANDS = [
    b.strip()
    for b in os.environ.get("SPONSOR_SPOTLIGHT_DEMO_BRANDS", "Etihad,Emirates").split(",")
    if b.strip()
]


def _demo_cache_hit(
    endpoint: str, brands: list[str] | None = None, game_id: str | None = None
) -> dict[str, Any] | None:
    """Cached demo response for ``endpoint``, or ``None`` to fall through to live Jockey.

    ``game_id`` selects the per-game fixture (``None`` / 'aggregate' = whole
    collection). Brand-scoped endpoints (analyze, legibility) are served by
    trimming the fixture's full brand set to the requested subset; if any
    requested brand isn't in the fixture we fall through to live so nothing is
    silently substituted.
    """
    envelope = demo_cache.load(endpoint, game_id)
    if envelope is None:
        return None
    if brands is None:
        return envelope
    return demo_cache.subset_brands(endpoint, envelope, brands)


def _demo_key() -> str | None:
    return os.environ.get("SPONSOR_SPOTLIGHT_TL_KEY")


async def tl_key(
    x_api_key: str | None = Header(default=None),
    x_demo: str | None = Header(default=None),
) -> bool:
    """Resolve the TwelveLabs key for this request; return ``True`` in demo mode.

    - **Demo mode** (``x-demo`` header): uses the backend SPONSOR_SPOTLIGHT_TL_KEY
      and is locked to the demo collection (enforced by the endpoints).
    - **BYO-key mode**: the caller's own ``x-api-key`` is required. There is no
      silent server-key fallback — a stray env var can never become a shared key.
    """
    if x_demo:
        demo = _demo_key()
        if not demo:
            raise HTTPException(status_code=503, detail="Demo mode is not configured.")
        jockey.set_api_key(demo)
        return True
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing TwelveLabs API key — enter your key in the app.",
        )
    jockey.set_api_key(x_api_key)
    return False


def _apply_mode(req: "StoreContext", is_demo: bool) -> None:
    """In demo mode, pin every analysis to the demo collection + sport."""
    if is_demo:
        req.store_id = DEMO_STORE_ID
        req.sport = DEMO_SPORT


def _videos_roster_for_prompt(videos: list[str]) -> str:
    """List ready videos so Jockey can attribute moments per-game.

    The UI sends the filenames of the store's ready broadcasts.
    """
    names = [v for v in (videos or []) if v]
    if not names:
        return ""
    lines = "\n".join(f"- {n}" for n in names)
    return (
        f"\n\nThe knowledge store contains {len(names)} broadcast(s):\n{lines}\n"
        f"When citing a moment, set the `video` field to the exact source video filename.\n"
    )


def _game_scope_phrase(game_id: str | None) -> str:
    """Prompt suffix that scopes the analysis to a single broadcast via ``{{sel:0}}``.

    Used in place of ``_videos_roster_for_prompt`` when a ``game_id`` is set: the
    ``{{sel:0}}`` token binds to ``selections[0]`` (the game's knowledge-store
    item), telling Jockey to look only at that broadcast.
    """
    g = games.by_id(game_id)
    if not g:
        return ""
    return (
        f"\n\nAnalyze ONLY this single broadcast: {{{{sel:0}}}} ({g['label']}). "
        f"Ignore every other video in the knowledge store. "
        f"Set each moment's `video` field to this broadcast's filename.\n"
    )


async def _game_selections(store_id: str, game_id: str | None) -> list[dict[str, Any]] | None:
    """Build the ``selections`` list for a per-game scope, or ``None`` for aggregate.

    Resolves the game's knowledge-store ``item_id`` from the live item list
    (falling back to the ``iconik_ingest.json`` manifest). Returns ``None`` when
    no ``game_id`` is set or the item can't be resolved (→ whole-collection run).
    """
    if not games.by_id(game_id):
        return None
    items: list[dict[str, Any]] = []
    try:
        items = await jockey.list_items(store_id)
    except Exception as e:  # noqa: BLE001 — fall back to manifest / aggregate
        log.warning("selections: list_items failed for %s: %s", store_id, e)
    item_id = games.resolve_item_id(game_id, items)
    if not item_id:
        log.warning("selections: could not resolve item for game_id=%s", game_id)
        return None
    return [{"kind": "item", "id": item_id}]


SPONSOR_MOMENTS_SCHEMA: dict[str, Any] = {
    "name": "sponsor_moments",
    "schema": {
        "type": "object",
        "properties": {
            "moments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand": {
                            "type": "string",
                            "description": "Sponsor brand visible in the moment (e.g., Crown Royal, Kia, AT&T)",
                        },
                        "asset_type": {
                            "type": "string",
                            "enum": [
                                "courtside_led",
                                "jersey_patch",
                                "scorers_table",
                                "backboard",
                                "floor_decal",
                                "broadcast_overlay",
                                "interview_backdrop",
                                "commercial",
                                "other",
                            ],
                            "description": "Where the sponsor exposure occurred",
                        },
                        "start_sec": {
                            "type": "number",
                            "description": "Clip start in seconds from video beginning",
                        },
                        "end_sec": {
                            "type": "number",
                            "description": "Clip end in seconds from video beginning",
                        },
                        "context": {
                            "type": "string",
                            "enum": [
                                "score",
                                "celebration",
                                "replay",
                                "close_up",
                                "wide_shot",
                                "pregame",
                                "halftime",
                                "postgame",
                                "timeout",
                                "commercial",
                                "other",
                            ],
                            "description": "Broadcast context at the moment of exposure",
                        },
                        "suggested_weight": {
                            "type": "number",
                            "description": "Contextual weight multiplier 0.5-3.0",
                        },
                        "confidence": {
                            "type": "number",
                            "description": "Detection confidence 0-1",
                        },
                        "description": {"type": "string"},
                        "video": {
                            "type": "string",
                            "description": "Source video filename (must match one of the broadcasts listed in the prompt)",
                        },
                    },
                    "required": [
                        "start_sec",
                        "end_sec",
                        "context",
                        "suggested_weight",
                    ],
                },
            },
            "summary": {"type": "string"},
        },
        "required": ["moments", "summary"],
    },
}


def _active_profile(sport: str | None) -> dict[str, str]:
    """Resolve the sport profile for the requested collection."""
    return sports.get_profile(sport)


BRAND_VISUAL_HINTS: dict[str, str] = {
    "Toyota": (
        "Red Toyota logo: three overlapping ellipses forming a stylized 'T' inside a "
        "horizontal oval, with the wordmark TOYOTA below in red sans-serif capitals."
    ),
    "Alaska Airlines": (
        "Alaska Airlines wordmark: dark navy stylized 'Alaska' script in italic, often "
        "with a stylized Eskimo profile in newer marks. The brand is the airline; the "
        "courtside / arena partnership uses 'Alaska Airlines' or just 'Alaska' in navy."
    ),
}


COMPARISON_SCHEMA: dict[str, Any] = {
    "name": "brand_comparison",
    "schema": {
        "type": "object",
        "properties": {
            "brands": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "total_seconds": {
                            "type": "number",
                            "description": "Total visible duration across the broadcast",
                        },
                        "moments_count": {"type": "integer"},
                        "outside_whistle_to_whistle_seconds": {
                            "type": "number",
                            "description": "Seconds of exposure during pregame, halftime, postgame, or timeouts",
                        },
                        "top_moments": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "start_sec": {"type": "number"},
                                    "end_sec": {"type": "number"},
                                    "context": {"type": "string"},
                                    "asset_type": {"type": "string"},
                                    "description": {"type": "string"},
                                    "confidence": {"type": "number"},
                                    "video": {
                                        "type": "string",
                                        "description": "Source video filename",
                                    },
                                },
                                "required": ["start_sec", "end_sec", "context"],
                            },
                        },
                        "legibility_notes": {
                            "type": "string",
                            "description": "Any visibility/legibility/contrast issues observed for this brand",
                        },
                    },
                    "required": ["name", "total_seconds", "moments_count"],
                },
            },
            "winner": {
                "type": "string",
                "description": "Brand with higher estimated impact value",
            },
            "rationale": {"type": "string"},
        },
        "required": ["brands", "winner", "rationale"],
    },
}


LEGIBILITY_SCHEMA: dict[str, Any] = {
    "name": "legibility_report",
    "schema": {
        "type": "object",
        "properties": {
            "brands": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "assets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "asset_type": {
                                        "type": "string",
                                        "enum": [
                                            "courtside_led",
                                            "jersey_patch",
                                            "scorers_table",
                                            "backboard",
                                            "floor_decal",
                                            "broadcast_overlay",
                                            "interview_backdrop",
                                            "commercial",
                                            "other",
                                        ],
                                    },
                                    "overall_score": {
                                        "type": "number",
                                        "description": "Overall legibility 0-10 (10 = perfectly readable)",
                                    },
                                    "contrast": {"type": "number", "description": "Logo-vs-background contrast 0-10"},
                                    "size": {"type": "number", "description": "Apparent on-screen size 0-10"},
                                    "position": {"type": "number", "description": "Screen position / framing 0-10"},
                                    "camera_angle": {"type": "number", "description": "Camera angle favorability 0-10"},
                                    "motion_blur": {"type": "number", "description": "Resistance to motion blur 0-10 (10 = no blur)"},
                                    "issues": {"type": "string", "description": "Specific problems observed"},
                                    "suggestions": {"type": "string", "description": "Concrete creative or placement fixes"},
                                    "examples": {
                                        "type": "array",
                                        "description": "Timestamps illustrating the issue",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "start_sec": {"type": "number"},
                                                "end_sec": {"type": "number"},
                                                "note": {"type": "string"},
                                                "video": {
                                                    "type": "string",
                                                    "description": "Source video filename",
                                                },
                                            },
                                            "required": ["start_sec", "end_sec"],
                                        },
                                    },
                                },
                                "required": ["asset_type", "overall_score"],
                            },
                        },
                        "summary": {"type": "string"},
                    },
                    "required": ["name", "assets"],
                },
            }
        },
        "required": ["brands"],
    },
}


INVENTORY_SCHEMA: dict[str, Any] = {
    "name": "brand_inventory",
    "schema": {
        "type": "object",
        "properties": {
            "brands": {
                "type": "array",
                "description": "Every distinct sponsor brand visible anywhere in the broadcast",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "total_seconds": {
                            "type": "number",
                            "description": "Sum of visible exposure duration",
                        },
                        "moments_count": {"type": "integer"},
                        "outside_whistle_to_whistle_seconds": {
                            "type": "number",
                            "description": "Exposure during pregame, halftime, postgame, or timeouts",
                        },
                        "asset_types": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Distinct asset types this brand appears on (courtside_led, jersey_patch, etc.)",
                        },
                        "appearances": {
                            "type": "array",
                            "description": "Every distinct sponsor exposure for this brand, chronologically. Do not cap arbitrarily; include all distinct appearances you can identify.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "start_sec": {"type": "number"},
                                    "end_sec": {"type": "number"},
                                    "context": {
                                        "type": "string",
                                        "enum": [
                                            "score",
                                            "celebration",
                                            "replay",
                                            "close_up",
                                            "wide_shot",
                                            "pregame",
                                            "halftime",
                                            "postgame",
                                            "timeout",
                                            "commercial",
                                            "other",
                                        ],
                                    },
                                    "asset_type": {
                                        "type": "string",
                                        "enum": [
                                            "courtside_led",
                                            "jersey_patch",
                                            "scorers_table",
                                            "backboard",
                                            "floor_decal",
                                            "broadcast_overlay",
                                            "interview_backdrop",
                                            "commercial",
                                            "other",
                                        ],
                                    },
                                    "description": {"type": "string"},
                                    "confidence": {"type": "number"},
                                    "video": {
                                        "type": "string",
                                        "description": "Source video filename",
                                    },
                                },
                                "required": ["start_sec", "end_sec"],
                            },
                        },
                        "legibility_notes": {"type": "string"},
                    },
                    "required": ["name", "appearances"],
                },
            },
            "summary": {"type": "string"},
        },
        "required": ["brands"],
    },
}


DISCOVERY_SCHEMA: dict[str, Any] = {
    "name": "brand_discovery",
    "schema": {
        "type": "object",
        "properties": {
            "brands": {
                "type": "array",
                "description": "Every distinct sponsor brand visible anywhere in the broadcast. Be thorough but quick; do NOT enumerate timestamps in this pass.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "asset_types": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Surfaces this brand appears on (courtside_led, jersey_patch, etc.)",
                        },
                    },
                    "required": ["name"],
                },
            },
            "summary": {"type": "string"},
        },
        "required": ["brands"],
    },
}


PER_BRAND_SCHEMA: dict[str, Any] = {
    "name": "brand_appearances",
    "schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "total_seconds": {"type": "number"},
            "moments_count": {"type": "integer"},
            "outside_whistle_to_whistle_seconds": {"type": "number"},
            "asset_types": {"type": "array", "items": {"type": "string"}},
            "appearances": {
                "type": "array",
                "description": "Every distinct exposure for THIS brand, chronologically. Do not cap arbitrarily.",
                "items": {
                    "type": "object",
                    "properties": {
                        "start_sec": {"type": "number"},
                        "end_sec": {"type": "number"},
                        "context": {
                            "type": "string",
                            "enum": [
                                "score", "celebration", "replay", "close_up",
                                "wide_shot", "pregame", "halftime", "postgame",
                                "timeout", "commercial", "other",
                            ],
                        },
                        "asset_type": {
                            "type": "string",
                            "enum": [
                                "courtside_led", "jersey_patch", "scorers_table",
                                "backboard", "floor_decal", "broadcast_overlay",
                                "interview_backdrop", "commercial", "other",
                            ],
                        },
                        "description": {"type": "string"},
                        "confidence": {"type": "number"},
                        "video": {"type": "string"},
                    },
                    "required": ["start_sec", "end_sec"],
                },
            },
            "legibility_notes": {"type": "string"},
        },
        "required": ["name", "appearances"],
    },
}


# --- Request models -----------------------------------------------------------
#
# Every analysis request carries the active store context: which knowledge store
# to query (`store_id`), its sport profile (`sport`), and the ready-video roster
# (`videos`, filenames) so Jockey can attribute moments per broadcast. State
# lives in the browser, not on the server.


class StoreContext(BaseModel):
    store_id: str = Field(..., description="Active knowledge store id")
    sport: str | None = Field(None, description="Sport profile key for the store")
    videos: list[str] = Field(
        default_factory=list, description="Filenames of the store's ready broadcasts"
    )
    game_id: str | None = Field(
        None,
        description="Optional per-game scope (games.GAMES id). Omit / 'aggregate' = whole collection.",
    )


class DiscoverRequest(StoreContext):
    session_id: str | None = None


class AnalyzeRequest(StoreContext):
    brands: list[str]
    session_id: str | None = None


class LegibilityRequest(StoreContext):
    brands: list[str] = Field(default_factory=lambda: ["Toyota", "Alaska Airlines"])
    session_id: str | None = None


class CompareRequest(StoreContext):
    brands: list[str] = Field(default_factory=lambda: ["Toyota", "Alaska Airlines"])
    session_id: str | None = None
    max_top_moments: int = 5


class QueryRequest(StoreContext):
    question: str
    session_id: str | None = None
    structured: bool = False


class CreateStoreRequest(BaseModel):
    name: str
    sport: str = sports.DEFAULT_SPORT


class UseStoreRequest(BaseModel):
    store_id: str


class AddAssetsRequest(BaseModel):
    store_id: str
    asset_ids: list[str]


# --- Health & static metadata -------------------------------------------------


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/sports")
async def list_sports() -> dict[str, Any]:
    """Sport profiles available for new collections."""
    return {"sports": sports.list_sports(), "default": sports.DEFAULT_SPORT}


@app.get("/api/demo/info")
async def demo_info() -> dict[str, Any]:
    """Whether the locked server-key demo is available, and its collection."""
    return {
        "enabled": bool(_demo_key()),
        "store_id": DEMO_STORE_ID,
        "name": DEMO_STORE_NAME,
        "sport": DEMO_SPORT,
        # The frontend pre-seeds these brands and auto-runs the cached flow.
        "demo_brands": DEMO_BRANDS,
        # Aggregate ("All games") is pre-baked → the classic instant-demo flag.
        "cached": demo_cache.available(),
        # Per-game selector: every game + which of them are fully pre-baked.
        "games": games.all_games(),
        "cached_games": demo_cache.cached_games(games.game_ids()),
    }


@app.get("/api/demo/scope/{game_id}")
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


# --- Knowledge stores (collections) -------------------------------------------


def _clean_store_name(name: str | None) -> str:
    """Drop the trailing unix timestamp ingest scripts append to KS names."""
    if not name:
        return ""
    return re.sub(r"\s+\d{10}$", "", name).strip()


async def _videos_from_store(store_id: str) -> list[dict[str, Any]]:
    """Build the demo's videos[] from a knowledge store's items.

    Resolves each asset's filename (for moment attribution), its HLS manifest
    (for in-app playback), and a thumbnail. No local files are involved.
    """
    items = await jockey.list_items(store_id)
    videos: list[dict[str, Any]] = []
    for it in items:
        asset_id = it.get("asset_id")
        filename = asset_id
        hls_url = None
        thumbnail_url = None
        try:
            a = await jockey.get_asset(asset_id)
            filename = a.get("filename") or a.get("name") or asset_id
            hls_url = (a.get("hls") or {}).get("manifest_url")
            thumbnail_url = (a.get("thumbnail") or {}).get("representative_url")
        except Exception:  # noqa: BLE001 — metadata is best-effort
            pass
        videos.append(
            {
                "asset_id": asset_id,
                "item_id": it.get("_id"),
                "video_filename": filename,
                "hls_url": hls_url,
                "thumbnail_url": thumbnail_url,
                "status": it.get("status") or "ready",
            }
        )
    return videos


@app.get("/api/knowledge-stores")
async def knowledge_stores(is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    """List the account's loadable knowledge stores (collections) for the picker."""
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    stores = await jockey.list_knowledge_stores()
    return {
        "stores": [
            {
                "id": k.get("_id"),
                "name": _clean_store_name(k.get("name")),
                "item_count": k.get("item_count", 0),
            }
            for k in stores
        ]
    }


@app.post("/api/knowledge-stores/create")
async def create_store(
    req: CreateStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Create a new (empty) knowledge store.

    The chosen sport drives the ingestion enrichment (what to extract) and is
    saved in the store metadata so query time can apply the matching profile.
    Videos are added by the user in the TwelveLabs dashboard, then the store is
    loaded here.
    """
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    profile = sports.get_profile(req.sport)
    sport_key = req.sport if req.sport in sports.SPORT_PROFILES else sports.DEFAULT_SPORT
    store_id = await jockey.create_knowledge_store(
        name=name,
        description=profile["enrichment"],
        metadata={"demo": "sponsor-spotlight", "sport": sport_key},
    )
    log.info("create-store: %s (%s) sport=%s", store_id, name, sport_key)
    return {"id": store_id, "name": name, "sport": sport_key}


@app.post("/api/use-knowledge-store")
async def use_knowledge_store(
    req: UseStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Load an existing store: return its sport + current video roster.

    Stateless — the client persists store_id/sport and renders the videos.
    Also used as the per-poll status refresh while items are still indexing.
    In demo mode the store is pinned to the demo collection.
    """
    if is_demo:
        req.store_id = DEMO_STORE_ID
    videos = await _videos_from_store(req.store_id)
    sport = sports.DEFAULT_SPORT
    try:
        ks = await jockey.get_knowledge_store(req.store_id)
        sport = (ks.get("metadata") or {}).get("sport") or sports.DEFAULT_SPORT
    except Exception:  # noqa: BLE001 — sport is best-effort
        pass
    log.info("use-knowledge-store: ks=%s videos=%d sport=%s", req.store_id, len(videos), sport)
    return {"store_id": req.store_id, "sport": sport, "videos": videos}


@app.post("/api/knowledge-stores/add-assets")
async def add_assets(
    req: AddAssetsRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Attach already-uploaded TwelveLabs asset(s) to a store.

    Returns immediately after enqueuing each item; indexing happens on the
    TwelveLabs side and the client polls /api/use-knowledge-store for status.
    (No server-side polling — serverless functions can't run for minutes.)
    """
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    ids = [a.strip() for a in req.asset_ids if a.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="no asset_ids provided")
    added: list[dict[str, Any]] = []
    for aid in ids:
        try:
            item_id = await jockey.add_item(req.store_id, aid)
            added.append({"asset_id": aid, "item_id": item_id, "status": "indexing"})
            log.info("add-asset: %s -> item %s (%s)", aid, item_id, req.store_id)
        except Exception as e:  # noqa: BLE001
            added.append(
                {"asset_id": aid, "status": "error", "error": f"{type(e).__name__}: {e}"}
            )
            log.warning("add-asset failed for %s: %s", aid, e)
    return {"store_id": req.store_id, "added": added}


# --- Jockey analyses ----------------------------------------------------------


@app.post("/api/jockey/query")
async def jockey_query(req: QueryRequest, is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    _apply_mode(req, is_demo)
    resp = await jockey.responses(
        instructions=_active_profile(req.sport)["instructions"],
        user_message=req.question + _videos_roster_for_prompt(req.videos),
        knowledge_store_id=req.store_id,
        session_id=req.session_id,
        json_schema=SPONSOR_MOMENTS_SCHEMA if req.structured else None,
    )
    text = jockey.extract_text(resp)
    parsed: Any = None
    if req.structured and text:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None
    return {
        "session_id": resp.get("session_id") or req.session_id,
        "answer": text,
        "structured": parsed,
        "raw": resp,
    }


@app.post("/api/jockey/discover")
async def jockey_discover(
    req: DiscoverRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Pass 1: list every distinct sponsor brand visible. No timestamps.

    In demo mode, served instantly from the pre-baked fixture unless ``?live=1``.
    """
    _apply_mode(req, is_demo)
    if is_demo and not live:
        cached = _demo_cache_hit("discover", game_id=req.game_id)
        if cached is not None:
            log.info("discover: served from demo cache (game=%s)", req.game_id or "all")
            return cached
    profile = _active_profile(req.sport)
    t0 = time.time()
    selections = await _game_selections(req.store_id, req.game_id)
    scope = (
        _game_scope_phrase(req.game_id) if selections else _videos_roster_for_prompt(req.videos)
    )
    user_message = (
        "List every distinct sponsor brand visible anywhere in this broadcast — "
        f"across these surfaces: {profile['surfaces_phrase']}. "
        "Be thorough; surface even small or briefly-visible logos. "
        "For each brand return ONLY: name and asset_types[]. "
        "Do NOT enumerate timestamps in this pass. "
        "End with a one-sentence `summary` of the sponsorship landscape."
        + scope
    )
    resp = await jockey.responses(
        instructions=profile["instructions"],
        user_message=user_message,
        knowledge_store_id=req.store_id,
        session_id=req.session_id,
        json_schema=DISCOVERY_SCHEMA,
        selections=selections,
    )
    text = jockey.extract_text(resp)
    parsed: dict[str, Any] | None = None
    if text:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None
    secs = round(time.time() - t0, 1)
    log.info("discover: %.1fs, %d brands", secs, len((parsed or {}).get("brands", [])))
    return {
        "session_id": resp.get("session_id") or req.session_id,
        "discovery": parsed or {"brands": [], "summary": ""},
        "answer": text,
        "raw": resp,
        "timings": {"discover_secs": secs},
    }


async def _fetch_brand_appearances(
    brand_name: str,
    store_id: str,
    sport: str | None,
    videos: list[str],
    game_id: str | None = None,
    selections: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """Pass-2 worker: fetch full appearances for a single brand."""
    scope = (
        _game_scope_phrase(game_id) if selections else _videos_roster_for_prompt(videos)
    )
    user_message = (
        f"Focus ONLY on the sponsor brand '{brand_name}'. Return:\n"
        f"  - name: '{brand_name}'\n"
        f"  - total_seconds visible across the broadcast\n"
        f"  - moments_count\n"
        f"  - outside_whistle_to_whistle_seconds (pregame, halftime, postgame, timeouts)\n"
        f"  - asset_types: every surface it appears on\n"
        f"  - appearances[]: every distinct exposure with start_sec, end_sec, "
        f"context, asset_type, brief description, confidence, source video filename. "
        f"Include all appearances you can identify; do not cap.\n"
        f"  - legibility_notes if it renders poorly anywhere."
        + scope
    )
    try:
        resp = await jockey.responses(
            instructions=_active_profile(sport)["instructions"],
            user_message=user_message,
            knowledge_store_id=store_id,
            session_id=None,  # independent calls, no session interleaving
            json_schema=PER_BRAND_SCHEMA,
            selections=selections,
        )
    except Exception as e:  # noqa: BLE001
        log.warning("per-brand fetch failed for %r: %s", brand_name, e)
        return None
    text = jockey.extract_text(resp)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        log.warning("per-brand JSON decode failed for %r", brand_name)
        return None


@app.post("/api/jockey/analyze")
async def jockey_analyze(
    req: AnalyzeRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Pass 2: fan out per-brand appearance queries for the selected brands.

    The UI caps this at 2 brands (= 2 calls), which fits Jockey's 2 req/min limit.
    In demo mode, the canonical brand pair is served from cache unless ``?live=1``.
    """
    _apply_mode(req, is_demo)
    brand_names = [b.strip() for b in req.brands if b and b.strip()]
    if not brand_names:
        raise HTTPException(status_code=400, detail="provide at least one brand name")

    if is_demo and not live:
        cached = _demo_cache_hit("analyze", brand_names, game_id=req.game_id)
        if cached is not None:
            log.info(
                "analyze: served from demo cache (game=%s, %s)",
                req.game_id or "all",
                ", ".join(brand_names),
            )
            return cached

    t0 = time.time()
    selections = await _game_selections(req.store_id, req.game_id)
    results = await asyncio.gather(
        *(
            _fetch_brand_appearances(
                name, req.store_id, req.sport, req.videos, req.game_id, selections
            )
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

    return {
        "session_id": req.session_id,
        "inventory": {"brands": merged, "summary": ""},
        "timings": {
            "analyze_secs": secs,
            "requested": len(brand_names),
            "succeeded": len(merged),
        },
    }


@app.post("/api/jockey/compare")
async def jockey_compare(req: CompareRequest, is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    _apply_mode(req, is_demo)
    hints = "\n".join(
        f"- {b}: {BRAND_VISUAL_HINTS.get(b, 'no visual hint provided')}"
        for b in req.brands
    )
    user_message = (
        f"Compare sponsor exposure across the broadcast for these brands:\n"
        f"{', '.join(req.brands)}\n\n"
        f"Visual hints:\n{hints}\n\n"
        f"For EACH brand, return total_seconds visible, moments_count, "
        f"outside_whistle_to_whistle_seconds (pregame/halftime/postgame/timeouts), "
        f"the top {req.max_top_moments} moments by impact (each with start_sec, "
        f"end_sec, context, asset_type, description, confidence, and video filename), and "
        f"legibility_notes if a brand's mark renders poorly. "
        f"Finally pick a 'winner' for renewal-conversation impact and explain why."
        + _videos_roster_for_prompt(req.videos)
    )

    resp = await jockey.responses(
        instructions=_active_profile(req.sport)["instructions"],
        user_message=user_message,
        knowledge_store_id=req.store_id,
        session_id=req.session_id,
        json_schema=COMPARISON_SCHEMA,
    )

    text = jockey.extract_text(resp)
    parsed: Any = None
    if text:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None

    return {
        "session_id": resp.get("session_id") or req.session_id,
        "comparison": parsed,
        "answer": text,
        "raw": resp,
    }


@app.post("/api/jockey/legibility")
async def jockey_legibility(
    req: LegibilityRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    _apply_mode(req, is_demo)
    if is_demo and not live:
        cached = _demo_cache_hit("legibility", req.brands, game_id=req.game_id)
        if cached is not None:
            log.info(
                "legibility: served from demo cache (game=%s, %s)",
                req.game_id or "all",
                ", ".join(req.brands),
            )
            return cached
    profile = _active_profile(req.sport)
    hints = "\n".join(
        f"- {b}: {BRAND_VISUAL_HINTS.get(b, 'no visual hint provided')}"
        for b in req.brands
    )
    selections = await _game_selections(req.store_id, req.game_id)
    scope = (
        _game_scope_phrase(req.game_id) if selections else _videos_roster_for_prompt(req.videos)
    )
    user_message = (
        f"Produce a CREATIVE & VISIBILITY audit for these sponsor brands across the broadcast:\n"
        f"{', '.join(req.brands)}\n\n"
        f"Visual hints:\n{hints}\n\n"
        f"For EACH brand, evaluate every asset type they appear on "
        f"({profile['surfaces_phrase']}). For each asset, score 0-10 on: contrast, "
        f"size, position, camera_angle, motion_blur, and overall_score. Cite "
        f"specific timestamped examples in `examples` where the asset rendered "
        f"poorly. In `suggestions`, recommend concrete creative or placement "
        f"fixes (e.g. 'increase contrast — current navy-on-charcoal loses "
        f"detail in wide shots; switch to white outline')."
        + scope
    )

    resp = await jockey.responses(
        instructions=profile["instructions"],
        user_message=user_message,
        knowledge_store_id=req.store_id,
        session_id=req.session_id,
        json_schema=LEGIBILITY_SCHEMA,
        selections=selections,
    )

    text = jockey.extract_text(resp)
    parsed: Any = None
    if text:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None

    return {
        "session_id": resp.get("session_id") or req.session_id,
        "report": parsed,
        "answer": text,
        "raw": resp,
    }


# --- Report (F5) --------------------------------------------------------------


class ReportRequest(BaseModel):
    brand: str
    # Scopes to report: game ids and/or "aggregate". Empty = whole collection.
    game_ids: list[str] = Field(default_factory=list)
    # Client-computed (econ.ts) weighted media value, keyed by scope id. Optional.
    media_values: dict[str, float] = Field(default_factory=dict)
    total_media_value: float | None = None
    generated_note: str = ""


def _brand_in_inventory(envelope: dict[str, Any] | None, brand: str) -> dict[str, Any] | None:
    if not envelope:
        return None
    want = brand.strip().lower()
    for b in (envelope.get("inventory") or {}).get("brands") or []:
        if (b.get("name") or "").strip().lower() == want:
            return b
    return None


def _avg_legibility(envelope: dict[str, Any] | None, brand: str) -> float | None:
    if not envelope:
        return None
    want = brand.strip().lower()
    for b in (envelope.get("report") or {}).get("brands") or []:
        if (b.get("name") or "").strip().lower() == want:
            scores = [
                a.get("overall_score")
                for a in b.get("assets") or []
                if isinstance(a.get("overall_score"), (int, float))
            ]
            return sum(scores) / len(scores) if scores else None
    return None


def _report_scopes(req: ReportRequest) -> list[dict[str, Any]]:
    """Assemble per-scope report data for ``req.brand`` from committed fixtures.

    Primary path: one scope per requested game id (or aggregate) that has an
    analyze fixture containing the brand. Fallback: if nothing resolves, derive
    per-game rows by grouping the aggregate fixture's appearances by source video.
    """
    scope_ids = req.game_ids or [demo_cache.AGGREGATE]
    scopes: list[dict[str, Any]] = []
    for sid in scope_ids:
        metrics = _brand_in_inventory(demo_cache.load("analyze", sid), req.brand)
        if metrics is None:
            continue
        scopes.append(
            {
                "game_id": sid,
                "label": games.label(None if sid == demo_cache.AGGREGATE else sid),
                "metrics": metrics,
                "avg_legibility": _avg_legibility(demo_cache.load("legibility", sid), req.brand),
                "media_value": req.media_values.get(sid),
            }
        )
    if scopes:
        return scopes

    # Fallback: group the aggregate fixture's appearances by source video (game).
    agg = _brand_in_inventory(demo_cache.load("analyze", demo_cache.AGGREGATE), req.brand)
    if not agg:
        return []
    by_video: dict[str, list[dict[str, Any]]] = {}
    for m in agg.get("appearances") or []:
        by_video.setdefault(m.get("video") or "unknown", []).append(m)
    avg_leg = _avg_legibility(demo_cache.load("legibility", demo_cache.AGGREGATE), req.brand)
    for video, apps in by_video.items():
        secs = sum(max(float(m.get("end_sec") or 0) - float(m.get("start_sec") or 0), 0) for m in apps)
        scopes.append(
            {
                "game_id": video,
                "label": video,
                "metrics": {
                    "total_seconds": round(secs, 1),
                    "moments_count": len(apps),
                    "outside_whistle_to_whistle_seconds": 0,
                    "appearances": apps,
                },
                "avg_legibility": avg_leg,
                "media_value": req.media_values.get(video),
            }
        )
    return scopes


@app.post("/api/report")
async def performance_report(req: ReportRequest, is_demo: bool = Depends(tl_key)) -> HTMLResponse:
    """Templated, printable performance report for one brand across game(s).

    Reads raw exposure/legibility from the committed demo fixtures; weighted media
    value / ROI are computed client-side and passed in ``media_values`` (backend
    does no economics). Returns standalone HTML (print-to-PDF for the demo).
    """
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="brand is required")
    scopes = _report_scopes(req)
    if not scopes:
        raise HTTPException(
            status_code=404,
            detail=f"No pre-baked analysis found for {req.brand!r}. Run the demo analysis first.",
        )
    html = report_tpl.build_report_html(
        req.brand,
        scopes,
        total_media_value=req.total_media_value,
        generated_note=req.generated_note,
    )
    return HTMLResponse(content=html)


# --- Highlight reels (F6) -----------------------------------------------------


@app.get("/api/reel/{game_id}/{brand}")
async def highlight_reel(game_id: str, brand: str) -> Any:
    """Redirect to a brand's pre-built ~30s highlight reel (Vercel Blob URL).

    Reels are produced offline by ``build_reels.py`` and their URLs committed to
    ``demo_fixtures/<scope>/reels.json``. 404 until a reel has been built. No auth:
    the target is a public Blob URL and this only reads committed metadata, so the
    UI can open it directly in a new tab.
    """
    scope = None if game_id in ("all", demo_cache.AGGREGATE) else game_id
    record = reels.get(scope, brand)
    if not record or not record.get("url"):
        raise HTTPException(
            status_code=404,
            detail=f"No highlight reel built yet for {brand!r} ({game_id}). Run build_reels.py.",
        )
    return RedirectResponse(url=record["url"])


# --- Static UI ----------------------------------------------------------------
# The React app (Vite build) is emitted to ./webapp and served at "/". API
# routes above are registered first, so the asset mount never shadows them.
WEBAPP_DIR = Path(__file__).parent / "webapp"

if (WEBAPP_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=WEBAPP_DIR / "assets"), name="assets")


@app.get("/")
async def index() -> Any:
    """Serve the built React app."""
    built = WEBAPP_DIR / "index.html"
    if built.exists():
        return FileResponse(built)
    return {"detail": "UI not built — run `npm install && npm run build` in frontend/"}
