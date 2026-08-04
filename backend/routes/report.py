"""Printable performance report."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse

import report as report_tpl
from core.deps import tl_key
from domain.sponsor.models import ReportRequest
from services import reporting

router = APIRouter(prefix="/api")


@router.post("/report")
async def performance_report(req: ReportRequest, is_demo: bool = Depends(tl_key)) -> HTMLResponse:
    """Templated, printable performance report for one brand across game(s).

    Reads raw exposure/legibility from the committed demo fixtures; weighted media
    value / ROI are computed client-side and passed in ``media_values`` (backend
    does no economics). Returns standalone HTML (print-to-PDF for the demo).
    """
    if not req.brand.strip():
        raise HTTPException(status_code=400, detail="brand is required")
    scopes = reporting.report_scopes(req.brand, req.game_ids, req.media_values)
    if not scopes:
        raise HTTPException(
            status_code=404,
            detail=f"No pre-baked analysis found for {req.brand!r}. Run the demo analysis first.",
        )
    html = report_tpl.build_report_html(
        req.brand,
        scopes,
        total_media_value=req.total_media_value,
        generated_note=req.generated_note,
        weights=req.context_weights or None,
        sources=req.sources or None,
    )
    return HTMLResponse(content=html)
