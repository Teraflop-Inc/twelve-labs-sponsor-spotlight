<h1 align="center">Sponsor Spotlight</h1>

<p align="center">
  Turn broadcast footage into a defensible sponsorship valuation —
  every result produced by <b>TwelveLabs Jockey</b> over a knowledge store.
</p>

Sponsorship is still valued the way it was twenty years ago: analysts hand-log
logo-seconds, or a panel estimates them. That misses at three points — **scale**
(nobody watches every minute of every broadcast), **legibility** (a logo on
screen is not a logo *seen* — contrast, size and motion blur decide that), and
**provenance** (a number in a renewal deck with no audit trail behind it).

Sponsor Spotlight closes all three with a single reasoning interface. Point it
at indexed footage and it discovers every sponsor present, times every
appearance, scores how legibly each mark renders, and turns that into media
value you can trace back to a timestamp.

---

## Features

**Brand discovery** — one Jockey call enumerates every sponsor visible anywhere
in the footage, including small, partial and briefly-visible marks. No watchlist
to maintain; you find out who's actually there.

**Timed exposure analysis** — per-brand appearances with start/end seconds,
surface (perimeter LED, shirt-front, backdrop, broadcast overlay…), framing,
match period and on-screen game clock read from the scorebug.

**Legibility audit** — each brand asset scored 0–10 on contrast, size, position,
camera angle and motion blur, with timestamped examples of where a mark failed
and concrete creative fixes. This is the step that separates "on screen" from
"seen".

**Match-event context** — dedicated passes find every goal, celebration and
replay, then stamp them onto overlapping sponsor moments. Exposure during a goal
is worth more than exposure during a throw-in, and the weighting reflects that.

**Media value with provenance** — EMV from seconds × legibility × clutter ×
audience-at-minute × rate, with every input tagged Detected / Customer-Uploaded /
Simulated so a placeholder is never mistaken for a measurement.

**Highlight reels** — a ~60s cut of a brand's top moments per game, built offline
with FFmpeg over the broadcast HLS and served from Vercel Blob.

**Export and reporting** — CSV/JSON per game plus aggregate totals, and a
printable performance report whose figures match the screen exactly.

---

## Who this is for

