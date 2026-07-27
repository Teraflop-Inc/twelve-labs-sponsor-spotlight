// Client-side data export (F4), reworked for the economics rebuild. Exports the
// FULL data from the Jockey runs (appearances + legibility) merged with the
// resolved economics (EMV / ROI / Share-of-Voice / Clean-Exposure) at download
// time — nothing is posted to the server, so the file matches the on-screen
// numbers exactly.
//
// PRD step 10: every economics field carries a `source` (Detected /
// Customer-Uploaded / Simulated), so a simulated placeholder is never mistaken
// for a measured value downstream.
//
//  • CSV  = one row per detected appearance (moment-level) with brand rollups +
//           economics + source tags carried on each row.
//  • JSON = the complete nested payload per brand, plus the resolved assumptions
//           (rate card + audience) with their sources.

import type { Brand, LegibilityBrand, LegibilityReport, Moment } from "./types"
import {
  brandEconomics,
  formatGameTime,
  legibility01,
  resolveEcon,
  shareOfVoice,
  unionWeightedSeconds,
  type EconState,
} from "./econ"
import { SOURCE_LABEL } from "./econData"
import { momentEvents, momentView, primaryTag } from "./moments"

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
    .filter((m) => momentEvents(m).some((e) => OUTSIDE_W2W.has(e)))
    .reduce((s, m) => s + Math.max(0, (Number(m.end_sec) || 0) - (Number(m.start_sec) || 0)), 0)
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null)

/** Resolve the scope economics + a per-brand SoV lookup, computed once. */
function scopeContext(
  brands: Brand[],
  econ: EconState,
  gameId: string | null,
  legibility: LegibilityReport | null,
) {
  const apps: Moment[] = []
  for (const b of brands) apps.push(...(b.appearances || b.top_moments || []))
  const resolved = resolveEcon(econ, gameId, apps)
  const emv = brands.map((b) => brandEconomics(b, resolved, legibility01(legibility, b.name)).emv)
  const sovByIndex = shareOfVoice(emv)
  const sovByBrand = new Map<string, number>()
  brands.forEach((b, i) => sovByBrand.set(b.name, sovByIndex[i]))
  return { resolved, sovByBrand }
}

// --- CSV: one row per appearance (the full moment-level detail) ----------------

export interface AppearanceRow {
  brand: string
  game: string
  // brand-level economics, repeated on each appearance row
  emv: number
  roi: number | null
  share_of_voice_pct: number
  clean_exposure_pct: number | null
  impressions: number
  avg_legibility: number | null
  rate_per_30: number
  rate_source: string
  audience_source: string
  rights_fee: number
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
  /** Highest-value tag, kept for CSV back-compat with the old single column. */
  context: string
  /** Camera framing (single). */
  view: string
  /** Match events (0..n), ";"-joined. */
  events: string
  asset_type: string
  placement: string
  confidence: number | null
  description: string
  video: string
}

