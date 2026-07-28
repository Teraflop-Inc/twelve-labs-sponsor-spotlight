"""Serve the built React app.

The Vite build is emitted to ``backend/webapp/`` and committed, because Vercel
runs this repo as a single Python function — there is no Node build step on
deploy. **Frontend changes only ship if you re-run the build and commit the
output.**
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

WEBAPP_DIR = Path(__file__).resolve().parent.parent / "webapp"


def mount(app: FastAPI) -> None:
    """Mount the static bundle. Called after the API routers are registered, so
    these mounts can never shadow an ``/api`` path."""
    if (WEBAPP_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=WEBAPP_DIR / "assets"), name="assets")

    # Static brand assets (favicon / logo lockups) live at the web root under
    # /brand; Vercel routes every path through this function, so serve them here.
    if (WEBAPP_DIR / "brand").exists():
        app.mount("/brand", StaticFiles(directory=WEBAPP_DIR / "brand"), name="brand")

    @app.get("/")
    async def index() -> Any:
        built = WEBAPP_DIR / "index.html"
        if built.exists():
            return FileResponse(built)
        return {"detail": "UI not built — run `npm install && npm run build` in frontend/"}
