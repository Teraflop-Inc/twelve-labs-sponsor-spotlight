"""Regenerate the demo-tab fixtures from live Jockey runs — per game + aggregate.

The demo tab serves pre-baked results (see ``demo_cache.py``) so prospects see a
fully-rendered analysis instantly. v2 pre-bakes **every game** (scoped via the
``selections`` param) plus an **aggregate** whole-collection roll-up, across the
full brand set. Run this whenever the demo collection or brand set changes; it
executes the real discover → analyze → legibility flow and writes
``demo_fixtures/<game_id|aggregate>/*.json``.

Usage::

    SPONSOR_SPOTLIGHT_TL_KEY=tlk_... uv run python capture_demo_cache.py

Analyze runs **one brand per Jockey call, sequentially, paced** (Jockey allows
~2 req/min) and writes the fixture **incrementally** — so a run that dies on a
rate limit can be re-invoked and skips brands already captured. Legibility and
reels only make sense for the brands you'd actually pitch, so legibility is
scoped to the top-N brands per game (reels likewise, in ``build_reels.py``).

Environment knobs:
  SPONSOR_SPOTLIGHT_CAPTURE_BRANDS   comma list to analyze per scope (default: all discovered)
  SPONSOR_SPOTLIGHT_LEGIBILITY_TOPN  brands to audit for legibility per scope (default 8)
  SPONSOR_SPOTLIGHT_CAPTURE_GAMES    comma list of scope ids (default: aggregate + all games)
  SPONSOR_SPOTLIGHT_CAPTURE_DELAY    seconds between Jockey calls (default 30 ≈ 2 req/min)
  SPONSOR_SPOTLIGHT_CAPTURE_FORCE    "1" to re-capture everything from scratch
"""
from __future__ import annotations

import asyncio
import os
import sys

import demo_cache
import games
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


def _env_list(name: str) -> list[str]:
    return [s.strip() for s in os.environ.get(name, "").split(",") if s.strip()]


DELAY = float(os.environ.get("SPONSOR_SPOTLIGHT_CAPTURE_DELAY", "30"))
# Analyze the top-N most-exposed brands per scope (0 = every discovered brand).
# Jockey's demo key is capped at 100 req/day, so all-brands isn't viable in one
# pass; top-N keeps a whole per-game capture inside a single day's quota.
ANALYZE_TOPN = int(os.environ.get("SPONSOR_SPOTLIGHT_ANALYZE_TOPN", "8"))
LEGIBILITY_TOPN = int(os.environ.get("SPONSOR_SPOTLIGHT_LEGIBILITY_TOPN", "8"))
FORCE = os.environ.get("SPONSOR_SPOTLIGHT_CAPTURE_FORCE", "") not in ("", "0", "false")
BRAND_OVERRIDE = _env_list("SPONSOR_SPOTLIGHT_CAPTURE_BRANDS")


def _aggregate_exposure() -> dict[str, float]:
    """brand(lower) → total_seconds from the aggregate fixture, for ranking."""
    env = demo_cache.load("analyze", demo_cache.AGGREGATE)
    out: dict[str, float] = {}
    for b in (env or {}).get("inventory", {}).get("brands", []):
        name = (b.get("name") or "").strip().lower()
        if name:
            out[name] = float(b.get("total_seconds") or 0)
    return out


def _top_brands(brands: list[str], n: int) -> list[str]:
    """Top-N brands ranked by aggregate exposure (most pitch-worthy first)."""
    if n <= 0:
        return brands
    exp = _aggregate_exposure()
    return sorted(brands, key=lambda b: exp.get(b.strip().lower(), 0.0), reverse=True)[:n]


def _slim(envelope: dict) -> dict:
    """Drop the bulky raw Jockey response the frontend never reads."""
    return {k: v for k, v in envelope.items() if k != "raw"}


async def _throttle() -> None:
    if DELAY > 0:
        await asyncio.sleep(DELAY)


def _analyzed_names(scope_id: str) -> set[str]:
    """Brand names already present in a scope's analyze fixture (for resume)."""
    env = demo_cache.load("analyze", scope_id)
    if not env:
        return set()
    return {
        (b.get("name") or "").strip().lower()
        for b in (env.get("inventory") or {}).get("brands") or []
    }


