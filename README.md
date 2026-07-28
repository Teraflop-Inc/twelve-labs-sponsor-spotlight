# Sponsor Spotlight

A sales-grade demo of the **TwelveLabs Jockey (Agents API)** for sponsorship
analytics. Point it at a collection of indexed broadcast footage and it
discovers every sponsor brand, analyzes their on-screen exposure, ranks them by
weighted media value, and audits how legibly each logo renders — every result
produced by the Jockey **`/responses`** API over a knowledge store.

Built with React + the TwelveLabs design system on the front end and a stateless
FastAPI backend. Runs as a single deployment.

---

## What it does

The app walks a prospect through a sponsor-ROI story in five steps:

| Step | Section | What happens |
|------|---------|--------------|
| 1 | **Footage** | Select the broadcast collection (locked in demo mode). |
| 2 | **Economic assumptions** | Editable CPM, reach, audience mix, and per-context weights — every $ figure recomputes live. |
| 3 | **Brand discovery** | One Jockey call lists every sponsor in the footage; pick up to two to analyze. |
| 4 | **Analyze brands** | Deep-analyzes the selected brands and ranks them by weighted media value, with a seekable exposure timeline per brand. |
| 5 | **Legibility audit** | Per-asset visibility scores (contrast, size, position, camera angle, motion blur) with timestamped examples. |

A sticky video player plays the broadcast inline; clicking any moment seeks to it.

## Two modes

- **Demo** — uses a server-side key (`TWELVELABS_API_KEY`) pinned to one
  preloaded collection. No key or setup required; the collection cannot be
  changed and the key is never exposed to the browser.
- **Use your own key** — paste a TwelveLabs API key (stored only in your browser)
  and bring your own collections.

### Demo caching (instant first impression)

In **Demo** mode the three Jockey steps (discover, analyze, legibility) are
served from pre-baked JSON fixtures, so the tab renders the full flow in
milliseconds instead of minutes. "Use your own key" mode never touches the
cache; `?live=1` (and any brand not present in the fixture) bypasses it.

**Per-game layout (v2).** Fixtures are keyed by game, plus a whole-collection
aggregate:

```
backend/demo_fixtures/
  aggregate/{discover,analyze,legibility}.json   # "All games" scope
  <game_id>/{discover,analyze,legibility}.json   # one per games.GAMES id
  <game_id>/reels.json                            # highlight-reel Blob URLs
  {discover,analyze,legibility}.json              # legacy flat == aggregate
```

The game selector (Footage panel) scopes analysis to one broadcast via the
Jockey `/responses` `selections` param (`backend/games.py` maps `game_id` →
`asset_id` → knowledge-store `item_id`); **All games** uses the aggregate.
Analyze/legibility fixtures hold the full brand set — a request for a subset is
served by trimming the fixture in-memory.

Regenerating these is the **offline pipeline** below.

**Performance report.** `POST /api/report {brand, game_ids[], media_values}`
renders a printable HTML report (`backend/report.py`) from the fixtures; the
weighted media value / ROI figures are computed client-side (`lib/econ.ts`) and
passed in — the backend does no economics. The **Report** button per brand opens
it in a new tab. **Data export** (CSV/JSON) is fully client-side
(`frontend/src/lib/export.ts`): per-game rows grouped by the appearance `video`
field + an aggregate total, merged with econ at download time so the file
matches the on-screen numbers exactly.

---

## Architecture

```
Browser (React + TwelveLabs design system)
    │  fetch /api/*   (x-api-key in BYO mode, x-demo in demo mode)
    ▼
FastAPI  (backend/main.py)  ── pure JSON API; stateless
    │  httpx
    ▼
Jockey Agents API  (api.twelvelabs.io/v1.3/responses)
```

- **Frontend** — Vite + React + TypeScript + Tailwind v4, built on the TwelveLabs
  design system (vendored under `frontend/src/tlds`, aliased to
  `@twelvelabs-io/react`). The Vite build is emitted to `backend/webapp/` and
  served by FastAPI at `/`.
- **Backend** — FastAPI. Stateless: the active collection and the user's key
  live in the browser and are sent with each request. All Jockey calls happen
  server-side; the backend persists nothing.

---

## Quick start (local)

**Prerequisites:** Python 3.11+, Node 18+.

```bash
# 1. Backend — JSON API on :8001
cd backend
uv sync                      # or: pip install -r ../requirements.txt uvicorn
cp .env.example .env         # then set TWELVELABS_API_KEY
uv run uvicorn main:app --port 8001

# 2. Frontend — Vite dev server on :5173, proxies /api → :8001
cd ../frontend
npm install
npm run dev
```

Open the Vite URL. Setting `TWELVELABS_API_KEY` enables the **Demo** tab; without
it, use **"Use your own key"** and paste a key in the UI. Exported environment
variables take precedence over `.env`, so this works too:

```bash
TWELVELABS_API_KEY=tlk_... uv run uvicorn main:app --port 8001
```

> Jockey (`jockey1.0`) is in private beta and requires an allowlisted API key.

---

## Offline pipeline

**Nothing in this section runs on Vercel.** These scripts call Jockey directly,
take minutes to hours, and write results into `backend/demo_fixtures/`
(committed) and Vercel Blob. The deployed app only ever *reads* what they
produce — so the flow is: run locally → commit the output → redeploy.

Run them from `backend/` as modules:

### Step 0 — Ingest footage

Creates a knowledge store with the sponsor-aware enrichment prompt, attaches
each already-uploaded TwelveLabs asset, and polls until every item is indexed.
Writes `backend/iconik_ingest.json` (gitignored) mapping `asset_id` → `item_id`.

```bash
uv run python -m pre_processing.ingest_assets
```

