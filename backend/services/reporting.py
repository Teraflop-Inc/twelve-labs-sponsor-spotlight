"""Assemble the printable performance report's data from committed fixtures.

Reads raw exposure/legibility only. The weighted media value and ROI are
computed client-side (``frontend/src/lib/econ.ts``) and passed in — the backend
does no economics, so the report can never disagree with the on-screen numbers.
"""
from __future__ import annotations

from typing import Any

import demo_cache
import games


def brand_in_inventory(envelope: dict[str, Any] | None, brand: str) -> dict[str, Any] | None:
    if not envelope:
        return None
    want = brand.strip().lower()
    for b in (envelope.get("inventory") or {}).get("brands") or []:
        if (b.get("name") or "").strip().lower() == want:
            return b
    return None


def avg_legibility(envelope: dict[str, Any] | None, brand: str) -> float | None:
    if not envelope:
        return None
    want = brand.strip().lower()
    for b in (envelope.get("report") or {}).get("brands") or []:
        if (b.get("name") or "").strip().lower() == want:
            scores = [
                a.get("overall_score")
                for a in b.get("assets") or []
                if isinstance(a.get("overall_score"), (int, float))
            ]
            return sum(scores) / len(scores) if scores else None
    return None


def report_scopes(
    brand: str, game_ids: list[str], media_values: dict[str, float]
) -> list[dict[str, Any]]:
    """Assemble per-scope report data for ``brand`` from committed fixtures.

    Primary path: one scope per requested game id (or aggregate) that has an
    analyze fixture containing the brand. Fallback: if nothing resolves, derive
    per-game rows by grouping the aggregate fixture's appearances by source video.
    """
    scope_ids = game_ids or [demo_cache.AGGREGATE]
    scopes: list[dict[str, Any]] = []
    for sid in scope_ids:
        metrics = brand_in_inventory(demo_cache.load("analyze", sid), brand)
        if metrics is None:
            continue
        scopes.append(
            {
                "game_id": sid,
                "label": games.label(None if sid == demo_cache.AGGREGATE else sid),
                "metrics": metrics,
                "avg_legibility": avg_legibility(demo_cache.load("legibility", sid), brand),
                "media_value": media_values.get(sid),
            }
        )
    if scopes:
        return scopes

    # Fallback: group the aggregate fixture's appearances by source video (game).
    agg = brand_in_inventory(demo_cache.load("analyze", demo_cache.AGGREGATE), brand)
    if not agg:
        return []
    by_video: dict[str, list[dict[str, Any]]] = {}
    for m in agg.get("appearances") or []:
        by_video.setdefault(m.get("video") or "unknown", []).append(m)
    avg_leg = avg_legibility(demo_cache.load("legibility", demo_cache.AGGREGATE), brand)
    for video, apps in by_video.items():
        secs = sum(max(float(m.get("end_sec") or 0) - float(m.get("start_sec") or 0), 0) for m in apps)
        scopes.append(
            {
                "game_id": video,
                "label": video,
                "metrics": {
                    "total_seconds": round(secs, 1),
                    "moments_count": len(apps),
                    "outside_whistle_to_whistle_seconds": 0,
                    "appearances": apps,
                },
                "avg_legibility": avg_leg,
                "media_value": media_values.get(video),
            }
        )
    return scopes
