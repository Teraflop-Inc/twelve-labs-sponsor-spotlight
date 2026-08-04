"""Pre-baked demo results — instant first impression for the locked demo tab.

The demo tab runs three Jockey-backed steps (discover, analyze, legibility) that
each take ~1-3 minutes live. For a prospect evaluating the product that wait is
fatal, so in **demo mode** we serve pre-computed results from committed JSON
fixtures — sub-second, no API call. Users who want to test their own inputs can
still force a live run (see ``live`` bypass in main).

**v2 layout — keyed by game.** Fixtures live under::

    backend/demo_fixtures/<game_id>/<endpoint>.json   # one of games.GAMES ids
    backend/demo_fixtures/aggregate/<endpoint>.json   # whole-collection roll-up
    backend/demo_fixtures/<endpoint>.json             # legacy flat == aggregate

Each file holds the exact response envelope the matching endpoint returns. The
per-game analyze/legibility fixtures carry the **full brand set**; a request for
a subset of brands is served by filtering the fixture in-memory (see
``subset_brands``). Regenerate with ``capture_demo_cache.py``. The directory is
read-only at runtime (Vercel serverless), which is fine — we only ever read.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

FIXTURE_DIR = Path(__file__).parent / "demo_fixtures"

# Endpoints we cache. ``compare`` exists in the API but isn't surfaced in the UI.
CACHEABLE = ("discover", "analyze", "legibility")

# Directory name for the whole-collection ("All games") roll-up.
AGGREGATE = "aggregate"


def normalize_brands(brands: list[str] | None) -> tuple[str, ...]:
    """Order/case-insensitive brand key, so ['Carlsberg','Toyota'] == ['toyota','carlsberg']."""
    if not brands:
        return ()
    return tuple(sorted(b.strip().lower() for b in brands if b and b.strip()))


def brands_match(a: list[str] | None, b: list[str] | None) -> bool:
    return normalize_brands(a) == normalize_brands(b)


def _candidate_paths(endpoint: str, game_id: str | None) -> list[Path]:
    """Fixture files to try, most-specific first."""
    if game_id and game_id != AGGREGATE:
        return [FIXTURE_DIR / game_id / f"{endpoint}.json"]
    # Aggregate: prefer the aggregate/ dir, fall back to the legacy flat file.
    return [FIXTURE_DIR / AGGREGATE / f"{endpoint}.json", FIXTURE_DIR / f"{endpoint}.json"]


def load(endpoint: str, game_id: str | None = None) -> dict[str, Any] | None:
    """Return the cached response envelope for ``endpoint`` (+ optional ``game_id``).

    ``game_id=None`` (or ``"aggregate"``) loads the whole-collection fixture.
    Returns ``None`` if absent/unreadable.
    """
    if endpoint not in CACHEABLE:
        return None
    for path in _candidate_paths(endpoint, game_id):
        if not path.exists():
            continue
        try:
            return json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            return None
    return None


def available(game_id: str | None = None) -> bool:
    """True when every cacheable endpoint has a fixture for ``game_id``.

    Defaults to the aggregate — i.e. the classic "demo is fully pre-baked" check.
    """
    return all(load(e, game_id) is not None for e in CACHEABLE)


def cached_games(game_ids: list[str]) -> list[str]:
    """Subset of ``game_ids`` that have a complete per-game fixture set."""
    return [g for g in game_ids if available(g)]


# --- brand-subset filtering ----------------------------------------------------
# Per-game fixtures hold every analyzed brand; a request for a subset is served
# by trimming the fixture, but only when EVERY requested brand is present (else
# we fall through to a live run so nothing is silently dropped).


def _envelope_brands(endpoint: str, envelope: dict[str, Any]) -> list[dict[str, Any]]:
    if endpoint == "analyze":
        return (envelope.get("inventory") or {}).get("brands") or []
    if endpoint == "legibility":
        return (envelope.get("report") or {}).get("brands") or []
    return []


def subset_brands(
    endpoint: str, envelope: dict[str, Any], brands: list[str] | None
) -> dict[str, Any] | None:
    """Trim a fixture to the requested ``brands`` (case-insensitive).

    ``discover`` is brand-agnostic and returned unchanged. For analyze/legibility,
    returns a shallow-copied envelope whose brand list is filtered to (and ordered
    by) ``brands``; returns ``None`` if any requested brand is missing.
    """
    if not brands or endpoint == "discover":
        return envelope
    wanted = normalize_brands(brands)
    by_name = {
        (b.get("name") or "").strip().lower(): b for b in _envelope_brands(endpoint, envelope)
    }
    picked = [by_name[w] for w in wanted if w in by_name]
    if len(picked) != len(wanted):
        return None  # a requested brand isn't in the fixture → run live
    out = dict(envelope)
    if endpoint == "analyze":
        out["inventory"] = {**(envelope.get("inventory") or {}), "brands": picked}
    elif endpoint == "legibility":
        out["report"] = {**(envelope.get("report") or {}), "brands": picked}
    return out


def save(endpoint: str, payload: dict[str, Any], game_id: str | None = None) -> Path:
    """Write a fixture (used by the capture script). Returns the path written."""
    sub = FIXTURE_DIR / (game_id or AGGREGATE)
    sub.mkdir(parents=True, exist_ok=True)
    path = sub / f"{endpoint}.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    return path
