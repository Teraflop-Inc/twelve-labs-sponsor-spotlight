"""Environment-derived configuration.

Everything the app reads from the environment lives here, so a cloner can see
the full set of knobs in one file (and ``.env.example`` can mirror it).

**Demo mode.** A locked, server-key demo: requests carrying the ``x-demo``
header use the server's own TwelveLabs key (``TWELVELABS_API_KEY``) and are
pinned to one read-only collection — the caller never supplies a key and cannot
point our key at another store. The v2 store (2026-07-14) is re-indexed with an
enrichment prompt that also captures game state (scorebug score/period/clock)
and primary-vs-background placement.
"""
from __future__ import annotations

import os

import jockey
from core import env

# Must run before the module-level reads below.
env.load()

def _flag(name: str, default: bool) -> bool:
    raw = (os.environ.get(name) or "").strip().lower()
    if not raw:
        return default
    return raw not in ("0", "false", "no", "off")


#: Lock the app to one read-only collection.
#:
#: ``True`` (default) is the sales demo: the collection and game roster are
#: pinned, the collection picker is hidden, and results come from the committed
#: fixtures. ``DEMO_MODE=False`` opens it up — any knowledge store in the
#: account can be selected and any of its videos analyzed.
#:
#: This is separate from *which* key is used. Both modes run on the server's
#: ``TWELVELABS_API_KEY``; this only controls whether the collection is fixed.
DEMO_MODE = _flag("DEMO_MODE", True)

#: Knowledge store the demo is pinned to. The default is the store the committed
#: ``demo_fixtures/`` were captured from — they record it in their provenance and
#: are refused if it doesn't match, so this value is what makes the cached demo
#: resolve. It is an account-scoped id, not a credential: without our
#: ``TWELVELABS_API_KEY`` it reads nothing. Point it at your own store and the
#: fixtures stop matching, so every request runs live against your footage.
DEMO_STORE_ID = os.environ.get(
    "SPONSOR_SPOTLIGHT_STORE_ID", "ks_019f620e-9a99-7e92-92c7-b50eb0daed4f"
)
DEMO_STORE_NAME = os.environ.get("SPONSOR_SPOTLIGHT_STORE_NAME", "PL Classics (enriched v2)")
DEMO_SPORT = os.environ.get("SPONSOR_SPOTLIGHT_SPORT", "soccer")

# The canonical brand pair the demo tab pre-bakes (see demo_cache / capture script).
# Analyze + legibility cache hits require the request to match this set.
DEMO_BRANDS = [
    b.strip()
    for b in os.environ.get("SPONSOR_SPOTLIGHT_DEMO_BRANDS", "Etihad,Emirates").split(",")
    if b.strip()
]


def demo_key() -> str | None:
    """The server-side TwelveLabs key backing demo mode, if configured.

    One name for every context: ``TWELVELABS_API_KEY`` (:data:`jockey.API_KEY_ENV_VAR`).
    Read at call time (not import time) so tests and the capture script can set
    it after import.

    Setting it on a deployed server turns on the demo tab, which spends that key
    on behalf of every visitor. Leave it unset to ship BYO-key mode only.
    """
    return jockey.key_from_env()
