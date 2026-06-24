"""Demo-cache behavior: cached endpoints serve fixtures without touching Jockey,
while live-bypass, non-canonical brands, and BYO mode all fall through to live.
"""
from __future__ import annotations

import json
import os

# Demo mode requires a server key to be configured before importing main.
os.environ.setdefault("SPONSOR_SPOTLIGHT_TL_KEY", "test-demo-key")

import pytest
from fastapi.testclient import TestClient

import jockey
import main

DEMO = {"x-demo": "1"}
BYOK = {"x-api-key": "user-key"}
BODY = {"store_id": "ignored-in-demo", "sport": "soccer", "videos": []}


@pytest.fixture
def client() -> TestClient:
    return TestClient(main.app)


@pytest.fixture
def spy(monkeypatch):
    """Count live Jockey calls and stub out the network so live paths still run."""
    calls = {"n": 0}

    async def fake_responses(**_kw):
        calls["n"] += 1
        return {"session_id": "live-session"}

    monkeypatch.setattr(jockey, "responses", fake_responses)
    monkeypatch.setattr(
        jockey,
        "extract_text",
        lambda _resp: json.dumps({"brands": [{"name": "X"}], "summary": "s"}),
    )
    return calls


# --- cache hits: no Jockey call -------------------------------------------------


def test_discover_demo_served_from_cache(client, spy):
    r = client.post("/api/jockey/discover", json=BODY, headers=DEMO)
    assert r.status_code == 200
    # The captured fixture holds the full sponsor inventory (~150 brands); exact
    # count varies per capture, so just assert it's substantial.
    assert len(r.json()["discovery"]["brands"]) > 50
    assert spy["n"] == 0  # never hit Jockey


def test_analyze_demo_canonical_served_from_cache(client, spy):
    body = {**BODY, "brands": ["Etihad", "Emirates"]}
    r = client.post("/api/jockey/analyze", json=body, headers=DEMO)
    assert r.status_code == 200
    names = {b["name"] for b in r.json()["inventory"]["brands"]}
    assert names == {"Etihad", "Emirates"}
    assert spy["n"] == 0


def test_legibility_demo_canonical_cache_is_order_and_case_insensitive(client, spy):
    body = {**BODY, "brands": ["emirates", "etihad"]}  # reversed + lowercase
    r = client.post("/api/jockey/legibility", json=body, headers=DEMO)
    assert r.status_code == 200
    assert r.json()["report"]["brands"]
    assert spy["n"] == 0


# --- fall-through: live Jockey path ---------------------------------------------


def test_discover_live_bypass_calls_jockey(client, spy):
    r = client.post("/api/jockey/discover?live=1", json=BODY, headers=DEMO)
    assert r.status_code == 200
    assert spy["n"] == 1  # bypass forces a live call


def test_analyze_noncanonical_brands_calls_jockey(client, spy):
    body = {**BODY, "brands": ["Nike"]}  # not the cached pair
    r = client.post("/api/jockey/analyze", json=body, headers=DEMO)
    assert r.status_code == 200
    assert spy["n"] >= 1


def test_byok_mode_never_reads_cache(client, spy):
    # A real user key must always run live, even though a demo fixture exists.
    r = client.post("/api/jockey/discover", json=BODY, headers=BYOK)
    assert r.status_code == 200
    assert spy["n"] == 1


# --- demo info ------------------------------------------------------------------


def test_demo_info_exposes_brands_and_cache_flag(client):
    info = client.get("/api/demo/info").json()
    assert info["demo_brands"] == ["Etihad", "Emirates"]
    assert info["cached"] is True
