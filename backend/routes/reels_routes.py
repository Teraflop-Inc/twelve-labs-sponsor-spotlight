"""Highlight-reel redirect."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

import demo_cache
import reels

router = APIRouter(prefix="/api")


@router.get("/reel/{game_id}/{brand}")
async def highlight_reel(game_id: str, brand: str) -> Any:
    """Redirect to a brand's pre-built ~30s highlight reel (Vercel Blob URL).

    Reels are produced offline by ``build_reels.py`` and their URLs committed to
    ``demo_fixtures/<scope>/reels.json``. 404 until a reel has been built. No auth:
    the target is a public Blob URL and this only reads committed metadata, so the
    UI can open it directly in a new tab.
    """
    scope = None if game_id in ("all", demo_cache.AGGREGATE) else game_id
    record = reels.get(scope, brand)
    if not record or not record.get("url"):
        raise HTTPException(
            status_code=404,
            detail=f"No highlight reel built yet for {brand!r} ({game_id}). Run build_reels.py.",
        )
    return RedirectResponse(url=record["url"])
