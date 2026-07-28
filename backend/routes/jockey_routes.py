"""The Jockey analysis endpoints.

Each cacheable endpoint follows the same shape: in demo mode serve the committed
fixture, unless ``?live=1`` forces a fresh ``/responses`` run. BYO-key mode never
reads the cache — a user's own key always runs live against their own store.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core.deps import apply_mode, tl_key
from domain.sponsor.models import (
    AnalyzeRequest,
    CompareRequest,
    DiscoverRequest,
    LegibilityRequest,
    QueryRequest,
)
from services import analyze as analyze_svc
from services import compare as compare_svc
from services import demo
from services import discover as discover_svc
from services import legibility as legibility_svc
from services import query as query_svc

log = logging.getLogger("jockey-demo")

router = APIRouter(prefix="/api/jockey")


@router.post("/query")
async def jockey_query(req: QueryRequest, is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    apply_mode(req, is_demo)
    return await query_svc.run(
        question=req.question,
        store_id=req.store_id,
        sport=req.sport,
        videos=req.videos,
        structured=req.structured,
        session_id=req.session_id,
    )


@router.post("/discover")
async def jockey_discover(
    req: DiscoverRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Pass 1: list every distinct sponsor brand visible. No timestamps.

    In demo mode, served instantly from the pre-baked fixture unless ``?live=1``.
    """
    apply_mode(req, is_demo)
    if is_demo and not live:
        cached = demo.cache_hit("discover", req.store_id, game_id=req.game_id)
        if cached is not None:
            log.info("discover: served from demo cache (game=%s)", req.game_id or "all")
            return cached
    return await discover_svc.run(
        store_id=req.store_id,
        sport=req.sport,
        videos=req.videos,
        game_id=req.game_id,
        session_id=req.session_id,
    )


@router.post("/analyze")
async def jockey_analyze(
    req: AnalyzeRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Pass 2: fan out per-brand appearance queries for the selected brands.

    In demo mode, the canonical brand pair is served from cache unless ``?live=1``.
    """
    apply_mode(req, is_demo)
    brand_names = [b.strip() for b in req.brands if b and b.strip()]
    if not brand_names:
        raise HTTPException(status_code=400, detail="provide at least one brand name")

    if is_demo and not live:
        cached = demo.cache_hit("analyze", req.store_id, brand_names, game_id=req.game_id)
        if cached is not None:
            log.info(
                "analyze: served from demo cache (game=%s, %s)",
                req.game_id or "all",
                ", ".join(brand_names),
            )
            return cached

    return await analyze_svc.run(
        brand_names=brand_names,
        store_id=req.store_id,
        sport=req.sport,
        videos=req.videos,
        game_id=req.game_id,
        session_id=req.session_id,
    )


@router.post("/legibility")
async def jockey_legibility(
    req: LegibilityRequest, live: bool = False, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Pass 3: contrast / size / position / angle / blur audit per brand asset."""
    apply_mode(req, is_demo)
    if is_demo and not live:
        cached = demo.cache_hit("legibility", req.store_id, req.brands, game_id=req.game_id)
        if cached is not None:
            log.info(
                "legibility: served from demo cache (game=%s, %s)",
                req.game_id or "all",
                ", ".join(req.brands),
            )
            return cached
    return await legibility_svc.run(
        brands=req.brands,
        store_id=req.store_id,
        sport=req.sport,
        videos=req.videos,
        game_id=req.game_id,
        session_id=req.session_id,
    )


@router.post("/compare")
async def jockey_compare(req: CompareRequest, is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    apply_mode(req, is_demo)
    return await compare_svc.run(
        brands=req.brands,
        store_id=req.store_id,
        sport=req.sport,
        videos=req.videos,
        max_top_moments=req.max_top_moments,
        session_id=req.session_id,
    )
