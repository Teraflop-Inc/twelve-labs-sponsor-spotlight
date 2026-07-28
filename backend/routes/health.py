"""Health check and static metadata."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter

import sports

router = APIRouter(prefix="/api")


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/sports")
async def list_sports() -> dict[str, Any]:
    """Sport profiles available for new collections."""
    return {"sports": sports.list_sports(), "default": sports.DEFAULT_SPORT}
