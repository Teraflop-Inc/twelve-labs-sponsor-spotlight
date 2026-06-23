"""Attach the 5 curated Premier League assets (already uploaded to TwelveLabs)
to a dedicated Jockey knowledge store for the demo's pre-indexed footage path
(CWORK-1032), and poll until each item is indexed.

Run from backend/:
    source ../../set-env.sh
    uv run python ingest_assets.py
"""
from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Any

import jockey

MANIFEST = Path(__file__).resolve().parent / "iconik_ingest.json"

STORE_NAME = "Sponsor Spotlight — PL Classics (enriched)"
SPORT = "soccer"
# Soccer-aware enrichment: name every sponsor surface so the platform extracts
# brands at index time, but stay broad enough to catch small/partial/background
# logos (per Jockey docs: name the entities, start broad, don't over-constrain).
ENRICHMENT = (
    "This is a soccer (association football) broadcast. Extract every visible "
    "sponsor, advertiser, and brand and where each one appears. Sponsor surfaces "
    "in soccer broadcasts include: rotating and static perimeter LED advertising "
    "boards around the pitch; shirt-front sponsors; shirt-sleeve sponsors; kit "
    "manufacturer logos (e.g. Nike, adidas, Puma swooshes/marks); shorts and "
    "training-kit sponsors; stadium fascia, stand and tunnel signage; big-screen "
    "and scoreboard advertisements; goal-net, corner-flag and substitution-board "
    "branding; flash-interview and press-conference backdrops; broadcast graphics, "
    "lower-thirds, the scorebug and on-screen bug/ident overlays; and in-broadcast "
    "commercials. For each appearance capture the brand name, the surface/placement "
    "type, the broadcast context (open play, goal, celebration, replay, close-up, "
    "wide shot, pregame, halftime, postgame, substitution, commercial), and how "
    "prominent and legible the logo is. Include small, partial, briefly-visible, "
    "angled, or background logos — not only large foreground ones. Read and "
    "transcribe brand wordmarks even when only partially visible."
)

# asset_id -> human label (5 curated games, uploaded to TwelveLabs).
ASSETS = {
    "6a21c1820ca24504b0499294": "Manchester City v. Liverpool (2019-01-03)",
    "6a21c1828f3198b7e05f988f": "Manchester City v. Tottenham Hotspur (2023-12-03)",
    "6a21c1827dfcff1fd72ecb09": "Arsenal v. Tottenham Hotspur (2018-12-02)",
    "6a21c1829bbec24cdc84d671": "Liverpool v. Manchester United (2025-01-05)",
    "6a21c1828aacd3a009715542": "Tottenham Hotspur v. Chelsea (2024-12-08)",
}

_lock = asyncio.Lock()


def _now() -> str:
    return time.strftime("%H:%M:%S")


async def _write(state: dict[str, Any]) -> None:
    async with _lock:
        tmp = MANIFEST.with_suffix(".tmp")
        tmp.write_text(json.dumps(state, indent=2))
        tmp.replace(MANIFEST)


async def index_one(state: dict[str, Any], store_id: str, asset_id: str, label: str) -> None:
    try:
        item_id = await jockey.add_item(store_id, asset_id)
        state["videos"][asset_id].update(item_id=item_id, status="indexing")
        await _write(state)
        print(f"[{_now()}] INDEX start: {label} item={item_id}", flush=True)
        item = await jockey.wait_for_item(store_id, item_id, timeout_s=10800)
        st = item.get("status")
        state["videos"][asset_id]["status"] = st
        await _write(state)
        print(f"[{_now()}] {'READY' if st=='ready' else 'FAILED ('+str(st)+')'}: {label}", flush=True)
    except Exception as e:  # noqa: BLE001
        state["videos"][asset_id].update(status="error", error=f"{type(e).__name__}: {e}")
        await _write(state)
        print(f"[{_now()}] ERROR: {label} -> {type(e).__name__}: {e}", flush=True)


async def main() -> None:
    state: dict[str, Any] = {
        "store_name": STORE_NAME,
        "knowledge_store_id": None,
        "source": "iconik-pl-classics",
        "sport": SPORT,
        "videos": {a: {"label": l, "asset_id": a, "status": "pending"} for a, l in ASSETS.items()},
    }
    await _write(state)

    print(f"[{_now()}] Creating knowledge store '{STORE_NAME}'", flush=True)
    store_id = await jockey.create_knowledge_store(
        name=STORE_NAME,
        description=ENRICHMENT,
        metadata={"demo": "sponsor-spotlight", "source": "iconik-pl-classics", "sport": SPORT},
    )
    state["knowledge_store_id"] = store_id
    await _write(state)
    print(f"[{_now()}] knowledge_store_id={store_id}", flush=True)

    await asyncio.gather(*(index_one(state, store_id, a, l) for a, l in ASSETS.items()))

    ready = sum(1 for v in state["videos"].values() if v.get("status") == "ready")
    print(f"[{_now()}] DONE: {ready}/{len(ASSETS)} ready. KS={store_id}", flush=True)
    print(f"[{_now()}] manifest: {MANIFEST}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
