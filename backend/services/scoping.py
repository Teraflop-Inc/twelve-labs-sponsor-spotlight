"""Resolve a ``game_id`` to the Jockey ``selections`` that scope a call to it."""
from __future__ import annotations

import logging
from typing import Any

import games
import jockey

log = logging.getLogger("jockey-demo")


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
