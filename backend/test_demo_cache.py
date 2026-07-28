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
from core import config

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
    # How many brands get analyzed is a capture-time knob (ANALYZE_TOPN, capped
    # by how many brands actually appear in this game), so assert the invariant
    # rather than a count that drifts with every re-capture.
    assert analyzed, "expected at least one analyzed brand"
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


def _fixture(marker: str, store_id: str = config.DEMO_STORE_ID) -> str:
    """A discover fixture stamped as captured from ``store_id``."""
    return json.dumps(
        {
            "discovery": {"brands": [{"name": marker}], "summary": marker},
            "provenance": {"store_id": store_id, "source": "jockey_live"},
        }
    )


def test_two_games_return_different_cached_data(client, spy, tmp_path, monkeypatch):
    monkeypatch.setattr(demo_cache, "FIXTURE_DIR", tmp_path)
    for gid, marker in (("mci-liv-2019", "g1"), ("ars-tot-2018", "g2")):
        (tmp_path / gid).mkdir()
        (tmp_path / gid / "discover.json").write_text(_fixture(marker))
    r1 = client.post("/api/jockey/discover", json={**BODY, "game_id": "mci-liv-2019"}, headers=DEMO)
    r2 = client.post("/api/jockey/discover", json={**BODY, "game_id": "ars-tot-2018"}, headers=DEMO)
    assert r1.json()["discovery"]["summary"] == "g1"
    assert r2.json()["discovery"]["summary"] == "g2"
    assert spy["n"] == 0  # both served from the per-game fixtures


# --- fixtures are bound to the store they were captured from --------------------


def test_fixture_captured_for_another_store_is_not_served(client, spy, tmp_path, monkeypatch):
    """The bug this guards: a cloner points the app at their own knowledge store
    and is served our Premier League results because the cache only keyed on
    endpoint + brands + game id. A fixture stamped for a different store must be
    refused and the request run live instead."""
    monkeypatch.setattr(demo_cache, "FIXTURE_DIR", tmp_path)
    (tmp_path / "mci-liv-2019").mkdir()
    (tmp_path / "mci-liv-2019" / "discover.json").write_text(
        _fixture("someone-elses-data", store_id="ks_a_completely_different_store")
    )
    r = client.post("/api/jockey/discover", json={**BODY, "game_id": "mci-liv-2019"}, headers=DEMO)
    assert r.status_code == 200
    assert r.json()["discovery"]["summary"] != "someone-elses-data"
    assert spy["n"] == 1  # fell through to a live run


def test_fixture_with_no_recorded_store_is_not_served(client, spy, tmp_path, monkeypatch):
    """An unstamped fixture can't be proven to describe this store, so it is
    treated the same as a mismatch."""
    monkeypatch.setattr(demo_cache, "FIXTURE_DIR", tmp_path)
    (tmp_path / "mci-liv-2019").mkdir()
    (tmp_path / "mci-liv-2019" / "discover.json").write_text(
        json.dumps({"discovery": {"brands": [], "summary": "unstamped"}})
    )
    r = client.post("/api/jockey/discover", json={**BODY, "game_id": "mci-liv-2019"}, headers=DEMO)
    assert r.json()["discovery"]["summary"] != "unstamped"
    assert spy["n"] == 1


# --- provenance is reported by the server, not guessed by the UI ----------------


def test_cached_response_declares_itself_cached(client, spy):
    r = client.post("/api/jockey/discover", json=BODY, headers=DEMO)
    prov = r.json()["provenance"]
    assert prov["source"] == "demo_fixture"
    assert prov["from_cache"] is True
    assert prov["store_id"] == config.DEMO_STORE_ID
    assert spy["n"] == 0


def test_live_response_declares_itself_live(client, spy):
    r = client.post("/api/jockey/discover?live=1", json=BODY, headers=DEMO)
    prov = r.json()["provenance"]
    assert prov["source"] == "jockey_live"
    assert prov["from_cache"] is False
    assert prov["generated_at"]  # timestamped
    assert spy["n"] == 1


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


# --- roster is configurable (bring your own footage) ----------------------------


def test_games_roster_defaults_to_bundled_demo():
    import games

    assert [g["id"] for g in games.DEFAULT_GAMES] == [g["id"] for g in games.GAMES]
    assert len(games.GAMES) == 5


def test_games_roster_can_be_replaced_by_env(monkeypatch):
    import games

    monkeypatch.setenv(
        games.GAMES_ENV_VAR,
        json.dumps([{"id": "wk1", "asset_id": "6a2abc", "label": "Week 1"}]),
    )
    games.reload_games()
    try:
        assert games.game_ids() == ["wk1"]
        assert games.label("wk1") == "Week 1"
        assert games.by_asset("6a2abc")["id"] == "wk1"
        # Bundled games are gone — override replaces, never merges.
        assert games.by_id("mci-liv-2019") is None
    finally:
        monkeypatch.delenv(games.GAMES_ENV_VAR)
        games.reload_games()


def test_games_label_falls_back_to_id_when_omitted(monkeypatch):
    import games

    monkeypatch.setenv(games.GAMES_ENV_VAR, json.dumps([{"id": "wk1", "asset_id": "6a2abc"}]))
    games.reload_games()
    try:
        assert games.label("wk1") == "wk1"
    finally:
        monkeypatch.delenv(games.GAMES_ENV_VAR)
        games.reload_games()


