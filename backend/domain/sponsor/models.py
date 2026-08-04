"""Request models.

Every analysis request carries the active store context: which knowledge store
to query (``store_id``), its sport profile (``sport``), and the ready-video
roster (``videos``, filenames) so Jockey can attribute moments per broadcast.
State lives in the browser, not on the server.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

import sports


class StoreContext(BaseModel):
    store_id: str = Field(..., description="Active knowledge store id")
    sport: str | None = Field(None, description="Sport profile key for the store")
    videos: list[str] = Field(
        default_factory=list, description="Filenames of the store's ready broadcasts"
    )
    game_id: str | None = Field(
        None,
        description="Optional per-game scope (games.GAMES id). Omit / 'aggregate' = whole collection.",
    )
    asset_id: str | None = Field(
        None,
        description=(
            "Scope to one broadcast by TwelveLabs asset id. Takes precedence over "
            "game_id and needs no roster entry, so any collection's videos can be "
            "analyzed individually."
        ),
    )
    asset_label: str | None = Field(
        None, description="Display name for asset_id, used in the prompt."
    )


class DiscoverRequest(StoreContext):
    session_id: str | None = None


class AnalyzeRequest(StoreContext):
    brands: list[str]
    session_id: str | None = None


class LegibilityRequest(StoreContext):
    brands: list[str] = Field(default_factory=lambda: ["Toyota", "Alaska Airlines"])
    session_id: str | None = None


class CompareRequest(StoreContext):
    brands: list[str] = Field(default_factory=lambda: ["Toyota", "Alaska Airlines"])
    session_id: str | None = None
    max_top_moments: int = 5


class QueryRequest(StoreContext):
    question: str
    session_id: str | None = None
    structured: bool = False


class CreateStoreRequest(BaseModel):
    name: str
    sport: str = sports.DEFAULT_SPORT


class UseStoreRequest(BaseModel):
    store_id: str


class ReportRequest(BaseModel):
    brand: str
    # Scopes to report: game ids and/or "aggregate". Empty = whole collection.
    game_ids: list[str] = Field(default_factory=list)
    # Client-computed (econ.ts) weighted media value, keyed by scope id. Optional.
    media_values: dict[str, float] = Field(default_factory=dict)
    total_media_value: float | None = None
    # Per-context value weights from the client (econ.ts); ranks top moments by
    # monetizability. Falls back to weights.CONTEXT_WEIGHTS when omitted.
    context_weights: dict[str, float] = Field(default_factory=dict)
    generated_note: str = ""
    # Data-source labels for the resolved economics (Detected / Customer-Uploaded
    # / Simulated), e.g. {"audience": "Simulated", "rate": "Simulated"}. Rendered
    # as provenance badges on the report so a simulated placeholder is never
    # mistaken for a measured value (PRD step 10).
    sources: dict[str, str] = Field(default_factory=dict)
