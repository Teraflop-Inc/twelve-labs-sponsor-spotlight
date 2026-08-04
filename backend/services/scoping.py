"""Resolve a ``game_id`` to the Jockey ``selections`` that scope a call to it."""
from __future__ import annotations

import logging
from typing import Any

import games
import jockey

log = logging.getLogger("jockey-demo")


async def selections_for_asset(store_id: str, asset_id: str) -> list[dict[str, Any]] | None:
    """``selections`` scoping a call to one broadcast, by TwelveLabs asset id.

    Unlike :func:`game_selections` this needs no entry in the games roster, so
    any video in any collection can be analyzed on its own.
    """
    try:
        items = await jockey.list_items(store_id)
    except Exception as e:  # noqa: BLE001
        log.warning("selections: list_items failed for %s: %s", store_id, e)
        return None
    for it in items or []:
        if it.get("asset_id") == asset_id:
            item_id = it.get("_id") or it.get("item_id")
            if item_id:
                return [{"kind": "item", "id": item_id}]
    log.warning("selections: asset %s not found in store %s", asset_id, store_id)
    return None


async def game_selections(store_id: str, game_id: str | None) -> list[dict[str, Any]] | None:
    """Build the ``selections`` list for a per-game scope, or ``None`` for aggregate.

    Resolves the game's knowledge-store ``item_id`` from the live item list
    (falling back to the ``iconik_ingest.json`` manifest). Returns ``None`` when
    no ``game_id`` is set or the item can't be resolved (→ whole-collection run).

    Pairs with :func:`domain.sponsor.prompts.game_scope_phrase`, which emits the
    ``{{sel:0}}`` token that references ``selections[0]``.
    """
    if not games.by_id(game_id):
        return None
    items: list[dict[str, Any]] = []
    try:
        items = await jockey.list_items(store_id)
    except Exception as e:  # noqa: BLE001 — fall back to manifest / aggregate
        log.warning("selections: list_items failed for %s: %s", store_id, e)
    item_id = games.resolve_item_id(game_id, items)
    if not item_id:
        log.warning("selections: could not resolve item for game_id=%s", game_id)
        return None
    return [{"kind": "item", "id": item_id}]


async def resolve(
    store_id: str,
    game_id: str | None = None,
    asset_id: str | None = None,
) -> list[dict[str, Any]] | None:
    """The ``selections`` for a request, or ``None`` for a whole-collection run.

    ``asset_id`` wins when present — it identifies a broadcast directly and works
    for any collection. ``game_id`` is the curated-roster path used by the demo.
    """
    if asset_id:
        return await selections_for_asset(store_id, asset_id)
    return await game_selections(store_id, game_id)
