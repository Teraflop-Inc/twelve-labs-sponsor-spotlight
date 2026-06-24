"""Regenerate the demo-tab fixtures from a live Jockey run.

The demo tab serves pre-baked results (see ``demo_cache.py``) so prospects see a
fully-rendered analysis instantly. Run this once whenever the demo collection or
the canonical brand pair changes; it executes the real discover → analyze →
legibility flow against the demo store and writes ``demo_fixtures/*.json``.

Usage::

    SPONSOR_SPOTLIGHT_TL_KEY=tlk_... uv run python capture_demo_cache.py

(The key must own the demo store ``SPONSOR_SPOTLIGHT_STORE_ID``. ``TWELVELABS_API_KEY``
/ ``TWELVE_LABS_API_KEY`` are accepted as fallbacks.) The large raw Jockey
payload is stripped before saving — the UI never reads it.
"""
from __future__ import annotations

import asyncio
import os
import sys

import demo_cache
import jockey
import main


def _key() -> str:
    for var in ("SPONSOR_SPOTLIGHT_TL_KEY", "TWELVELABS_API_KEY", "TWELVE_LABS_API_KEY"):
        v = os.environ.get(var)
        if v:
            return v.strip()
    sys.exit(
        "No TwelveLabs key found. Set SPONSOR_SPOTLIGHT_TL_KEY (or TWELVELABS_API_KEY)."
    )


def _slim(envelope: dict) -> dict:
    """Drop the bulky raw Jockey response the frontend never reads."""
    return {k: v for k, v in envelope.items() if k != "raw"}


async def main_async() -> None:
    jockey.set_api_key(_key())
    store = main.DEMO_STORE_ID
    sport = main.DEMO_SPORT
    brands = main.DEMO_BRANDS
    print(f"Demo store : {store}\nSport      : {sport}\nBrands     : {brands}\n")

    # Resolve the ready-video roster exactly as the app would.
    vids = await main._videos_from_store(store)
    videos = [
        v["video_filename"]
        for v in vids
        if (v.get("status") or "ready") == "ready" and v.get("video_filename")
    ]
    print(f"Ready videos ({len(videos)}): {', '.join(videos) or '(none)'}\n")
    if not videos:
        sys.exit("No ready videos in the demo store — cannot capture.")

    print("→ discover (live)…")
    d = await main.jockey_discover(
        main.DiscoverRequest(store_id=store, sport=sport, videos=videos),
        live=True,
        is_demo=True,
    )
    p = demo_cache.save("discover", _slim(d))
    print(f"  saved {p}  ({len(d.get('discovery', {}).get('brands', []))} brands)")

    print(f"→ analyze (live): {brands}…")
    a = await main.jockey_analyze(
        main.AnalyzeRequest(store_id=store, sport=sport, videos=videos, brands=brands),
        live=True,
        is_demo=True,
    )
    p = demo_cache.save("analyze", _slim(a))
    print(f"  saved {p}  ({len(a.get('inventory', {}).get('brands', []))} brands)")

    print(f"→ legibility (live): {brands}…")
    legib = await main.jockey_legibility(
        main.LegibilityRequest(store_id=store, sport=sport, videos=videos, brands=brands),
        live=True,
        is_demo=True,
    )
    p = demo_cache.save("legibility", _slim(legib))
    print(f"  saved {p}")

    print("\nDone. Fixtures written to backend/demo_fixtures/. Commit them.")


if __name__ == "__main__":
    asyncio.run(main_async())
