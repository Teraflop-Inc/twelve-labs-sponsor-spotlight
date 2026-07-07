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

- **Demo** — uses a server-side key (`SPONSOR_SPOTLIGHT_TL_KEY`) pinned to one
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

**Regenerating fixtures.** Runs the real discover → analyze → legibility flow per
game (scoped) + aggregate. Resumable (existing files are skipped) and
rate-limited (~2 req/min):

```bash
cd backend
SPONSOR_SPOTLIGHT_TL_KEY=tlk_... uv run python capture_demo_cache.py
# knobs: SPONSOR_SPOTLIGHT_CAPTURE_BRANDS=A,B  CAPTURE_GAMES=aggregate,mci-liv-2019
#        CAPTURE_TOP_N=8  CAPTURE_DELAY=30  CAPTURE_FORCE=1
# then commit backend/demo_fixtures/<scope>/*.json
```

**Highlight reels** (`POST`-free, offline → Vercel Blob). Builds a ~30s MP4 of a
brand's top moments per game (FFmpeg `-c copy` over the broadcast HLS), uploads
to Vercel Blob, and records the URL in `demo_fixtures/<game_id>/reels.json`.
`GET /api/reel/{game_id}/{brand}` redirects to it (404 until built):

```bash
cd backend
SPONSOR_SPOTLIGHT_TL_KEY=tlk_... BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... \
    uv run python build_reels.py
# commit the updated demo_fixtures/<game_id>/reels.json
```

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
uv run uvicorn main:app --port 8001

# 2. Frontend — Vite dev server on :5173, proxies /api → :8001
cd ../frontend
npm install
npm run dev
```

Open the Vite URL. To enable the **Demo** tab, start the backend with a key:

```bash
SPONSOR_SPOTLIGHT_TL_KEY=tlk_... uv run uvicorn main:app --port 8001
```

Without it, use the **"Use your own key"** tab and paste a key in the UI.

> Jockey (`jockey1.0`) is in private beta and requires an allowlisted API key.

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
| `SPONSOR_SPOTLIGHT_TL_KEY` | for Demo mode | Server-side TwelveLabs key used by the locked demo tab. If unset, only "Use your own key" is available. |
| `SPONSOR_SPOTLIGHT_STORE_ID` | optional | Knowledge-store id the demo is pinned to. Defaults to the bundled PL Classics collection. |
| `SPONSOR_SPOTLIGHT_STORE_NAME` | optional | Display name for the demo collection. |
| `SPONSOR_SPOTLIGHT_SPORT` | optional | Sport profile for the demo collection (default `soccer`). |
| `SPONSOR_SPOTLIGHT_DEMO_BRANDS` | optional | Comma-separated canonical brands the demo tab pre-bakes + auto-runs (default `Etihad,Emirates`). Must match the captured `demo_fixtures/`. |
| `TWELVELABS_API_KEY` | CLI only | Used only by `backend/ingest_assets.py` for offline ingestion. **Not** used by the web app — there is no server-key fallback for browser requests, so a stray value can never become a shared key. |

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
├── api/index.py          # Vercel entrypoint (re-exports the FastAPI app)
├── vercel.json           # single-function routing + bundling
├── requirements.txt      # Vercel Python deps
├── backend/
│   ├── main.py           # FastAPI app: endpoints, schemas, demo mode
│   ├── jockey.py         # TwelveLabs Jockey API client (retry/backoff)
│   ├── sports.py         # per-sport prompt/enrichment profiles
│   ├── ingest_assets.py  # offline ingestion CLI
│   └── webapp/           # built frontend (served at /)
└── frontend/
    ├── src/              # React app (App, state, components, lib)
    └── src/tlds/         # vendored TwelveLabs design system
```
