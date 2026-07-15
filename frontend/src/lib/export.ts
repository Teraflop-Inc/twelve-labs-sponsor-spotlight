// Client-side data export (F4). Exports the FULL data returned from the Jockey
// runs — not a rolled-up summary. Everything is already in the browser (the
// analyze appearances + the legibility assets); economics come from econ.ts. We
// merge them at download time; nothing is posted to the server.
//
//  • CSV  = one row per detected appearance (moment-level, every field) with the
//           brand-level rollups + economics carried on each row for easy pivoting.
//  • JSON = the complete nested payload per brand: all appearances, all
//           legibility assets (with dimension scores + examples), economics, plus
//           the full detected-brand list.
//
// Scope-based: the currently selected game (or "All games").

import type { Brand, LegibilityBrand, LegibilityReport, Moment } from "./types"
import {
  audienceMultiplier,
  brandValue,
  formatGameTime,
  unionWeightedSeconds,
  type EconState,
} from "./econ"

const OUTSIDE_W2W = new Set(["pregame", "halftime", "postgame", "timeout"])

/** Mean 0–10 legibility across a brand's audited assets, or null if none. */
export function avgLegibility(report: LegibilityReport | null, brand: string): number | null {
  const b = report?.brands.find((x) => x.name.trim().toLowerCase() === brand.trim().toLowerCase())
  const scores = (b?.assets || [])
    .map((a) => Number(a.overall_score))
    .filter((n) => Number.isFinite(n))
  if (!scores.length) return null
  return Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10
}

function legBrand(report: LegibilityReport | null, brand: string): LegibilityBrand | undefined {
  return report?.brands.find((x) => x.name.trim().toLowerCase() === brand.trim().toLowerCase())
}

function sumOutsideW2W(moments: Moment[]): number {
  return moments
    .filter((m) => OUTSIDE_W2W.has(String(m.context)))
    .reduce((s, m) => s + Math.max(0, (Number(m.end_sec) || 0) - (Number(m.start_sec) || 0)), 0)
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null)

// --- CSV: one row per appearance (the full moment-level detail) ----------------

export interface AppearanceRow {
  brand: string
  game: string
  // brand-level rollups + economics, repeated on each appearance row
  weighted_media_value: number
  impressions: number
  avg_legibility: number | null
  cpm: number
  reach_millions: number
  audience_multiplier: number
  brand_total_seconds: number
  brand_moments: number
  brand_outside_w2w_seconds: number
  // the appearance itself
  start_sec: number | null
  end_sec: number | null
  duration_sec: number | null
  period: string
  game_clock: string
  game_time: string
  context: string
  context_weight: number
  asset_type: string
  placement: string
  confidence: number | null
  description: string
  video: string
}

const APPEARANCE_COLUMNS: (keyof AppearanceRow)[] = [
  "brand",
  "game",
  "weighted_media_value",
  "impressions",
  "avg_legibility",
  "cpm",
  "reach_millions",
  "audience_multiplier",
  "brand_total_seconds",
  "brand_moments",
  "brand_outside_w2w_seconds",
  "start_sec",
  "end_sec",
  "duration_sec",
  "period",
  "game_clock",
  "game_time",
  "context",
  "context_weight",
  "asset_type",
  "placement",
  "confidence",
  "description",
  "video",
]

export function buildAppearanceRows(
  brands: Brand[],
  legibility: LegibilityReport | null,
  econ: EconState,
  gameLabel: string,
): AppearanceRow[] {
  const rows: AppearanceRow[] = []
  const audMult = Math.round(audienceMultiplier(econ) * 1000) / 1000
  for (const b of brands) {
    const apps = b.appearances || b.top_moments || []
    const wmv = brandValue(b, econ)
    const leg = avgLegibility(legibility, b.name)
    const base = {
      brand: b.name,
      game: gameLabel,
      weighted_media_value: Math.round(wmv),
      impressions: econ.cpm > 0 ? Math.round((wmv / econ.cpm) * 1000) : 0,
      avg_legibility: leg,
      cpm: econ.cpm,
      reach_millions: econ.reach,
      audience_multiplier: audMult,
      brand_total_seconds:
        Math.round((b.total_seconds || unionWeightedSeconds(apps, econ.weights).unionSecs) * 10) / 10,
      brand_moments: b.moments_count ?? apps.length,
      brand_outside_w2w_seconds:
        Math.round((b.outside_whistle_to_whistle_seconds ?? sumOutsideW2W(apps)) * 10) / 10,
    }
    if (apps.length === 0) {
      rows.push({
        ...base,
        start_sec: null,
        end_sec: null,
        duration_sec: null,
        period: "",
        game_clock: "",
        game_time: "",
        context: "",
        context_weight: 0,
        asset_type: "",
        placement: "",
        confidence: null,
        description: "",
        video: "",
      })
      continue
    }
    for (const m of apps) {
      const s = num(m.start_sec)
      const e = num(m.end_sec)
      const ctx = String(m.context ?? "")
      rows.push({
        ...base,
        start_sec: s,
        end_sec: e,
        duration_sec: s != null && e != null ? Math.round((e - s) * 10) / 10 : null,
        period: String(m.period ?? ""),
        game_clock: String(m.game_clock ?? ""),
        game_time: formatGameTime(m.period, m.game_clock),
        context: ctx,
        context_weight: econ.weights[ctx] ?? econ.weights.other ?? 1,
        asset_type: String(m.asset_type ?? ""),
        placement: String(m.placement ?? ""),
        confidence: num(m.confidence),
        description: String(m.description ?? ""),
        video: String(m.video ?? ""),
      })
    }
  }
  return rows
}

