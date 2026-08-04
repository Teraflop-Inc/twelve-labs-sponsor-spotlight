"""Knowledge-store (collection) management — list, create, load.

Stateless: nothing is persisted server-side. The client holds the active
``store_id`` and sends it with each request.
"""
from __future__ import annotations

import logging
import re
from typing import Any

import jockey
import sports

log = logging.getLogger("jockey-demo")


def clean_store_name(name: str | None) -> str:
    """Drop the trailing unix timestamp ingest scripts append to KS names."""
    if not name:
        return ""
    return re.sub(r"\s+\d{10}$", "", name).strip()


async def videos_from_store(store_id: str) -> list[dict[str, Any]]:
    """Build the demo's videos[] from a knowledge store's items.

    Resolves each asset's filename (for moment attribution), its HLS manifest
    (for in-app playback), and a thumbnail. No local files are involved.
    """
    items = await jockey.list_items(store_id)
    videos: list[dict[str, Any]] = []
    for it in items:
        asset_id = it.get("asset_id")
        filename = asset_id
        hls_url = None
        thumbnail_url = None
        try:
            a = await jockey.get_asset(asset_id)
            filename = a.get("filename") or a.get("name") or asset_id
            hls_url = (a.get("hls") or {}).get("manifest_url")
            thumbnail_url = (a.get("thumbnail") or {}).get("representative_url")
        except Exception:  # noqa: BLE001 — metadata is best-effort
            pass
        videos.append(
            {
                "asset_id": asset_id,
                "item_id": it.get("_id"),
                "video_filename": filename,
                "hls_url": hls_url,
                "thumbnail_url": thumbnail_url,
                "status": it.get("status") or "ready",
            }
        )
    return videos


async def list_stores() -> dict[str, Any]:
    """The account's loadable knowledge stores, for the collection picker."""
    stores = await jockey.list_knowledge_stores()
    return {
        "stores": [
            {
                "id": k.get("_id"),
                "name": clean_store_name(k.get("name")),
                "item_count": k.get("item_count", 0),
            }
            for k in stores
        ]
    }


async def create(name: str, sport: str) -> dict[str, Any]:
    """Create a new (empty) knowledge store.

    The chosen sport drives the ingestion enrichment (what to extract) and is
    saved in the store metadata so query time can apply the matching profile.
    Videos are added by the user in the TwelveLabs dashboard, then the store is
    loaded here.
    """
    profile = sports.get_profile(sport)
    sport_key = sport if sport in sports.SPORT_PROFILES else sports.DEFAULT_SPORT
    store_id = await jockey.create_knowledge_store(
        name=name,
        description=profile["enrichment"],
        metadata={"demo": "sponsor-spotlight", "sport": sport_key},
    )
    log.info("create-store: %s (%s) sport=%s", store_id, name, sport_key)
    return {"id": store_id, "name": name, "sport": sport_key}


async def load(store_id: str) -> dict[str, Any]:
    """Load an existing store: return its sport + current video roster.

    Stateless — the client persists store_id/sport and renders the videos.
    Also used as the per-poll status refresh while items are still indexing.
    """
    videos = await videos_from_store(store_id)
    sport = sports.DEFAULT_SPORT
    try:
        ks = await jockey.get_knowledge_store(store_id)
        sport = (ks.get("metadata") or {}).get("sport") or sports.DEFAULT_SPORT
    except Exception:  # noqa: BLE001 — sport is best-effort
        pass
    log.info("use-knowledge-store: ks=%s videos=%d sport=%s", store_id, len(videos), sport)
    return {"store_id": store_id, "sport": sport, "videos": videos}

