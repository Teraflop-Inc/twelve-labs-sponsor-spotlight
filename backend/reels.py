"""Highlight-reel URL registry.

Reels are ~30s MP4 packages of a brand's top moments, built offline by
``build_reels.py`` (FFmpeg over the broadcast HLS) and uploaded to Vercel Blob —
we never commit the binaries or write them at runtime (Vercel's FS is read-only).
The returned Blob URLs are committed alongside the demo fixtures::

    backend/demo_fixtures/<game_id|aggregate>/reels.json
    { "<brand-lowercased>": { "url": "https://…", "duration_sec": 31.2, "clips": 5 } }

``/api/reel/{game_id}/{brand}`` looks the URL up here and redirects to it.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from demo_cache import AGGREGATE, FIXTURE_DIR


def _path(game_id: str | None) -> Path:
    return FIXTURE_DIR / (game_id or AGGREGATE) / "reels.json"


def _key(brand: str) -> str:
    return (brand or "").strip().lower()


def load_all(game_id: str | None) -> dict[str, Any]:
    try:
        return json.loads(_path(game_id).read_text())
    except (OSError, json.JSONDecodeError):
        return {}


def get(game_id: str | None, brand: str) -> dict[str, Any] | None:
    """The reel record for a brand in a scope, or ``None`` if not built yet."""
    return load_all(game_id).get(_key(brand))


def save(game_id: str | None, brand: str, record: dict[str, Any]) -> Path:
    """Upsert a reel record (used by ``build_reels.py``). Returns the path."""
    p = _path(game_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    data = load_all(game_id)
    data[_key(brand)] = record
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return p
