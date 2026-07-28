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

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import jockey
import routes

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("jockey-demo")


def create_app() -> FastAPI:
    app = FastAPI(title="Sponsor Spotlight (Jockey-only) Demo")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(jockey.JockeyError)
    async def _jockey_error(_req: Request, exc: jockey.JockeyError) -> JSONResponse:
        """Pass TwelveLabs' own error through instead of a bare 500.

        A quota cap reads "You have reached your free plan's daily Response limit
        (15/day). It resets at …" — that tells the user what to do. "Internal
        Server Error" does not.
        """
        log.warning("jockey error %s (%s): %s", exc.status, exc.code, exc.message)
        # 4xx are the caller's problem to see verbatim; anything else is an
        # upstream failure, which is a 502 from this app's perspective.
        status = exc.status if 400 <= exc.status < 500 else 502
        return JSONResponse(
            status_code=status,
            content={"detail": exc.message, "code": exc.code, "upstream_status": exc.status},
        )

    routes.register(app)
    return app


# Module-level ASGI app — what uvicorn and the Vercel entrypoint import.
app = create_app()
