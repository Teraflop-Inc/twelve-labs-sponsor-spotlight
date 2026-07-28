"""Sponsor Spotlight — Jockey-only FastAPI backend.

Stateless by design: every request carries the caller's TwelveLabs API key in an
``x-api-key`` header (entered in the UI), plus the active knowledge-store id, its
sport, and the ready-video roster. There is no server-side state file, no
background work, and no local media — so it runs unchanged on serverless
platforms (Vercel). Footage is uploaded by the user in the TwelveLabs dashboard;
this app only creates/selects knowledge stores and runs Jockey analyses.

Layout::

    core/            config (env) + request dependencies
    domain/sponsor/  the Jockey contract: JSON schemas + prompts
    services/        one module per analysis pass
    routes/          thin HTTP layer
    jockey.py        TwelveLabs /responses client (retry/backoff)

Start here, then read ``domain/sponsor/schemas.py`` and
``domain/sponsor/prompts.py`` — those two files are the whole Jockey integration.
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import routes

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(title="Sponsor Spotlight (Jockey-only) Demo")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    routes.register(app)
    return app


# Module-level ASGI app — what uvicorn and the Vercel entrypoint import.
app = create_app()
