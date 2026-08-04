"""Knowledge-store (collection) endpoints.

Gated on :data:`core.config.DEMO_MODE`. When the demo is locked (the default)
the server key is pinned to one read-only collection and these endpoints are
refused, so an anonymous visitor can't point our key at an arbitrary store or
create things in our account. ``DEMO_MODE=False`` opens them up.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core import config
from core.deps import tl_key
from domain.sponsor.models import CreateStoreRequest, UseStoreRequest
from services import stores as svc

router = APIRouter(prefix="/api")


def _require_unlocked(is_demo: bool) -> None:
    """Refuse collection management while the demo is locked."""
    if is_demo and config.DEMO_MODE:
        raise HTTPException(
            status_code=403,
            detail="Collections are locked in demo mode. Set DEMO_MODE=False to select your own.",
        )


@router.get("/knowledge-stores")
async def knowledge_stores(is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    """List the account's loadable knowledge stores (collections) for the picker."""
    _require_unlocked(is_demo)
    return await svc.list_stores()


@router.post("/knowledge-stores/create")
async def create_store(
    req: CreateStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    _require_unlocked(is_demo)
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    return await svc.create(name, req.sport)


@router.post("/use-knowledge-store")
async def use_knowledge_store(
    req: UseStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Load a store's sport + video roster. Pinned to the demo store while locked."""
    store_id = config.DEMO_STORE_ID if (is_demo and config.DEMO_MODE) else req.store_id
    return await svc.load(store_id)