@pytest.mark.parametrize(
    "bad",
    ['[{"id": "no-asset"}]', "not json at all", "[]", '{"id": "not-a-list"}'],
    ids=["missing-asset_id", "invalid-json", "empty", "not-a-list"],
)
def test_malformed_roster_override_falls_back_to_bundled(monkeypatch, bad):
    # A bad env var on a live deployment should degrade, not 500 every request.
    import games

    monkeypatch.setenv(games.GAMES_ENV_VAR, bad)
    games.reload_games()
    try:
        assert len(games.GAMES) == 5
    finally:
        monkeypatch.delenv(games.GAMES_ENV_VAR)
        games.reload_games()


# --- DEMO_MODE: locked demo vs. open collection selection -----------------------


@pytest.fixture
def unlocked(monkeypatch):
    """Run with DEMO_MODE=False — collections and games become selectable."""
    monkeypatch.setattr(config, "DEMO_MODE", False)


def test_demo_info_reports_lock_state(client):
    assert client.get("/api/demo/info").json()["demo_mode"] is True


def test_demo_info_reports_unlocked(client, unlocked):
    assert client.get("/api/demo/info").json()["demo_mode"] is False


def test_collections_are_locked_by_default(client):
    r = client.get("/api/knowledge-stores", headers=DEMO)
    assert r.status_code == 403
    assert "DEMO_MODE=False" in r.json()["detail"]


def test_collections_selectable_when_unlocked(client, unlocked, monkeypatch):
    async def fake_list(*_a, **_k):
        return [{"_id": "ks_mine", "name": "My Footage 1700000000", "item_count": 3}]

    monkeypatch.setattr(jockey, "list_knowledge_stores", fake_list)
    r = client.get("/api/knowledge-stores", headers=DEMO)
    assert r.status_code == 200
    assert r.json()["stores"] == [{"id": "ks_mine", "name": "My Footage", "item_count": 3}]


def test_locked_demo_pins_requests_to_the_demo_store(client, spy):
    # store_id in the body is ignored while locked.
    r = client.post("/api/jockey/discover?live=1", json=BODY, headers=DEMO)
    assert r.json()["provenance"]["store_id"] == config.DEMO_STORE_ID


def test_unlocked_mode_honours_the_requested_store(client, spy, unlocked):
    body = {**BODY, "store_id": "ks_my_own_collection"}
    r = client.post("/api/jockey/discover?live=1", json=body, headers=DEMO)
    assert r.json()["provenance"]["store_id"] == "ks_my_own_collection"


def test_unlocked_mode_does_not_serve_demo_fixtures_for_another_store(client, spy, unlocked):
    # The store binding still applies: our fixtures describe the demo collection.
    body = {**BODY, "store_id": "ks_my_own_collection"}
    r = client.post("/api/jockey/discover", json=body, headers=DEMO)
    assert r.json()["provenance"]["source"] == "jockey_live"
    assert spy["n"] == 1


# --- per-broadcast scoping by asset id ------------------------------------------


def test_unlocked_mode_never_serves_fixtures(client, spy, unlocked):
    # DEMO_MODE=False means a working app: always a real run, even for the demo
    # collection whose fixtures would otherwise match.
    r = client.post("/api/jockey/discover", json=BODY, headers=DEMO)
    assert r.json()["provenance"]["source"] == "jockey_live"
    assert spy["n"] == 1


def test_asset_id_scopes_the_call_to_one_broadcast(client, spy, unlocked, monkeypatch):
    seen = {}

    async def fake_items(store_id, *_a, **_k):
        return [
            {"_id": "ksi_one", "asset_id": "asset_one"},
            {"_id": "ksi_two", "asset_id": "asset_two"},
        ]

    async def fake_responses(**kw):
        seen.update(kw)
        return {"session_id": "s"}

    monkeypatch.setattr(jockey, "list_items", fake_items)
    monkeypatch.setattr(jockey, "responses", fake_responses)

    body = {**BODY, "asset_id": "asset_two", "asset_label": "Match 2"}
    client.post("/api/jockey/discover", json=body, headers=DEMO)

    # Bound to that asset's knowledge-store item, and named in the prompt.
    assert seen["selections"] == [{"kind": "item", "id": "ksi_two"}]
    assert "{{sel:0}}" in seen["user_message"]
    assert "Match 2" in seen["user_message"]


def test_unknown_asset_id_falls_back_to_whole_collection(client, spy, unlocked, monkeypatch):
    seen = {}

    async def fake_items(*_a, **_k):
        return [{"_id": "ksi_one", "asset_id": "asset_one"}]

    async def fake_responses(**kw):
        seen.update(kw)
        return {"session_id": "s"}

    monkeypatch.setattr(jockey, "list_items", fake_items)
    monkeypatch.setattr(jockey, "responses", fake_responses)

    body = {**BODY, "asset_id": "asset_missing"}
    client.post("/api/jockey/discover", json=body, headers=DEMO)
    assert seen["selections"] is None  # whole-collection run, not a wrong scope