- **Rights-holders** proving delivered value at renewal, with an audit trail.
- **Agencies** comparing a brand's exposure across properties on one basis.
- **Brands** finding out which placements actually render legibly on air.
- **Developers** building on Jockey — this repo is a worked example of
  multi-pass structured extraction over video (see [the tutorial](#tutorial)).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Video intelligence | **TwelveLabs Jockey 1.0** (`/responses`) over a knowledge store |
| Backend | Python 3.11, FastAPI, httpx |
| Frontend | React 19, TypeScript, Vite, Tailwind v4, `hls.js` |
| Design system | TwelveLabs design system (vendored, `frontend/src/tlds`) |
| Media | FFmpeg (reels), Vercel Blob (hosting) |
| Deploy | Vercel — one Python function |

Jockey is the *only* model interface used. There is no separate search index, no
embedding store, and no bespoke CV — every result on screen comes from a
schema-constrained `/responses` call.

---

## The five-step flow

| Step | Section | What happens |
|------|---------|--------------|
| 1 | **Footage** | Select the broadcast collection and game (locked when `DEMO_MODE=True`). |
| 2 | **Economic assumptions** | Editable CPM, reach, audience mix, and per-context weights — every $ figure recomputes live. |
| 3 | **Brand discovery** | One Jockey call lists every sponsor in the footage; pick up to two to analyze. |
| 4 | **Analyze brands** | Deep-analyzes the selected brands and ranks them by weighted media value, with a seekable exposure timeline per brand. |
| 5 | **Legibility audit** | Per-asset visibility scores (contrast, size, position, camera angle, motion blur) with timestamped examples. |

A sticky video player plays the broadcast inline; clicking any moment seeks to it.

## Two modes — `DEMO_MODE`

Both run on the server's `TWELVELABS_API_KEY`, which is never exposed to the
browser. The flag controls what the app *lets you do*, not whose key it uses.

- **`DEMO_MODE=True`** (default) — the sales demo. Pinned to one preloaded
  collection with a fixed game roster; the collection picker is hidden and the
  collection-management endpoints return `403`. Results come from committed
  fixtures, so the whole flow renders in milliseconds.
- **`DEMO_MODE=False`** — the working app. Every knowledge store in the account
  is listed and selectable, you can create collections and attach assets, and
  each game in the loaded store can be analyzed. Results are computed live
  (~45s–3min per call).

Selecting a collection other than the demo one automatically bypasses the
fixtures — they record the store they were captured from and no longer match —
so you always get real analysis of your own footage.

### Demo caching (instant first impression)

With `DEMO_MODE=True` the three Jockey steps (discover, analyze, legibility) are
served from pre-baked JSON fixtures, so the app renders the full flow in
milliseconds instead of minutes. Three things bypass the cache and force a real
run: `?live=1` (the **Re-run analysis** button), a brand absent from the fixture,
and a request for any collection other than the one the fixtures were captured
from.

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
    │  fetch /api/*   (x-demo → server key)
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
- **Backend** — FastAPI. Stateless: the active collection is held in the browser
  and sent with each request. The TwelveLabs key stays server-side and is never
  sent to the browser; the backend persists nothing.

### Offline vs. runtime

The split exists because a Jockey `/responses` call takes ~45s–3min and the beta
is rate-limited to ~2 req/min — a live demo cannot call it on the demo path.

```
OFFLINE (local, minutes-hours)          RUNTIME (Vercel, milliseconds)
────────────────────────────────        ──────────────────────────────
ingest_assets      → knowledge store
capture_demo_cache → demo_fixtures/ ──▶ Demo tab reads committed JSON
build_reels        → Vercel Blob    ──▶ /api/reel redirects
                                        BYO-key mode calls Jockey live
```

---

## API reference

Base URL is the deployment root. Analysis endpoints require `x-demo: 1`, which
tells the backend to use its own `TWELVELABS_API_KEY`. (`x-api-key: <key>` is
also accepted so the API can be driven with a caller-supplied key, but the UI
never sends one.)

The collection-management endpoints (`/knowledge-stores`, `/knowledge-stores/create`)
return `403` while `DEMO_MODE=True`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/sports` | Sport profiles available for new collections |
| `GET` | `/api/demo/info` | Whether demo mode is on, its collection, games, cache state |
| `GET` | `/api/demo/scope/{game_id}` | All pre-baked data for one scope (fixtures only, no key) |
| `GET` | `/api/knowledge-stores` | List the account's collections |
| `POST` | `/api/knowledge-stores/create` | Create a collection with sport-aware enrichment |
| `POST` | `/api/use-knowledge-store` | Load a collection: sport + video roster |
| `POST` | `/api/jockey/discover` | **Pass 1** — every sponsor brand present (no timestamps) |
| `POST` | `/api/jockey/analyze` | **Pass 2** — timed appearances per brand |
| `POST` | `/api/jockey/legibility` | **Pass 3** — contrast/size/position/angle/blur audit |
| `POST` | `/api/jockey/compare` | Two-brand head-to-head with a winner + rationale |
| `POST` | `/api/jockey/query` | Free-form question, optionally schema-constrained |
| `POST` | `/api/report` | Printable performance report (HTML) |
| `GET` | `/api/reel/{game_id}/{brand}` | Redirect to a pre-built highlight reel |

Add `?live=1` to `discover` / `analyze` / `legibility` to bypass the demo
fixtures and force a real Jockey call.

Interactive docs are at `/docs` (FastAPI generates them from the route
signatures).

<a name="tutorial"></a>
### Reading the Jockey integration

`backend/domain/sponsor/schemas.py` and `backend/domain/sponsor/prompts.py` are
the entire contract with the API — the JSON schemas that force computable output,
and the prompts that ask for it (including the `selections` / `{{sel:N}}` trick
that scopes a call to one broadcast in a multi-game store). Everything in
`services/` and `routes/` is plumbing around those two files.

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

Open the Vite URL. `TWELVELABS_API_KEY` is required — the app has no in-browser
key entry. Add `DEMO_MODE=False` to unlock collection and game selection.

`backend/.env` is only one way to supply it. Exported variables take precedence
over the file, so any of these work equally well:

```bash
source ../set-env.sh                              # if you keep keys in a shell script
export TWELVELABS_API_KEY=tlk_...                 # or export it directly
TWELVELABS_API_KEY=tlk_... uv run uvicorn main:app --port 8001   # or inline
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

Edit `ASSETS` in `pre_processing/ingest_assets.py` to point at your own footage;
assets must already exist in your TwelveLabs account.

Then register those games for the app — no code edit needed:

```bash
# backend/games.json (or the SPONSOR_SPOTLIGHT_GAMES env var)
[
  {"id": "wk1", "asset_id": "6a2...", "label": "Week 1 — Team A v Team B"},
  {"id": "wk2", "asset_id": "6a2...", "label": "Week 2 — Team C v Team D"}
]
```

Keep `id` short and URL-safe — it becomes the fixture directory name and appears
in `/api/reel/{game_id}/…`.

### Bringing your own footage

Set `TWELVELABS_API_KEY`, `SPONSOR_SPOTLIGHT_STORE_ID` and the roster above, and
the app runs entirely on your collection. The committed fixtures record the
store they were captured from, so they stop matching and every request runs live
against your footage rather than replaying our Premier League results — expect
Jockey latency (~45s–3min per call) instead of the instant cached demo. Run
Step 1 below to bake your own fixtures and get the instant path back.

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
| `TWELVELABS_API_KEY` | **yes** | Your TwelveLabs key. Used by the offline scripts and by the running app for every Jockey call. Without it the app cannot analyze anything — there is no in-browser key entry. |
| `DEMO_MODE` | optional | `True` (default) locks the app to one collection and serves committed fixtures. `False` lists every collection in the account, allows creating collections and attaching assets, and analyzes live. |
| `SPONSOR_SPOTLIGHT_STORE_ID` | optional | Knowledge-store id the demo is pinned to. Defaults to the bundled PL Classics collection. |
| `SPONSOR_SPOTLIGHT_STORE_NAME` | optional | Display name for the demo collection. |
| `SPONSOR_SPOTLIGHT_SPORT` | optional | Sport profile for the demo collection (default `soccer`). |
| `SPONSOR_SPOTLIGHT_DEMO_BRANDS` | optional | Comma-separated canonical brands the demo tab pre-bakes + auto-runs (default `Etihad,Emirates`). Must match the captured `demo_fixtures/`. |
| `SPONSOR_SPOTLIGHT_GAMES` | optional | JSON array replacing the per-game roster: `[{"id":"wk1","asset_id":"6a2…","label":"Week 1"}]`. A `backend/games.json` file of the same shape works too; the env var wins. Malformed values are ignored with a warning and the bundled roster is used. |

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
