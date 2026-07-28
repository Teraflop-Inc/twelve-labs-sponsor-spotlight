"""Canonical registry of the 5 curated demo games (PL Classics).

The demo knowledge store ``ks_019e955d-…`` holds five Premier League broadcasts
uploaded to TwelveLabs (see ``ingest_assets.py``). v2 scopes analysis to a single
game via the ``/responses`` ``selections`` param, which references a knowledge-
store *item* (``ksi_…``). Items are per-store, so the ``asset_id`` is the stable
identity we key on; the ``item_id`` is resolved at run/capture time against the
live store (or read from the ``iconik_ingest.json`` manifest when present).

``game_id`` is a short, URL-safe slug used in fixture paths, the UI selector, and
the ``/api/reel`` / ``/api/report`` routes. Keep these slugs stable — they are
baked into committed fixture directory names.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# game_id (slug) → { asset_id, label }. asset_ids mirror ingest_assets.ASSETS.
GAMES: list[dict[str, str]] = [
    {
        "id": "mci-liv-2019",
        "asset_id": "6a21c1820ca24504b0499294",
        "label": "Manchester City v. Liverpool (2019-01-03)",
    },
    {
        "id": "mci-tot-2023",
        "asset_id": "6a21c1828f3198b7e05f988f",
        "label": "Manchester City v. Tottenham Hotspur (2023-12-03)",
    },
    {
        "id": "ars-tot-2018",
        "asset_id": "6a21c1827dfcff1fd72ecb09",
        "label": "Arsenal v. Tottenham Hotspur (2018-12-02)",
    },
    {
        "id": "liv-mun-2025",
        "asset_id": "6a21c1829bbec24cdc84d671",
        "label": "Liverpool v. Manchester United (2025-01-05)",
    },
    {
        "id": "tot-che-2024",
        "asset_id": "6a21c1828aacd3a009715542",
        "label": "Tottenham Hotspur v. Chelsea (2024-12-08)",
    },
]

# The aggregate ("All games") pseudo-game id used for whole-collection fixtures.
AGGREGATE_ID = "aggregate"

_BY_ID = {g["id"]: g for g in GAMES}
_BY_ASSET = {g["asset_id"]: g for g in GAMES}

# Written by ``pre_processing.ingest_assets``, read here. Lives beside this
# module (backend/) rather than next to the script, so both agree on one path.
# Gitignored, so it may be absent (e.g. on Vercel) — callers fall back.
MANIFEST_PATH = Path(__file__).resolve().parent / "iconik_ingest.json"


def all_games() -> list[dict[str, str]]:
    """Public list for the UI selector / demo info (id, label, asset_id).

    ``asset_id`` lets the frontend join a game to its knowledge-store video
    (Video.asset_id) so the player + roster can scope to a single game.
    """
    return [{"id": g["id"], "label": g["label"], "asset_id": g["asset_id"]} for g in GAMES]


def game_ids() -> list[str]:
    return [g["id"] for g in GAMES]


def by_id(game_id: str | None) -> dict[str, str] | None:
    if not game_id or game_id == AGGREGATE_ID:
        return None
    return _BY_ID.get(game_id)


def by_asset(asset_id: str | None) -> dict[str, str] | None:
    return _BY_ASSET.get(asset_id or "")


def label(game_id: str | None) -> str:
    g = by_id(game_id)
    return g["label"] if g else "All games"


def _manifest_item_ids() -> dict[str, str]:
    """asset_id → item_id from a local ``iconik_ingest.json`` manifest, if any.

    The manifest is written by ``ingest_assets.py`` and is gitignored, so it may
    be absent (e.g. on Vercel). Callers fall back to live resolution.
    """
    try:
        data = json.loads(MANIFEST_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    out: dict[str, str] = {}
    for aid, v in (data.get("videos") or {}).items():
        item_id = (v or {}).get("item_id")
        if item_id:
            out[aid] = item_id
    return out


def resolve_item_id(game_id: str | None, items: list[dict[str, Any]] | None) -> str | None:
    """Resolve a ``game_id`` to its knowledge-store ``item_id``.

    ``items`` is the live item list (``jockey.list_items``); we match on
    ``asset_id``. Falls back to the ``iconik_ingest.json`` manifest when the live
    list is unavailable. Returns ``None`` for the aggregate / unknown games.
    """
    g = by_id(game_id)
    if g is None:
        return None
    asset_id = g["asset_id"]
    for it in items or []:
        if it.get("asset_id") == asset_id:
            return it.get("_id") or it.get("item_id")
    return _manifest_item_ids().get(asset_id)
