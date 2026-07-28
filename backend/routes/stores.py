"""Knowledge-store (collection) endpoints.

Collections are locked in demo mode: the demo key is pinned to one read-only
store and must never be pointed at another.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from core import config
from core.deps import tl_key
from domain.sponsor.models import AddAssetsRequest, CreateStoreRequest, UseStoreRequest
from services import stores as svc

router = APIRouter(prefix="/api")


@router.get("/knowledge-stores")
async def knowledge_stores(is_demo: bool = Depends(tl_key)) -> dict[str, Any]:
    """List the account's loadable knowledge stores (collections) for the picker."""
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    return await svc.list_stores()


@router.post("/knowledge-stores/create")
async def create_store(
    req: CreateStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    return await svc.create(name, req.sport)


@router.post("/use-knowledge-store")
async def use_knowledge_store(
    req: UseStoreRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    """Load a store's sport + video roster. In demo mode, pinned to the demo store."""
    store_id = config.DEMO_STORE_ID if is_demo else req.store_id
    return await svc.load(store_id)


@router.post("/knowledge-stores/add-assets")
async def add_assets(
    req: AddAssetsRequest, is_demo: bool = Depends(tl_key)
) -> dict[str, Any]:
    if is_demo:
        raise HTTPException(status_code=403, detail="Collections are locked in demo mode.")
    ids = [a.strip() for a in req.asset_ids if a.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="no asset_ids provided")
    return await svc.add_assets(req.store_id, ids)