const APPEARANCE_COLUMNS: (keyof AppearanceRow)[] = [
  "brand",
  "game",
  "emv",
  "roi",
  "share_of_voice_pct",
  "clean_exposure_pct",
  "impressions",
  "avg_legibility",
  "rate_per_30",
  "rate_source",
  "audience_source",
  "rights_fee",
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
  "view",
  "events",
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
  gameId: string | null,
): AppearanceRow[] {
  const rows: AppearanceRow[] = []
  const { resolved, sovByBrand } = scopeContext(brands, econ, gameId, legibility)
  for (const b of brands) {
    const apps = b.appearances || b.top_moments || []
    const ec = brandEconomics(b, resolved, legibility01(legibility, b.name))
    const leg = avgLegibility(legibility, b.name)
    const base = {
      brand: b.name,
      game: gameLabel,
      emv: Math.round(ec.emv),
      roi: ec.roi == null ? null : Math.round(ec.roi * 100) / 100,
      share_of_voice_pct: sovByBrand.get(b.name) ?? 0,
      clean_exposure_pct: ec.cleanExposurePct == null ? null : Math.round(ec.cleanExposurePct),
      impressions: ec.impressions,
      avg_legibility: leg,
      rate_per_30: resolved.rate.value,
      rate_source: SOURCE_LABEL[resolved.rate.source],
      audience_source: SOURCE_LABEL[resolved.audience.source],
      rights_fee: resolved.rightsFee,
      brand_total_seconds:
        Math.round((b.total_seconds || unionWeightedSeconds(apps).unionSecs) * 10) / 10,
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
        view: "",
        events: "",
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
      rows.push({
        ...base,
        start_sec: s,
        end_sec: e,
        duration_sec: s != null && e != null ? Math.round((e - s) * 10) / 10 : null,
        period: String(m.period ?? ""),
        game_clock: String(m.game_clock ?? ""),
        game_time: formatGameTime(m.period, m.game_clock),
        context: primaryTag(m),
        view: momentView(m) ?? "",
        events: momentEvents(m).join(";"),
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
  gameId: string | null,
  detected: string[] = [],
) {
  const { resolved, sovByBrand } = scopeContext(brands, econ, gameId, legibility)
  return {
    scope: gameLabel,
    // The resolved economic inputs that produced every EMV below, with sources.
    assumptions: {
      rights_fee: { value: resolved.rightsFee, source: SOURCE_LABEL[resolved.rightsFeeSource] },
      rate_card: {
        rate_per_30sec: resolved.rate.value,
        network: resolved.rate.broadcast.network,
        daypart: resolved.rate.broadcast.daypart,
        source: SOURCE_LABEL[resolved.rate.source],
      },
      audience: {
        peak_ama_millions: Math.round(resolved.audience.peak * 100) / 100,
        mean_ama_millions: Math.round(resolved.audience.mean * 100) / 100,
        peak_minute: resolved.audience.peakMinute,
        source: SOURCE_LABEL[resolved.audience.source],
      },
      emv_formula: "seconds × legibility × clutter × audience-at-that-moment × rate",
    },
    detected_brands: detected,
    brands: brands.map((b) => {
      const apps = b.appearances || b.top_moments || []
      const ec = brandEconomics(b, resolved, legibility01(legibility, b.name))
      const lb = legBrand(legibility, b.name)
      return {
        brand: b.name,
        game: gameLabel,
        economics: {
          emv: Math.round(ec.emv),
          roi: ec.roi == null ? null : Math.round(ec.roi * 100) / 100,
          share_of_voice_pct: sovByBrand.get(b.name) ?? 0,
          clean_exposure_pct: ec.cleanExposurePct == null ? null : Math.round(ec.cleanExposurePct),
          impressions: ec.impressions,
          rate_per_30sec: resolved.rate.value,
          sources: {
            rate: SOURCE_LABEL[resolved.rate.source],
            audience: SOURCE_LABEL[resolved.audience.source],
            rights_fee: SOURCE_LABEL[resolved.rightsFeeSource],
          },
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
// Impressions, Exposures, Duration, Share of Voice — broken down by partner
// (brand) × asset — plus source columns so simulated vs uploaded is explicit.

export interface NielsenRow {
  partner: string
  asset: string
  value: number
  impressions: number
  exposures: number
  duration_seconds: number
  share_of_voice_pct: number
  value_source: string
  audience_source: string
}

const NIELSEN_HEADERS = [
  "Partner",
  "Asset",
  "Value",
  "Impressions",
  "Exposures",
  "Duration",
  "Share of Voice",
  "Value Source",
  "Audience Source",
]

export function buildNielsenRows(
  brands: Brand[],
  econ: EconState,
  gameId: string | null,
  legibility: LegibilityReport | null,
): NielsenRow[] {
  const { resolved } = scopeContext(brands, econ, gameId, legibility)
  const rows: NielsenRow[] = []
  for (const b of brands) {
    const apps = b.appearances || b.top_moments || []
    const leg = legibility01(legibility, b.name)
    const byAsset = new Map<string, Moment[]>()
    for (const m of apps) {
      const a = String(m.asset_type || "other")
      const list = byAsset.get(a) || []
      list.push(m)
      byAsset.set(a, list)
    }
    for (const [asset, moments] of byAsset) {
      const ec = brandEconomics({ name: b.name, appearances: moments }, resolved, leg)
      rows.push({
        partner: b.name,
        asset,
        value: Math.round(ec.emv),
        impressions: ec.impressions,
        exposures: moments.length,
        duration_seconds: Math.round(unionWeightedSeconds(moments).unionSecs * 10) / 10,
        share_of_voice_pct: 0, // filled below
        value_source: SOURCE_LABEL[resolved.rate.source],
        audience_source: SOURCE_LABEL[resolved.audience.source],
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
      r.value_source,
      r.audience_source,
    ]
      .map(csvCell)
      .join(","),
  )
  return [NIELSEN_HEADERS.join(","), ...body].join("\n") + "\n"
}

export function exportNielsen(
  brands: Brand[],
  econ: EconState,
  gameLabel: string,
  gameId: string | null,
  legibility: LegibilityReport | null,
) {
  const rows = buildNielsenRows(brands, econ, gameId, legibility)
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
  gameId: string | null,
  detected: string[] = [],
) {
  const name = `sponsor-spotlight-${slug(gameLabel) || "export"}`
  if (format === "csv") {
    const rows = buildAppearanceRows(brands, legibility, econ, gameLabel, gameId)
    download(`${name}.csv`, toCSV(rows), "text/csv;charset=utf-8")
  } else {
    const full = buildFullExport(brands, legibility, econ, gameLabel, gameId, detected)
    download(`${name}.json`, JSON.stringify(full, null, 2), "application/json")
  }
}
