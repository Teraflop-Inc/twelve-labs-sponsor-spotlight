# Sponsor Spotlight v2 — Plan (grounded in this repo)

> **Date**: 2026-07-01
> **Repo**: `Teraflop-Inc/twelve-labs-sponsor-spotlight` · branch off `main` (prior work: CWORK-1037 demo polish)
> **Basis**: transcript of "Review the Sponsor Spotlight Demo App" (2026-07-01). Follow-on to the shipped demo-cache/logo work.
> **Owner**: Will Brennan

---

## 1. What the meeting asked for (transcript-cited)

Jesse framed it as **"three parts"** (21:20) and re-summarized (26:36): *"video playback or customizing a highlight reel, export ability, and pulling data into an existing template."* Plus two cross-cutting decisions and a UI fix.

1. **Data export** (16:26–17:00, 20:03–21:20) — per-brand metrics (impressions, duration, logo count, avg legibility, CPM) as **CSV/JSON** ("CSV, Excel, something" → Will offered "JSON and CSV"); pick **all brands or a subset**; broken down **per game**, plus aggregate totals for downstream ingestion.
2. **Templated performance report** (17:00–18:07) — a prebuilt template *"for this game or these five games"* pulling raw data into impressions/engagement/ROI/sentiment; proof-of-play deliverable. **Jesse owes a real template** to match format (28:56).
3. **Highlight reel** (18:17–18:42) — a ~30s package of the key moments a brand's logo was detected; for the team (proof of play) and the brand (monetize).
4. **Per-game vs. whole-collection** (21:24–22:49) — *"select all five of these or just pick one of these games."* Jesse: game-by-game is most relevant. Will flagged the open question — *"can you run it on a specific game vs. the whole knowledge store"* — **now resolved (see §4).**
5. **Pre-cache / canned** (22:49–23:47) — Alex: *"run all of them in a loop… precached."* Jesse: *"I wouldn't even care if it's canned… even a three-minute analysis feels like forever on a customer call."*
6. **UI fix** (Aditya, 27:11) — video player and the content below it have **mismatched widths**; general spacing.

Scope decision (19:00): **stays a demo**, not a product.

---

## 2. What already exists in this repo (build on it, don't reinvent)

Stateless **FastAPI** (`backend/main.py`) + **React/Vite** frontend, deployed as **one Vercel function** (`api/index.py`). Store id + key come from the browser per request; the backend persists nothing.

**Endpoints** (`backend/main.py`): `/api/jockey/{query,discover,analyze,compare,legibility}`, `/api/demo/info`, store management. `compare` exists but isn't wired to a panel.

**Demo mode + caching (shipped in CWORK-1037):**
- Demo mode: `x-demo` header → server key `SPONSOR_SPOTLIGHT_TL_KEY`, pinned `DEMO_STORE_ID = ks_019e955d-…` (PL Classics, the 5 games), `DEMO_BRANDS` (default **Etihad,Emirates**).
- `backend/demo_cache.py` + `backend/demo_fixtures/{discover,analyze,legibility}.json`: pre-baked, **whole-collection**, **single canonical brand pair**. `_demo_cache_hit(endpoint, brands)` returns a fixture when brands match; `?live=1` bypasses. `backend/capture_demo_cache.py` regenerates fixtures.
- Frontend auto-runs the cached flow on demo entry (`state.tsx` `demoAutoNonce`), so the demo tab renders in <1s.
- **Vercel FS is read-only at runtime** → any pre-baked artifact must be **committed**, not written per-request. This is the central constraint for v2.

**Frontend** (`frontend/src/`): panels `FootagePanel`, `EconomicsPanel`, `DiscoverPanel`, `AnalyzePanel`, `LegibilityPanel`, `Player`, `Timeline`; economics math in `lib/econ.ts` (client-side, live recompute); a sticky `Player` with an imperative `seekTo/loadAsset` handle.

**Gap vs. the meeting:** today's cache is one whole-collection brand pair. v2 needs **per-game** data, **all-brands** coverage, **export**, **report**, **reel**, and a **game selector** — extending the existing fixture/cache pattern.

---

## 3. Architecture for v2 — extend the fixture cache to be per-game, add offline artifacts

Keep the shipped model (committed fixtures served instantly in demo mode) and generalize it:

- **Per-game, all-brand fixtures.** Extend `demo_fixtures/` from three whole-collection files to a **per-game** layout, e.g. `demo_fixtures/<game_id>/{discover,analyze,legibility}.json` + an `aggregate/` roll-up. Generated offline by an expanded capture script using **`selections`** scoping (§4). `demo_cache.load()` / `_demo_cache_hit()` gain a `game_id` key.
- **Committed, not runtime-generated** (Vercel read-only FS). The capture script runs locally with the demo key and commits fixtures — same as today, just per game and across all brands.
- **Highlight reels are committed artifacts too**, produced offline (FFmpeg over HLS, §4). Because reels are binary and larger, decide hosting: commit small MP4s under `backend/demo_fixtures/reels/` **or** upload to Vercel Blob/S3 and store URLs in the fixtures. (Decision in §6.)
- **Export & report render from fixtures** at request time (pure serialization/templating — fine on serverless).

---

## 4. Technical findings (verified against the live API)

