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
served from pre-baked fixtures in `backend/demo_fixtures/` for the canonical
brand pair (`SPONSOR_SPOTLIGHT_DEMO_BRANDS`, default **Etihad, Emirates**), so
the tab renders the full flow in milliseconds instead of minutes. The frontend
pre-seeds those brands and auto-runs the flow on demo entry. A **Run live**
button on each step (and any non-canonical brand selection) bypasses the cache
with `?live=1`; "Use your own key" mode never touches the cache.

Regenerate the fixtures whenever the demo collection or brand pair changes:

```bash
cd backend
SPONSOR_SPOTLIGHT_TL_KEY=tlk_... uv run python capture_demo_cache.py
# commit the updated backend/demo_fixtures/*.json
```

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
