"""JSON schemas passed to Jockey ``/responses`` as ``json_schema``.

Each analysis pass pins its own schema, which is what makes the output
computable instead of prose. The passes, in the order the app runs them:

===========================  ============================================
Schema                       Pass
===========================  ============================================
``DISCOVERY_SCHEMA``         1. Which sponsors appear at all (no timestamps)
``PER_BRAND_SCHEMA``         2. Every appearance of ONE brand, timed
``GAME_EVENTS_SCHEMA``       2b. Every occurrence of ONE event kind, timed
``LEGIBILITY_SCHEMA``        3. Creative/visibility audit per brand asset
===========================  ============================================

``INVENTORY_SCHEMA``, ``COMPARISON_SCHEMA`` and ``SPONSOR_MOMENTS_SCHEMA`` back
the single-call inventory, the two-brand comparison, and the free-form
structured query respectively. Splitting discovery from per-brand analysis
(rather than using ``INVENTORY_SCHEMA``'s one big call) is what keeps each
request inside Jockey's response budget.
"""
from __future__ import annotations

import copy

from typing import Any

import sports

# Surfaces a sponsor logo can appear on.
#
# This is per-sport: a soccer broadcast has perimeter LED and shirt-front
# sponsors, a basketball one has a scorer's table and a backboard. The list
# lives in ``sports.SPORT_PROFILES[...]["asset_types"]`` beside the
# ``surfaces_phrase`` the prompt uses, so the question and the permitted answers
# always agree.
#
# Getting this wrong is quiet and expensive: a hardcoded basketball enum on a
# soccer broadcast forced every perimeter board to be reported as
# ``courtside_led`` and pushed anything unmatched into ``other``.
#
# ``ASSET_TYPES`` is the fallback for callers with no sport in hand.
ASSET_TYPES = sports.SPORT_PROFILES[sports.DEFAULT_SPORT]["asset_types"]


def asset_types_for(sport: str | None) -> list[str]:
    """The surface vocabulary for ``sport``, falling back to the default."""
    return sports.get_profile(sport)["asset_types"]

# Match game-state at the moment of an exposure. Drives the contextual value
# weighting downstream (a logo on screen during a goal is worth more than one
# during a throw-in).
EVENT_KINDS = [
    "goal",
    "celebration",
    "replay",
    "pregame",
    "halftime",
    "postgame",
    "timeout",
    "substitution",
    "commercial",
    "other",
]

# How an exposure is framed by the camera.
VIEW_KINDS = ["close_up", "wide_shot", "other"]


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
                            "enum": ASSET_TYPES,
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
                        "view": {
                            "type": "string",
                            "enum": VIEW_KINDS,
                            "description": "How the exposure is framed (single value)",
                        },
                        "events": {
                            "type": "array",
                            "items": {"type": "string", "enum": EVENT_KINDS},
                            "description": "Match game-state at the moment of exposure (0..n)",
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
                        "suggested_weight",
                    ],
                },
            },
            "summary": {"type": "string"},
        },
        "required": ["moments", "summary"],
    },
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
                                        "enum": ASSET_TYPES,
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
                            "description": (
                                "Distinct asset types this brand appears on, using the "
                                "vocabulary from the sport's surface list in the prompt."
                            ),
                        },
                        "appearances": {
                            "type": "array",
                            "description": "Every distinct sponsor exposure for this brand, chronologically. Do not cap arbitrarily; include all distinct appearances you can identify.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "start_sec": {"type": "number"},
                                    "end_sec": {"type": "number"},
                                    "view": {
                                        "type": "string",
                                        "enum": VIEW_KINDS,
                                        "description": "How the exposure is framed (single value)",
                                    },
                                    "events": {
                                        "type": "array",
                                        "items": {"type": "string", "enum": EVENT_KINDS},
                                        "description": "Match game-state at this moment (0..n)",
                                    },
                                    "asset_type": {
                                        "type": "string",
                                        "enum": ASSET_TYPES,
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
                            "description": (
                                "Surfaces this brand appears on, using the vocabulary "
                                "from the sport's surface list in the prompt."
                            ),
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
                        "view": {
                            "type": "string",
                            "enum": VIEW_KINDS,
                            "description": "How the exposure is framed by the camera (single value)",
                        },
                        "events": {
                            "type": "array",
                            "items": {"type": "string", "enum": EVENT_KINDS},
                            "description": "Match game-state at this moment (0..n; empty if nothing notable)",
                        },
                        "asset_type": {
                            "type": "string",
                            "enum": ASSET_TYPES,
                        },
                        "placement": {
                            "type": "string",
                            "enum": ["primary", "secondary"],
                            "description": "primary = large/sharp/foreground exposure; secondary = small/background",
                        },
                        "period": {
                            "type": "string",
                            "description": "match period from the scorebug: pregame, first half, halftime, second half, stoppage, postgame",
                        },
                        "game_clock": {
                            "type": "string",
                            "description": "on-screen match clock exactly as shown on the scorebug, e.g. 23:31, 45:00, 01:07:34; empty if not legible",
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


# One focused match-events extraction pass emits a flat list of time windows for a
# SINGLE event kind (goal / celebration / replay …). The kind is fixed by which
# pass produced it (see ``services.analyze.fetch_event_windows``), so the model
# never has to choose it — it only has to find every occurrence and time it
# precisely. These windows are then deterministically stamped onto overlapping
# sponsor appearances in ``capture_demo_cache.py`` (the authority for goal tags).
GAME_EVENTS_SCHEMA: dict[str, Any] = {
    "name": "game_events",
    "schema": {
        "type": "object",
        "properties": {
            "windows": {
                "type": "array",
                "description": "Every occurrence of the requested event, chronologically. Do not cap.",
                "items": {
                    "type": "object",
                    "properties": {
                        "start_sec": {"type": "number"},
                        "end_sec": {"type": "number"},
                        "team": {
                            "type": "string",
                            "description": "Team involved, if identifiable; else empty",
                        },
                        "description": {"type": "string"},
                        "confidence": {"type": "number"},
                        "video": {"type": "string"},
                    },
                    "required": ["start_sec", "end_sec"],
                },
            },
            "summary": {"type": "string"},
        },
        "required": ["windows"],
    },
}


def _with_asset_types(schema: dict[str, Any], asset_types: list[str]) -> dict[str, Any]:
    """Copy of ``schema`` with every ``asset_type`` enum set to ``asset_types``."""
    out = copy.deepcopy(schema)

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "asset_type" and isinstance(value, dict) and "enum" in value:
                    value["enum"] = list(asset_types)
                else:
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(out)
    return out


def per_brand_schema(sport: str | None = None) -> dict[str, Any]:
    """:data:`PER_BRAND_SCHEMA` with the surface vocabulary for ``sport``."""
    return _with_asset_types(PER_BRAND_SCHEMA, asset_types_for(sport))


def legibility_schema(sport: str | None = None) -> dict[str, Any]:
    """:data:`LEGIBILITY_SCHEMA` with the surface vocabulary for ``sport``."""
    return _with_asset_types(LEGIBILITY_SCHEMA, asset_types_for(sport))
