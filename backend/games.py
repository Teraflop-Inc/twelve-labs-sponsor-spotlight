"""Registry of the broadcasts available for per-game analysis.

A knowledge store holds several games; the app scopes an analysis to one of them
via the ``/responses`` ``selections`` param, which references a knowledge-store
*item* (``ksi_…``). Items are per-store, so ``asset_id`` is the stable identity
we key on; the ``item_id`` is resolved at run/capture time against the live store
(or read from the ``iconik_ingest.json`` manifest when present).

``game_id`` is a short, URL-safe slug used in fixture paths, the UI selector, and
the ``/api/reel`` / ``/api/report`` routes. Keep these slugs stable — they are
baked into committed fixture directory names.

**Bring your own footage.** The bundled roster describes our Premier League demo
collection, whose assets your API key cannot read. Override it without touching
this file, either way:

- ``SPONSOR_SPOTLIGHT_GAMES`` — inline JSON, easiest for Vercel::

      SPONSOR_SPOTLIGHT_GAMES='[{"id":"wk1","asset_id":"6a2…","label":"Week 1"}]'

- ``backend/games.json`` — a file of the same shape, easier to keep in git.

Both replace the bundled list entirely (no merging — a partial override that
silently kept our games would be worse than no override). Env wins over file.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

log = logging.getLogger("jockey-demo")

BACKEND_DIR = Path(__file__).resolve().parent

# Written by ``pre_processing.ingest_assets``, read here. Lives beside this
# module (backend/) rather than next to the script, so both agree on one path.
# Gitignored, so it may be absent (e.g. on Vercel) — callers fall back.
MANIFEST_PATH = BACKEND_DIR / "iconik_ingest.json"

#: Optional roster override file, same shape as :data:`DEFAULT_GAMES`.
GAMES_FILE = BACKEND_DIR / "games.json"

#: Optional roster override as inline JSON. Takes precedence over the file.
GAMES_ENV_VAR = "SPONSOR_SPOTLIGHT_GAMES"

# The aggregate ("All games") pseudo-game id used for whole-collection fixtures.
AGGREGATE_ID = "aggregate"

# The bundled demo roster — five curated Premier League broadcasts.
# asset_ids mirror pre_processing.ingest_assets.ASSETS.
DEFAULT_GAMES: list[dict[str, str]] = [
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


def _valid(entries: Any, origin: str) -> list[dict[str, str]] | None:
    """Validate a roster override, or return ``None`` with a warning.

    A malformed override falls back to the bundled roster rather than raising:
    a bad env var on a running deployment should degrade, not 500 every request.
    """
    if not isinstance(entries, list) or not entries:
        log.warning("%s: expected a non-empty JSON array of games — ignoring", origin)
        return None
    out: list[dict[str, str]] = []
    for i, e in enumerate(entries):
        if not isinstance(e, dict):
            log.warning("%s: entry %d is not an object — ignoring override", origin, i)
            return None
        missing = [k for k in ("id", "asset_id") if not str(e.get(k) or "").strip()]
        if missing:
            log.warning(
                "%s: entry %d is missing %s — ignoring override", origin, i, ", ".join(missing)
            )
            return None
        out.append(
            {
                "id": str(e["id"]).strip(),
                "asset_id": str(e["asset_id"]).strip(),
                "label": str(e.get("label") or e["id"]).strip(),
            }
        )
    return out


def _load_games() -> list[dict[str, str]]:
    """Resolve the roster: env var, then file, then the bundled default."""
    raw = (os.environ.get(GAMES_ENV_VAR) or "").strip()
    if raw:
        try:
            parsed = _valid(json.loads(raw), GAMES_ENV_VAR)
        except json.JSONDecodeError as e:
            log.warning("%s: invalid JSON (%s) — ignoring override", GAMES_ENV_VAR, e)
            parsed = None
        if parsed:
            log.info("%s: using %d game(s) from env", GAMES_ENV_VAR, len(parsed))
            return parsed

    if GAMES_FILE.exists():
        try:
            parsed = _valid(json.loads(GAMES_FILE.read_text()), str(GAMES_FILE))
        except (OSError, json.JSONDecodeError) as e:
            log.warning("%s: unreadable (%s) — ignoring override", GAMES_FILE, e)
            parsed = None
        if parsed:
            log.info("%s: using %d game(s) from file", GAMES_FILE.name, len(parsed))
            return parsed

    return list(DEFAULT_GAMES)


GAMES: list[dict[str, str]] = _load_games()

_BY_ID = {g["id"]: g for g in GAMES}
_BY_ASSET = {g["asset_id"]: g for g in GAMES}


def reload_games() -> None:
    """Re-read the roster from env/file. For tests and the capture script."""
    global GAMES, _BY_ID, _BY_ASSET
    GAMES = _load_games()
    _BY_ID = {g["id"]: g for g in GAMES}
    _BY_ASSET = {g["asset_id"]: g for g in GAMES}


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

    The manifest is written by ``pre_processing.ingest_assets`` and is
    gitignored, so it may be absent (e.g. on Vercel). Callers fall back to live
    resolution.
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