Edit `ASSETS` in `pre_processing/ingest_assets.py` and the matching `GAMES`
registry in `games.py` to point at your own footage. Assets must already exist
in your TwelveLabs account.

### Step 1 — Capture demo fixtures

Runs the real discover → analyze → legibility flow per game (scoped via
`selections`) plus a whole-collection aggregate. **Resumable** — existing files
are skipped, so a run killed by a rate limit can just be re-invoked — and paced
at ~2 req/min to stay inside Jockey's beta limit.

```bash
uv run python -m pre_processing.capture_demo_cache
# then commit backend/demo_fixtures/<scope>/*.json
```

### Step 2 — Build highlight reels

Builds a ~60s MP4 of a brand's top moments per game (FFmpeg over the broadcast
HLS), uploads it to Vercel Blob, and records the URL in
`demo_fixtures/<game_id>/reels.json`. `GET /api/reel/{game_id}/{brand}`
redirects to it, and 404s until a reel has been built.

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... \
    uv run python -m pre_processing.build_reels
# then commit the updated demo_fixtures/<game_id>/reels.json
```

Requires FFmpeg on `PATH` (v8.0.1 verified).

### Script reference

| Script | Command | Description |
|--------|---------|-------------|
| `pre_processing/ingest_assets.py` | `python -m pre_processing.ingest_assets` | Create the knowledge store; attach + index assets |
| `pre_processing/capture_demo_cache.py` | `python -m pre_processing.capture_demo_cache` | Regenerate `demo_fixtures/` (discover / analyze / legibility) |
| `pre_processing/build_reels.py` | `python -m pre_processing.build_reels` | Build highlight reels → Vercel Blob |

Tuning knobs for each are documented in the module docstrings and
`backend/.env.example`.

## Build & deploy

The frontend builds into `backend/webapp/`, which FastAPI serves at `/`:

```bash
cd frontend && npm install && npm run build
```

Deploys to **Vercel** as a single Python function (`api/index.py` re-exports the
FastAPI app; `vercel.json` routes all requests to it and bundles the backend).

```bash
vercel --prod
```

Set the environment variables below in the Vercel project.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `TWELVELABS_API_KEY` | for Demo mode + offline scripts | Your TwelveLabs key. Used by `ingest_assets.py` / `capture_demo_cache.py` / `build_reels.py`, and — when set on a deployed server — by the locked Demo tab. Leave it unset to ship "Use your own key" mode only. |
| `SPONSOR_SPOTLIGHT_STORE_ID` | optional | Knowledge-store id the demo is pinned to. Defaults to the bundled PL Classics collection. |
| `SPONSOR_SPOTLIGHT_STORE_NAME` | optional | Display name for the demo collection. |
| `SPONSOR_SPOTLIGHT_SPORT` | optional | Sport profile for the demo collection (default `soccer`). |
| `SPONSOR_SPOTLIGHT_DEMO_BRANDS` | optional | Comma-separated canonical brands the demo tab pre-bakes + auto-runs (default `Etihad,Emirates`). Must match the captured `demo_fixtures/`. |

> **Deploying:** setting `TWELVELABS_API_KEY` on a public deployment means every
> visitor's Demo-tab request spends that key. The demo is served from committed
> fixtures so this is cheap today, but see the live-run notes before changing that.

## Notes

- **Rate limit.** Jockey's private beta allows ~2 requests/minute. Discovery is
  one call; analysis is capped at two brands (two calls). The backend retries
  `429`/`5xx` with backoff that honors the rate-limit reset time.
- **Design system.** `frontend/src/tlds` is a vendored copy of the TwelveLabs
  React component library. To switch to the published package, install
  `@twelvelabs-io/react`, delete `frontend/src/tlds`, and remove the two alias
  entries in `vite.config.ts` / `tsconfig.json`.

## Project structure

```
sponsor-spotlight/
├── api/index.py            # Vercel entrypoint (re-exports the FastAPI app)
├── vercel.json             # single-function routing + bundling
├── requirements.txt        # Vercel Python deps
├── backend/
│   ├── main.py             # app factory — start here
│   ├── jockey.py           # TwelveLabs Jockey API client (retry/backoff)
│   ├── core/
│   │   ├── config.py       # every env var the app reads
│   │   └── deps.py         # key resolution + demo-mode pinning
│   ├── domain/sponsor/
│   │   ├── schemas.py      # ← the JSON schemas sent to /responses
│   │   ├── prompts.py      # ← the prompts, incl. {{sel:N}} game scoping
│   │   └── models.py       # request models
│   ├── services/           # one module per pass: discover, analyze,
│   │                       #   legibility, compare, query + stores,
│   │                       #   scoping, demo, reporting
│   ├── routes/             # thin HTTP layer
│   ├── sports.py           # per-sport prompt/enrichment profiles
│   ├── games.py            # curated demo-game registry
│   ├── pre_processing/     # offline pipeline — never runs on Vercel
│   │   ├── ingest_assets.py       # Step 0 — create store, index assets
│   │   ├── capture_demo_cache.py  # Step 1 — regenerate demo fixtures
│   │   └── build_reels.py         # Step 2 — highlight reels → Vercel Blob
│   ├── demo_fixtures/      # committed pre-baked results
│   ├── .env.example        # every env var, documented
│   └── webapp/             # built frontend (served at /)
└── frontend/
    ├── src/                # React app (App, state, components, lib)
    └── src/tlds/           # vendored TwelveLabs design system
```

**Reading the Jockey integration.** `domain/sponsor/schemas.py` and
`domain/sponsor/prompts.py` are the whole contract with the API — what we ask
for and the shape we ask it back in. Everything in `services/` and `routes/` is
plumbing around those two files.
