"""HTTP layer — thin routers that validate, delegate to a service, and return.

Registered at ``backend/routes`` rather than ``backend/api`` on purpose: the
repo-root ``api/`` directory is the Vercel entrypoint, and a second top-level
``api`` package on ``sys.path`` would be ambiguous to import.
"""
from __future__ import annotations

from fastapi import FastAPI

from routes import demo, health, jockey_routes, reels_routes, report, stores, ui


def register(app: FastAPI) -> None:
    """Mount every router. API routes go on first so the static mounts in
    :mod:`routes.ui` can never shadow them."""
    app.include_router(health.router)
    app.include_router(demo.router)
    app.include_router(stores.router)
    app.include_router(jockey_routes.router)
    app.include_router(report.router)
    app.include_router(reels_routes.router)
    ui.mount(app)
