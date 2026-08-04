"""Per-tag value multipliers — the "monetizability" of a moment.

Mirrors ``frontend/src/lib/moments.ts`` ``CONTEXT_WEIGHTS``. A logo shown during a
goal/celebration is worth more than a long background board in a wide shot, so we
weight moments by their tags when ranking "top plays" (report top moments +
highlight-reel clip selection) and when computing media value.

A moment now carries two orthogonal axes (see ``main.PER_BRAND_SCHEMA``):
``view`` (single camera framing) + ``events`` (0..n game-state tags, e.g. goal).
Legacy fixtures still carry a single ``context`` string; ``weight_for_moment``
handles both shapes. ``goal`` is an alias for ``score`` (the scoring play).
"""
from __future__ import annotations

from typing import Any

CONTEXT_WEIGHTS: dict[str, float] = {
    "score": 3.0,
    "goal": 3.0,
    "celebration": 2.5,
    "replay": 2.0,
    "close_up": 1.5,
    "wide_shot": 1.0,
    "pregame": 1.2,
    "halftime": 1.2,
    "postgame": 1.0,
    "timeout": 1.0,
    "substitution": 1.0,
    "commercial": 0.5,
    "other": 1.0,
}


def weight_for(context: str | None, weights: dict[str, float] | None = None) -> float:
    """Value multiplier for a single tag (defaults to 1.0 if unknown)."""
    table = weights or CONTEXT_WEIGHTS
    key = (context or "other").strip().lower()
    return float(table.get(key, table.get("other", 1.0)))


def weight_for_moment(
    m: dict[str, Any], weights: dict[str, float] | None = None
) -> float:
    """Value multiplier for a moment across both axes (view + events).

    Takes the max weight over the moment's event tags, then its view, falling
    back to the legacy single ``context`` field for pre-split fixtures.
    """
    table = weights or CONTEXT_WEIGHTS
    best: float | None = None
    for e in m.get("events") or []:
        w = table.get(str(e).strip().lower())
        if w is not None:
            best = w if best is None else max(best, w)
    view = m.get("view")
    if view:
        w = table.get(str(view).strip().lower())
        if w is not None:
            best = w if best is None else max(best, w)
    if best is not None:
        return float(best)
    return weight_for(m.get("context"), table)
