"""Demo-mode fixture lookup — the cached path that makes the demo tab instant."""
from __future__ import annotations

import logging
from typing import Any

import demo_cache
from domain.sponsor import provenance

log = logging.getLogger("jockey-demo")


def cache_hit(
    endpoint: str,
    store_id: str,
    brands: list[str] | None = None,
    game_id: str | None = None,
) -> dict[str, Any] | None:
    """Cached demo response for ``endpoint``, or ``None`` to fall through to live Jockey.

    Three ways this returns ``None``, all meaning "run it live":

    - **No fixture** for this endpoint/game.
    - **Wrong store.** The fixture records the knowledge store it was captured
      from; if that isn't ``store_id`` we refuse it. Committed fixtures describe
      our Premier League collection, so anyone pointing the app at their own
      store gets a real run instead of our numbers. A fixture with no recorded
      store is treated as un-servable for the same reason.
    - **Missing brand.** Brand-scoped endpoints (analyze, legibility) are served
      by trimming the fixture's full brand set to the requested subset; if any
      requested brand isn't present we fall through rather than silently
      substituting.
    """
    envelope = demo_cache.load(endpoint, game_id)
    if envelope is None:
        return None

    captured_store = provenance.store_id_of(envelope)
    if captured_store != store_id:
        log.info(
            "%s: fixture skipped (captured for store %s, request is for %s) — running live",
            endpoint,
            captured_store or "<unrecorded>",
            store_id,
        )
        return None

    if brands is not None:
        envelope = demo_cache.subset_brands(endpoint, envelope, brands)
        if envelope is None:
            return None

    return provenance.as_fixture(envelope)
