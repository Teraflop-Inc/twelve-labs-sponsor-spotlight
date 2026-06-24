"""Pre-baked demo results — instant first impression for the locked demo tab.

The demo tab runs three Jockey-backed steps (discover, analyze, legibility) that
each take ~1-3 minutes live. For a prospect evaluating the product that wait is
fatal, so in **demo mode** we serve pre-computed results for the canonical brand
pair from committed JSON fixtures — sub-second, no API call. Users who want to
test their own inputs can still force a live run (see ``live`` bypass in main).

Fixtures live in ``backend/demo_fixtures/<endpoint>.json`` and each holds the
exact response envelope the matching endpoint returns (so the route can return
it verbatim). Regenerate them with ``capture_demo_cache.py`` whenever the demo
collection changes. The directory is read-only at runtime (Vercel serverless),
which is fine — we only ever read.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

FIXTURE_DIR = Path(__file__).parent / "demo_fixtures"

# Endpoints we cache. ``compare`` exists in the API but isn't surfaced in the UI.
CACHEABLE = ("discover", "analyze", "legibility")


def normalize_brands(brands: list[str] | None) -> tuple[str, ...]:
    """Order/case-insensitive brand key, so ['Carlsberg','Toyota'] == ['toyota','carlsberg']."""
    if not brands:
        return ()
    return tuple(sorted(b.strip().lower() for b in brands if b and b.strip()))


def brands_match(a: list[str] | None, b: list[str] | None) -> bool:
    return normalize_brands(a) == normalize_brands(b)


def load(endpoint: str) -> dict[str, Any] | None:
    """Return the cached response envelope for ``endpoint``, or ``None`` if absent/unreadable."""
    if endpoint not in CACHEABLE:
        return None
    path = FIXTURE_DIR / f"{endpoint}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def available() -> bool:
    """True when every cacheable endpoint has a fixture — i.e. the demo is fully pre-baked."""
    return all((FIXTURE_DIR / f"{e}.json").exists() for e in CACHEABLE)


def save(endpoint: str, payload: dict[str, Any]) -> Path:
    """Write a fixture (used by the capture script). Returns the path written."""
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    path = FIXTURE_DIR / f"{endpoint}.json"
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    return path
