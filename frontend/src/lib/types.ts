// Mirrors the FastAPI JSON contracts (backend/main.py). Kept deliberately
// permissive on optional fields — Jockey's structured output is best-effort and
// the UI must render partial objects gracefully.

export type Context =
  | "score"
  | "celebration"
  | "replay"
  | "close_up"
  | "wide_shot"
  | "pregame"
  | "halftime"
  | "postgame"
  | "timeout"
  | "commercial"
  | "other"

export type AssetType =
  | "courtside_led"
  | "jersey_patch"
  | "scorers_table"
  | "backboard"
  | "floor_decal"
  | "broadcast_overlay"
  | "interview_backdrop"
  | "commercial"
  | "other"

/** A single sponsor exposure. Shared shape across appearances + top_moments. */
export interface Moment {
  start_sec: number
  end_sec: number
  context?: Context | string
  asset_type?: AssetType | string
  description?: string
  confidence?: number
  suggested_weight?: number
  /** Source video filename, so we can attribute + seek the right asset. */
  video?: string
  /** primary = large/sharp/foreground exposure; secondary = small/background. */
  placement?: "primary" | "secondary" | string
  /** Match period read from the scorebug (first half / second half / stoppage / …). */
  period?: string
  /** Match clock as shown on the scorebug, e.g. "23:31" or "01:07:34". */
  game_clock?: string
}

export interface SportProfile {
  key: string
  label: string
}

export interface StoreSummary {
  id: string
  name: string
  item_count: number
}

export interface Video {
  asset_id: string
  item_id?: string
  video_filename: string
  hls_url: string | null
  thumbnail_url: string | null
  status: string
  error?: string
}

export interface Brand {
  name: string
  total_seconds?: number
  moments_count?: number
  outside_whistle_to_whistle_seconds?: number
  asset_types?: string[]
  appearances?: Moment[]
  /** Present on head-to-head comparison brands instead of `appearances`. */
  top_moments?: Moment[]
  legibility_notes?: string
}

export interface DiscoveryBrand {
  name: string
  asset_types?: string[]
}

export interface Discovery {
  brands: DiscoveryBrand[]
  summary?: string
}

export interface Inventory {
  brands: Brand[]
  summary?: string
}

export interface Comparison {
  brands: Brand[]
  winner?: string
  rationale?: string
}

export interface LegibilityExample {
  start_sec: number
  end_sec: number
  note?: string
  video?: string
}

export interface LegibilityAsset {
  asset_type: string
  overall_score: number
  contrast?: number
  size?: number
  position?: number
  camera_angle?: number
  motion_blur?: number
  issues?: string
  suggestions?: string
  examples?: LegibilityExample[]
}

export interface LegibilityBrand {
  name: string
  assets: LegibilityAsset[]
  summary?: string
}

export interface LegibilityReport {
  brands: LegibilityBrand[]
}

// --- Response envelopes -----------------------------------------------------

export interface SportsResponse {
  sports: SportProfile[]
  default: string
}
/** A selectable game in the per-game scope selector. */
export interface GameOption {
  id: string
  label: string
}
export interface DemoInfo {
  enabled: boolean
  store_id: string
  name: string
  sport: string
  /** Canonical brands the demo tab pre-bakes; pre-seeded + auto-run on entry. */
  demo_brands?: string[]
  /** True when the aggregate ("All games") demo is pre-baked → instant flow. */
  cached?: boolean
  /** The 5 curated games for the per-game selector. */
  games?: GameOption[]
  /** Which game ids have a complete per-game fixture set. */
  cached_games?: string[]
}
export interface StoresResponse {
  stores: StoreSummary[]
}
export interface CreateStoreResponse {
  id: string
  name: string
  sport: string
}
export interface UseStoreResponse {
  store_id: string
  sport: string
  videos: Video[]
}
export interface AddAssetsResponse {
  store_id: string
  added: { asset_id: string; item_id?: string; status: string; error?: string }[]
}
export interface DiscoverResponse {
  session_id: string | null
  discovery: Discovery
  answer?: string
  timings?: { discover_secs?: number }
}
export interface AnalyzeResponse {
  session_id: string | null
  inventory: Inventory
  timings?: { analyze_secs?: number; requested?: number; succeeded?: number }
}
export interface CompareResponse {
  session_id: string | null
  comparison: Comparison | null
  answer?: string
}
export interface LegibilityResponse {
  session_id: string | null
  report: LegibilityReport | null
  answer?: string
}

/** A built highlight reel's metadata (Vercel Blob URL). */
export interface ReelInfo {
  url: string
  duration_sec?: number
  clips?: number
}

/** All pre-baked data for one demo scope — the explore payload (no run). */
export interface DemoScope {
  game_id: string
  label: string
  /** Every brand detected in the scope (name + asset_types). */
  discovery: DiscoveryBrand[]
  /** The analyzed ("run") brands, with full appearance data. */
  inventory: Brand[]
  legibility: LegibilityReport | null
  /** brand(lowercased) → reel metadata, for brands with a built reel. */
  reels: Record<string, ReelInfo>
}

/** Active knowledge store, held client-side (the server is stateless). */
export interface ActiveStore {
  id: string
  sport?: string
}
