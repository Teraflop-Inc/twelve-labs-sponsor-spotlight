# Sponsor Spotlight — frontend

React + Vite + TypeScript + Tailwind v4, built on the **TwelveLabs design
system** (TLDS 2.0). The FastAPI backend in `../backend` is a pure JSON API.

## Design system

The genuine `@twelvelabs-io/react` source is **vendored** under `src/tlds/`
(tokens, theme, components, icons) and aliased to `@twelvelabs-io/react` in
`vite.config.ts` + `tsconfig.json`. No GitHub Packages auth needed. To switch to
the published package later: `npm i @twelvelabs-io/react`, delete `src/tlds`, and
remove the two alias entries.

## Develop

```bash
# terminal 1 — backend (JSON API on :8001)
cd ../backend && uv run uvicorn main:app --port 8001

# terminal 2 — frontend (Vite on :5173, proxies /api → :8001)
npm install
npm run dev
```

## Build & deploy

```bash
npm run build      # → ../backend/webapp  (committed; Vercel ships it)
```

In production FastAPI serves the built app at `/` (`backend/main.py`), assets at
`/assets/*`, and the legacy single-file UI at `/legacy`. `vercel.json` routes all
requests to the Python function and `includeFiles: backend/**` bundles the build,
so one Vercel project ships both — no separate frontend build step.

## Layout

```
src/
  App.tsx              composition + header
  state.tsx            AppProvider: key, store, videos, session, econ, polling
  lib/{api,types,econ} typed API client · shared types · economics engine
  ui.tsx               SectionCard, ContextChip, MetricTile, ScoreBar, MomentRow
  components/          ApiKeyPanel, FootagePanel, EconomicsPanel, InventoryPanel,
                       ComparePanel, LegibilityPanel, Player (lazy hls.js), Timeline
  tlds/                vendored TwelveLabs design system
```
