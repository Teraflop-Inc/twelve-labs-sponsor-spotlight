"""FastAPI request dependencies — key resolution and demo-mode pinning."""
from __future__ import annotations

from fastapi import Header, HTTPException

import jockey
from core import config


async def tl_key(
    x_api_key: str | None = Header(default=None),
    x_demo: str | None = Header(default=None),
) -> bool:
    """Resolve the TwelveLabs key for this request; return ``True`` in demo mode.

    - **Demo mode** (``x-demo`` header): uses the server's own key
      (``TWELVELABS_API_KEY``) and is locked to the demo collection
      (enforced by the endpoints).
    - **BYO-key mode**: the caller's own ``x-api-key`` is required. A request
      without one is rejected rather than falling back to the server key, so a
      BYO user can never silently spend our quota.

    Note that setting ``TWELVELABS_API_KEY`` on a deployed server does enable the
    demo tab, and every ``x-demo`` request then spends that key. Leave it unset
    to ship BYO-key mode only.
    """
    if x_demo:
        demo = config.demo_key()
        if not demo:
            raise HTTPException(status_code=503, detail="Demo mode is not configured.")
        jockey.set_api_key(demo)
        return True
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing TwelveLabs API key — enter your key in the app.",
        )
    jockey.set_api_key(x_api_key)
    return False


def apply_mode(req, is_demo: bool) -> None:
    """Pin the analysis to the demo collection, when the demo is locked.

    Two separate conditions have to hold:

    - ``is_demo`` — this request is spending the *server's* key, so it must not
      be pointed at an arbitrary store by an anonymous caller.
    - :data:`core.config.DEMO_MODE` — the deployment is locked to one
      collection. With ``DEMO_MODE=False`` the caller chooses the store and we
      leave ``req`` alone.

    ``req`` is any :class:`domain.sponsor.models.StoreContext`.
    """
    if is_demo and config.DEMO_MODE:
        req.store_id = config.DEMO_STORE_ID
        req.sport = config.DEMO_SPORT
