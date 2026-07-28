"""Demo-cache behavior: cached endpoints serve fixtures without touching Jockey,
while live-bypass, non-canonical brands, and BYO mode all fall through to live.
"""
from __future__ import annotations

import json
import os

# Demo mode requires a server key to be configured before importing main.
os.environ.setdefault("TWELVELABS_API_KEY", "test-demo-key")

import pytest
from fastapi.testclient import TestClient

import demo_cache
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

    async def fake_list_items(*_a, **_k):
        # Per-game scoping resolves item ids via list_items on the live path; keep
        # it offline so uncached-game requests don't hit the network.
        return []

    monkeypatch.setattr(jockey, "responses", fake_responses)
    monkeypatch.setattr(jockey, "list_items", fake_list_items)
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


def test_analyze_brand_absent_from_fixture_calls_jockey(client, spy):
    # A brand that isn't in any fixture must run live (not be silently dropped).
    body = {**BODY, "brands": ["Totally Not A Real Sponsor"]}
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


def test_demo_info_exposes_games(client):
    info = client.get("/api/demo/info").json()
    assert len(info["games"]) == 5
    assert all("id" in g and "label" in g for g in info["games"])
    assert isinstance(info["cached_games"], list)


def test_demo_scope_returns_detected_and_analyzed(client, spy):
    # Explore payload for a game: all detected brands + the analyzed subset,
    # served purely from fixtures (no Jockey).
    s = client.get("/api/demo/scope/ars-tot-2018").json()
    assert s["game_id"] == "ars-tot-2018"
    detected = {b["name"] for b in s["discovery"]}
    analyzed = {b["name"] for b in s["inventory"]}
    assert len(analyzed) == 8  # top-8 analyzed
    assert analyzed <= detected  # every analyzed brand is also in the detected list
    assert isinstance(s["reels"], dict) and s["reels"]  # reels present
    assert spy["n"] == 0


def test_demo_scope_all_maps_to_aggregate(client):
    s = client.get("/api/demo/scope/all").json()
    # "all" resolves to the aggregate analyze roll-up (top-N brands across games).
    assert s["game_id"] == "all"
    assert len(s["inventory"]) >= 5


# --- per-game scoping (v2) ------------------------------------------------------


def test_analyze_brand_subset_served_from_cache(client, spy):
    # A single canonical brand is a subset of the cached pair → still served,
    # trimmed to just that brand, with no live call.
    body = {**BODY, "brands": ["Etihad"]}
    r = client.post("/api/jockey/analyze", json=body, headers=DEMO)
    assert r.status_code == 200
    names = {b["name"] for b in r.json()["inventory"]["brands"]}
    assert names == {"Etihad"}
    assert spy["n"] == 0


def test_analyze_brand_not_in_game_falls_through_to_live(client, spy):
    # Etihad/Emirates don't appear in Liverpool v. Man Utd → the per-game fixture
    # can't satisfy the request, so it must run live (not serve the wrong brands).
    body = {**BODY, "brands": ["Etihad", "Emirates"], "game_id": "liv-mun-2025"}
    r = client.post("/api/jockey/analyze", json=body, headers=DEMO)
    assert r.status_code == 200
    assert spy["n"] >= 1


def test_two_games_return_different_cached_data(client, spy, tmp_path, monkeypatch):
    monkeypatch.setattr(demo_cache, "FIXTURE_DIR", tmp_path)
    for gid, marker in (("mci-liv-2019", "g1"), ("ars-tot-2018", "g2")):
        (tmp_path / gid).mkdir()
        (tmp_path / gid / "discover.json").write_text(
            json.dumps({"discovery": {"brands": [{"name": marker}], "summary": marker}})
        )
    r1 = client.post("/api/jockey/discover", json={**BODY, "game_id": "mci-liv-2019"}, headers=DEMO)
    r2 = client.post("/api/jockey/discover", json={**BODY, "game_id": "ars-tot-2018"}, headers=DEMO)
    assert r1.json()["discovery"]["summary"] == "g1"
    assert r2.json()["discovery"]["summary"] == "g2"
    assert spy["n"] == 0  # both served from the per-game fixtures


# --- report + reel (v2) ---------------------------------------------------------


def test_report_renders_html_for_canonical_brand(client):
    r = client.post("/api/report", json={"brand": "Etihad", "game_ids": []}, headers=DEMO)
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert "Etihad" in r.text


def test_report_unknown_brand_404(client):
    r = client.post("/api/report", json={"brand": "NoSuchBrand", "game_ids": []}, headers=DEMO)
    assert r.status_code == 404


def test_reel_missing_returns_404(client):
    # No reel built yet → 404 (endpoint is public, no auth header needed).
    r = client.get("/api/reel/all/Etihad")
    assert r.status_code == 404