- **Per-game scoping works — resolves Will's open question (22:33).** `/responses` accepts a **`selections`** param (`{"kind":"item","id":"ksi_…"}`) referenced by a `{{sel:0}}` token (0-indexed). Scope to one game, a subset, or omit for the whole store. Soft (prompt-level), not a hard wall; hard isolation would be one KS per game. **`backend/jockey.py::responses()` has no `selections` param yet — add it.**
- **Highlight reels are buildable from TwelveLabs footage.** No direct MP4 download, but `GET /assets/{id}` returns a public HLS manifest URL (CloudFront); FFmpeg `-c copy` cuts clips straight from it (verified: clean 6s clip, no re-encode). Source MP4s are not local — HLS is the source. FFmpeg confirmed installed (v8.0.1).
- The 5 games' `asset_id`/`item_id` are in `backend/iconik_ingest.json`.

---

## 5. Features → concrete changes in this repo

### F1 — Per-game scoping primitive *(foundation)*
- `backend/jockey.py`: add `selections` param to `responses()`.
- `backend/main.py`: let `discover`/`analyze`/`legibility` accept an optional `game_id` (→ `item_id` via `iconik_ingest.json`); when set, pass `selections`, inject `{{sel:0}}`, skip `_videos_roster_for_prompt`.

### F2 — Per-game pre-cache (extend the fixture cache)
- Generalize `demo_cache.py` + `demo_fixtures/` to be **keyed by game** (+ aggregate), covering the **full brand set**, not just the canonical pair.
- Expand `capture_demo_cache.py` to loop the 5 games (scoped via F1) × brands and write per-game fixtures; keep it resumable and rate-limit-aware (~2 req/min). Commit the output.
- `_demo_cache_hit` / `/api/demo/info` gain `game_id` awareness.
- Fixes the current whole-collection-only limitation.

### F3 — Per-game vs. all-games selection (UI)
- `FootagePanel.tsx` (+ `state.tsx`): add a game selector (5 games + "All"); selection flows to the discover/analyze/legibility calls and picks the matching fixture. "All" uses the aggregate.
- Keep the demo auto-run; default to "All" on entry.

### F4 — Data export (merge-on-download, client-side)
- **All the raw metadata is already in the run.** Per-appearance carries `video` (source game), `asset_type`, `context`, `start_sec`/`end_sec`, `confidence`, `description`; per-brand carries `total_seconds`, `moments_count`, `outside_whistle_to_whistle_seconds`, `asset_types`, `legibility_notes`; legibility fixture has the 0–10 scores. **Per-game breakdown = group `appearances[]` by `video`.**
- **Economics stays in the browser.** `lib/econ.ts::brandValue()` already computes weighted media value from the user's live-edited CPM/reach/audience/weights.
- **Export = merge these two client-side at download time** and emit CSV/JSON via a Blob download. No server econ port, no posting values; the file matches on-screen numbers exactly. Columns: brand, game, impressions, duration, moments, outside_whistle_to_whistle, avg_legibility, CPM, weighted_media_value — per-game rows + aggregate total.
- UI: export control on the metrics/economics panel with format + brand-scope (all/subset) picker. (A thin `GET /api/export` is optional only if we later want a server-streamed file.)

### F5 — Templated performance report
- `backend/main.py`: `POST /api/report {brand, game_ids[]}` → HTML template (print-to-PDF for demo): exposure/impressions, weighted media value/ROI, legibility, top moments, proof-of-play.
- Bake narrative/sentiment fields during capture **only if Jockey populates them**; drop empties.
- **Gated on Jesse's real template** (28:56) — ship a default now, reskin later.

### F6 — Highlight reel (~30s, pre-rendered offline)
- Offline builder (new `backend/build_reels.py` or extend the capture script): top-N weighted moments per brand×game from fixtures → `GET /assets/{id}` HLS URL → FFmpeg `-ss/-t/-c copy` per clip (±1s pad) → concat → reel artifact.
- Serve via a new `GET /api/reel/{game_id}/{brand}` (FileResponse or redirect to blob URL). UI: reel button per brand.
- **Hosting decision (§6).**

### F7 — UI polish (parallel)
- Fix the video-player vs. content **width mismatch** Aditya flagged (`Player.tsx` + layout in `App.tsx`); tighten spacing. Keep the TwelveLabs logo shipped in CWORK-1037.

---

## 6. Sequencing, open items, decisions

**Order:** F1 → F2 → F3 → F4 → F6 → F5 (gated). F7 in parallel.

**Decisions (locked 2026-07-01):**
- **Reel hosting → Vercel Blob.** Do not commit MP4s. Capture script uploads reels to Blob; fixtures store the returned URLs; `/api/reel` (or the UI) redirects to them.
- **Scoping → one KS for all games + `selections`.** Keep the single PL Classics KS; scope per game with the `selections` param (no per-game stores).
- **Export → merge-on-download, client-side.** Raw metrics from the run fixtures + economics from `lib/econ.ts`, merged in the browser into CSV/JSON. No backend economics.

**Open dependencies:**
- Lock the canonical brand list per game for the capture pass (blocks F2).
- Jesse's real report template (blocks F5 final skin).
- Confirm which report fields (engagement/sentiment) Jockey returns.
- Verify Jockey moment timestamps are accurate enough for clean reel cuts.

**Near-term target** (James, 29:24): incorporate Jesse's feedback and **pre-cache the five games** for next week's review — i.e. F1 + F2 first.

**Out of scope:** productized SaaS; live real-time analysis; the `spotdata.io` / NBA-Hawkeye "novel interactive experience" (future).

---

## 7. Note

Earlier drafts of this plan (`V2-PLAN-Sponsor-Spotlight.md`, `V2-EXECUTION-PLAN.md`) were written in the wrong copy (`../twelvelabs-jockey-demo`, backend-only, no frontend/cache). This document supersedes them and is grounded in this repo.
