"""Demo-mode fixture lookup — the cached path that makes the demo tab instant."""
from __future__ import annotations

from typing import Any

import demo_cache


def cache_hit(
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
