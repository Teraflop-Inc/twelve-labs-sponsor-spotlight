"""Per-context value multipliers — the "monetizability" of a moment.

Mirrors ``frontend/src/lib/econ.ts`` ``DEFAULT_WEIGHTS``. A logo shown during a
goal/celebration is worth more than a long background board in a wide shot, so we
weight moments by their broadcast context when ranking "top plays" (report top
moments + highlight-reel clip selection) and when computing media value.

Keys match the ``context`` enum in ``main.SPONSOR_MOMENTS_SCHEMA``. ``goal`` is an
alias for ``score`` (the scoring play), matching the frontend.
"""
from __future__ import annotations

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
    "commercial": 0.5,
    "other": 1.0,
}


def weight_for(context: str | None, weights: dict[str, float] | None = None) -> float:
    """Value multiplier for a broadcast context (defaults to 1.0 if unknown)."""
    table = weights or CONTEXT_WEIGHTS
    key = (context or "other").strip().lower()
    return float(table.get(key, table.get("other", 1.0)))