function csvCell(v: unknown): string {
  if (v == null) return ""
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(rows: AppearanceRow[]): string {
  const header = APPEARANCE_COLUMNS.join(",")
  const body = rows.map((r) => APPEARANCE_COLUMNS.map((c) => csvCell(r[c])).join(","))
  return [header, ...body].join("\n") + "\n"
}

// --- JSON: complete nested payload per brand -----------------------------------

export function buildFullExport(
  brands: Brand[],
  legibility: LegibilityReport | null,
  econ: EconState,
  gameLabel: string,
  detected: string[] = [],
) {
  return {
    scope: gameLabel,
    // The economic assumptions that produced every weighted_media_value below.
    assumptions: {
      cpm: econ.cpm,
      reach_millions: econ.reach,
      audience_premium_pct: econ.audPremium,
      audience_regional_pct: econ.audRegional,
      audience_streaming_pct: econ.audStreaming,
      audience_multiplier: Math.round(audienceMultiplier(econ) * 1000) / 1000,
      context_weights: econ.weights,
    },
    detected_brands: detected,
    brands: brands.map((b) => {
      const apps = b.appearances || b.top_moments || []
      const wmv = brandValue(b, econ)
      const lb = legBrand(legibility, b.name)
      return {
        brand: b.name,
        game: gameLabel,
        economics: {
          cpm: econ.cpm,
          weighted_media_value: Math.round(wmv),
          impressions: econ.cpm > 0 ? Math.round((wmv / econ.cpm) * 1000) : 0,
        },
        total_seconds: b.total_seconds ?? null,
        moments_count: b.moments_count ?? apps.length,
        outside_whistle_to_whistle_seconds: b.outside_whistle_to_whistle_seconds ?? null,
        asset_types: b.asset_types ?? [],
        legibility_notes: b.legibility_notes ?? null,
        avg_legibility: avgLegibility(legibility, b.name),
        // Raw Jockey outputs, verbatim — every field the run returned.
        appearances: apps,
        legibility_summary: lb?.summary ?? null,
        legibility_assets: lb?.assets ?? [],
      }
    }),
  }
}

// --- download ------------------------------------------------------------------

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slug(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "")
}

// --- Nielsen-format CSV --------------------------------------------------------
// Matches the shape of the CSVs the customer already gets from Nielsen: Value,
// Impressions, Exposures, Duration, Share of Voice — broken down by both partner
// (brand) and asset (placement/asset_type), so it drops into their workflow.

export interface NielsenRow {
  partner: string
  asset: string
  value: number
  impressions: number
  exposures: number
  duration_seconds: number
  share_of_voice_pct: number
}

const NIELSEN_HEADERS = [
  "Partner",
  "Asset",
  "Value",
  "Impressions",
  "Exposures",
  "Duration",
  "Share of Voice",
]

export function buildNielsenRows(brands: Brand[], econ: EconState): NielsenRow[] {
  const rows: NielsenRow[] = []
  for (const b of brands) {
    const apps = b.appearances || b.top_moments || []
    const byAsset = new Map<string, Moment[]>()
    for (const m of apps) {
      const a = String(m.asset_type || "other")
      const list = byAsset.get(a) || []
      list.push(m)
      byAsset.set(a, list)
    }
    for (const [asset, moments] of byAsset) {
      // Per-partner×asset value from a pseudo-brand of just that asset's moments.
      const value = brandValue({ name: b.name, appearances: moments }, econ)
      const dur = unionWeightedSeconds(moments, econ.weights).unionSecs
      rows.push({
        partner: b.name,
        asset,
        value: Math.round(value),
        impressions: econ.cpm > 0 ? Math.round((value / econ.cpm) * 1000) : 0,
        exposures: moments.length,
        duration_seconds: Math.round(dur * 10) / 10,
        share_of_voice_pct: 0, // filled below
      })
    }
  }
  const total = rows.reduce((s, r) => s + r.value, 0) || 1
  for (const r of rows) r.share_of_voice_pct = Math.round((r.value / total) * 1000) / 10
  return rows.sort((a, b) => b.value - a.value)
}

export function toNielsenCSV(rows: NielsenRow[]): string {
  const body = rows.map((r) =>
    [
      r.partner,
      r.asset,
      r.value,
      r.impressions,
      r.exposures,
      r.duration_seconds,
      r.share_of_voice_pct,
    ]
      .map(csvCell)
      .join(","),
  )
  return [NIELSEN_HEADERS.join(","), ...body].join("\n") + "\n"
}

export function exportNielsen(brands: Brand[], econ: EconState, gameLabel: string) {
  const rows = buildNielsenRows(brands, econ)
  download(
    `sponsor-spotlight-${slug(gameLabel) || "export"}-nielsen.csv`,
    toNielsenCSV(rows),
    "text/csv;charset=utf-8",
  )
}

export function exportData(
  brands: Brand[],
  legibility: LegibilityReport | null,
  econ: EconState,
  format: "csv" | "json",
  gameLabel: string,
  detected: string[] = [],
) {
  const name = `sponsor-spotlight-${slug(gameLabel) || "export"}`
  if (format === "csv") {
    const rows = buildAppearanceRows(brands, legibility, econ, gameLabel)
    download(`${name}.csv`, toCSV(rows), "text/csv;charset=utf-8")
  } else {
    const full = buildFullExport(brands, legibility, econ, gameLabel, detected)
    download(`${name}.json`, JSON.stringify(full, null, 2), "application/json")
  }
}
