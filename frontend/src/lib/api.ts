import type {
  DemoInfo,
  DemoScope,
  AddAssetsResponse,
  AnalyzeResponse,
  CompareResponse,
  CreateStoreResponse,
  DiscoverResponse,
  LegibilityResponse,
  SportsResponse,
  StoresResponse,
  UseStoreResponse,
} from "./types"

const KEY_LS = "tl_api_key" // user's TwelveLabs key (this browser only)

export function getKey(): string {
  return (localStorage.getItem(KEY_LS) || "").trim()
}
export function setKey(k: string) {
  localStorage.setItem(KEY_LS, k.trim())
}
export function clearKey() {
  localStorage.removeItem(KEY_LS)
}
export function hasKey(): boolean {
  return getKey().length > 0
}

// Demo mode: requests carry `x-demo` and the backend uses its own
// SPONSOR_SPOTLIGHT_TL_KEY, pinned to the demo collection. No user key sent.
let _demoMode = false
export function setDemoMode(on: boolean) {
  _demoMode = on
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

interface ReqOpts {
  method?: string
  body?: unknown
  /** GET /api/sports + /api/health don't require the key header. */
  noKey?: boolean
}

async function request<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = "GET", body, noKey = false } = opts
  const headers: Record<string, string> = {}
  if (!noKey) {
    if (_demoMode) headers["x-demo"] = "1"
    else headers["x-api-key"] = getKey()
  }
  if (body != null) headers["Content-Type"] = "application/json"

  const res = await fetch(path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = await res.json()
      detail = j.detail || j.message || detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }
  // 204 / empty body tolerance
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

/** Store context merged into every analysis request body. */
export interface StoreCtx {
  store_id: string
  sport?: string
  videos: string[]
  /** Optional per-game scope (games.GAMES id). Omit for the whole collection. */
  game_id?: string
}

/** POST that returns raw text (not JSON) — used for the HTML report. */
async function requestText(path: string, body: unknown): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (_demoMode) headers["x-demo"] = "1"
  else headers["x-api-key"] = getKey()
  const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) })
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail || detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }
  return res.text()
}

export interface ReportArgs {
  brand: string
  game_ids: string[]
  media_values?: Record<string, number>
  total_media_value?: number
  generated_note?: string
}

export const api = {
  sports: () => request<SportsResponse>("/api/sports", { noKey: true }),

  demoInfo: () => request<DemoInfo>("/api/demo/info", { noKey: true }),

  // Explore payload for one scope (game id or "all") — all cached brands, no run.
  demoScope: (game_id: string) =>
    request<DemoScope>(`/api/demo/scope/${encodeURIComponent(game_id)}`, { noKey: true }),

  listStores: () => request<StoresResponse>("/api/knowledge-stores"),

  createStore: (name: string, sport?: string) =>
    request<CreateStoreResponse>("/api/knowledge-stores/create", {
      method: "POST",
      body: { name, sport },
    }),

  useStore: (store_id: string) =>
    request<UseStoreResponse>("/api/use-knowledge-store", {
      method: "POST",
      body: { store_id },
    }),

  addAssets: (store_id: string, asset_ids: string[]) =>
    request<AddAssetsResponse>("/api/knowledge-stores/add-assets", {
      method: "POST",
      body: { store_id, asset_ids },
    }),

  // `live` forces a fresh Jockey run in demo mode, bypassing the pre-baked cache.
  discover: (ctx: StoreCtx, session_id: string | null, live = false) =>
    request<DiscoverResponse>(`/api/jockey/discover${live ? "?live=1" : ""}`, {
      method: "POST",
      body: { ...ctx, session_id },
    }),

  analyze: (ctx: StoreCtx, brands: string[], session_id: string | null, live = false) =>
    request<AnalyzeResponse>(`/api/jockey/analyze${live ? "?live=1" : ""}`, {
      method: "POST",
      body: { ...ctx, brands, session_id },
    }),

  compare: (
    ctx: StoreCtx,
    brands: string[],
    session_id: string | null,
    max_top_moments = 5,
  ) =>
    request<CompareResponse>("/api/jockey/compare", {
      method: "POST",
      body: { ...ctx, brands, session_id, max_top_moments },
    }),

  legibility: (ctx: StoreCtx, brands: string[], session_id: string | null, live = false) =>
    request<LegibilityResponse>(`/api/jockey/legibility${live ? "?live=1" : ""}`, {
      method: "POST",
      body: { ...ctx, brands, session_id },
    }),

  // Templated performance report — returns standalone HTML (print-to-PDF).
  report: (args: ReportArgs) => requestText("/api/report", args),

  // Highlight reel — public redirect to the Blob URL; safe to open in a new tab.
  reelUrl: (game_id: string, brand: string) =>
    `/api/reel/${encodeURIComponent(game_id)}/${encodeURIComponent(brand)}`,
}