async def capture_scope(
    scope_id: str, game_id: str | None, store: str, sport: str, videos: list[str]
) -> None:
    """Capture discover / (paced) analyze / legibility for one scope."""
    label = games.label(game_id)
    print(f"\n=== {scope_id}  ({label}) ===", flush=True)

    # --- discover -------------------------------------------------------------
    disc = None if FORCE else demo_cache.load("discover", scope_id)
    if disc is None:
        print("→ discover (live)…", flush=True)
        d = await main.jockey_discover(
            main.DiscoverRequest(store_id=store, sport=sport, videos=videos, game_id=game_id),
            live=True,
            is_demo=True,
        )
        demo_cache.save("discover", _slim(d), scope_id)
        disc = d
        print(f"  {len(d.get('discovery', {}).get('brands', []))} brands discovered", flush=True)
        await _throttle()
    else:
        print("• discover cached", flush=True)

    # Dedupe case-variant brand names (e.g. "GEICO" vs "Geico") so we never
    # analyze the same sponsor twice or show it twice in the UI.
    discovered: list[str] = []
    seen: set[str] = set()
    for b in disc.get("discovery", {}).get("brands", []):
        name = b.get("name")
        if name and name.strip().lower() not in seen:
            seen.add(name.strip().lower())
            discovered.append(name)
    # Top-N most-exposed brands that actually appear in this scope (no wasted
    # calls on absent brands); BRAND_OVERRIDE forces an explicit list instead.
    brands = BRAND_OVERRIDE or _top_brands(discovered, ANALYZE_TOPN)

    # --- analyze: one brand per call, paced, resumable ------------------------
    selections = await main._game_selections(store, game_id)
    done = set() if FORCE else _analyzed_names(scope_id)
    existing = [] if FORCE else (
        (demo_cache.load("analyze", scope_id) or {}).get("inventory", {}).get("brands", [])
    )
    merged: list[dict] = list(existing)
    todo = [b for b in brands if b.strip().lower() not in done]
    print(f"→ analyze: {len(todo)} to do, {len(done)} cached ({len(brands)} total)", flush=True)
    for i, brand in enumerate(todo, 1):
        r = await main._fetch_brand_appearances(brand, store, sport, videos, game_id, selections)
        if r:
            r.setdefault("name", brand)
            merged.append(r)
            demo_cache.save(
                "analyze",
                {"session_id": None, "inventory": {"brands": merged, "summary": ""}, "timings": {}},
                scope_id,
            )
        print(f"  [{i}/{len(todo)}] {brand}{'' if r else '  (no data)'}", flush=True)
        await _throttle()

    # --- legibility: top-N brands only (a detailed per-asset audit) -----------
    if FORCE or demo_cache.load("legibility", scope_id) is None:
        top = brands[:LEGIBILITY_TOPN]
        print(f"→ legibility (live): top {len(top)} brand(s)…", flush=True)
        legib = await main.jockey_legibility(
            main.LegibilityRequest(
                store_id=store, sport=sport, videos=videos, brands=top, game_id=game_id
            ),
            live=True,
            is_demo=True,
        )
        demo_cache.save("legibility", _slim(legib), scope_id)
        await _throttle()
    else:
        print("• legibility cached", flush=True)


async def main_async() -> None:
    jockey.set_api_key(_key())
    store = main.DEMO_STORE_ID
    sport = main.DEMO_SPORT

    requested = _env_list("SPONSOR_SPOTLIGHT_CAPTURE_GAMES")
    scopes: list[tuple[str, str | None]] = [(demo_cache.AGGREGATE, None)]
    scopes += [(g["id"], g["id"]) for g in games.GAMES]
    if requested:
        scopes = [(sid, gid) for sid, gid in scopes if sid in requested]

    print(f"Demo store : {store}\nSport      : {sport}")
    print(f"Scopes     : {', '.join(sid for sid, _ in scopes)}")
    print(f"Delay      : {DELAY}s/call   Legibility top-N: {LEGIBILITY_TOPN}   Force: {FORCE}")

    vids = await main._videos_from_store(store)
    videos = [
        v["video_filename"]
        for v in vids
        if (v.get("status") or "ready") == "ready" and v.get("video_filename")
    ]
    print(f"Ready videos ({len(videos)}): {', '.join(videos) or '(none)'}")
    if not videos:
        sys.exit("No ready videos in the demo store — cannot capture.")

    for scope_id, game_id in scopes:
        try:
            await capture_scope(scope_id, game_id, store, sport, videos)
        except Exception as e:  # noqa: BLE001 — keep going; run is resumable
            print(f"!! {scope_id} failed: {type(e).__name__}: {e}", file=sys.stderr, flush=True)

    print("\nDone. Fixtures written to backend/demo_fixtures/<scope>/. Commit them.")


if __name__ == "__main__":
    asyncio.run(main_async())
