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
export interface DemoInfo {
  enabled: boolean
  store_id: string
  name: string
  sport: string
  /** Canonical brands the demo tab pre-bakes; pre-seeded + auto-run on entry. */
  demo_brands?: string[]
  /** True when every demo step is pre-baked, so the demo flow renders instantly. */
  cached?: boolean
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

/** Active knowledge store, held client-side (the server is stateless). */
export interface ActiveStore {
  id: string
  sport?: string
}
