"""Where a response came from — stamped by the server, never inferred by the UI.

Every analysis response carries a ``provenance`` block saying whether it was
computed live against Jockey or served from a committed fixture, and which
knowledge store it describes. Two reasons this matters:

1. **The UI must not guess.** It used to derive "this is cached" from
   ``mode === "demo" && demoCached`` in the browser, which is a guess about
   server state.
2. **A fixture must never be served for the wrong store.** Fixtures record the
   store they were captured from; :func:`services.demo.cache_hit` refuses to
   serve one whose ``store_id`` doesn't match the configured store, falling
   through to a live run instead. Without that, anyone who points this app at
   their own knowledge store is silently served our Premier League results.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

KEY = "provenance"

#: Computed live against the Jockey API for this request.
SOURCE_LIVE = "jockey_live"
#: Read from a committed fixture under ``backend/demo_fixtures/``.
SOURCE_FIXTURE = "demo_fixture"

PROVIDER = "twelvelabs"
MODEL = "jockey1.0"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def stamp_live(
    envelope: dict[str, Any], *, store_id: str, game_id: str | None = None
) -> dict[str, Any]:
    """Mark ``envelope`` as freshly computed. Mutates and returns it.

    Called by the services, so a fixture captured by ``capture_demo_cache``
    inherits the ``store_id`` and timestamp of the run that produced it.
    """
    envelope[KEY] = {
        "source": SOURCE_LIVE,
        "from_cache": False,
        "store_id": store_id,
        "game_id": game_id or "aggregate",
        "provider": PROVIDER,
        "model": MODEL,
        "generated_at": _now(),
    }
    return envelope


def as_fixture(envelope: dict[str, Any]) -> dict[str, Any]:
    """Re-mark a stored envelope as cache-served, preserving capture details.

    Returns a shallow copy — fixtures are loaded fresh per request, but callers
    may hold the dict, so don't mutate it in place.
    """
    existing = envelope.get(KEY) or {}
    out = dict(envelope)
    out[KEY] = {
        **existing,
        "source": SOURCE_FIXTURE,
        "from_cache": True,
        # When the underlying Jockey run happened, not when we served it.
        "captured_at": existing.get("generated_at") or existing.get("captured_at"),
        "served_at": _now(),
    }
    out[KEY].pop("generated_at", None)
    return out


def store_id_of(envelope: dict[str, Any] | None) -> str | None:
    """The knowledge store a stored envelope was captured from, if recorded."""
    if not envelope:
        return None
    return (envelope.get(KEY) or {}).get("store_id")
