// Client-side data export (F4). All raw metrics come from the analyze/legibility
// results already rendered in the browser; economics come from econ.ts. We merge
// them at download time into CSV/JSON — the file matches the on-screen numbers
// exactly, and nothing is posted to the server (locked decision 2026-07-01).

import type { Brand, LegibilityReport, Moment } from "./types"
import { brandValue, unionWeightedSeconds, type EconState } from "./econ"

const OUTSIDE_W2W = new Set(["pregame", "halftime", "postgame", "timeout"])

export interface ExportRow {
  brand: string
  game: string
  impressions: number
  duration_seconds: number
  moments: number
  outside_whistle_to_whistle_seconds: number
  avg_legibility: number | null
  cpm: number
  weighted_media_value: number
}

/** Mean 0–10 legibility across a brand's audited assets, or null if none. */
export function avgLegibility(report: LegibilityReport | null, brand: string): number | null {
  const b = report?.brands.find((x) => x.name.trim().toLowerCase() === brand.trim().toLowerCase())
  const scores = (b?.assets || [])
    .map((a) => Number(a.overall_score))
    .filter((n) => Number.isFinite(n))
  if (!scores.length) return null
  return Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10
}

function sumOutsideW2W(moments: Moment[]): number {
  return moments
    .filter((m) => OUTSIDE_W2W.has(String(m.context)))
    .reduce((s, m) => s + Math.max(0, (Number(m.end_sec) || 0) - (Number(m.start_sec) || 0)), 0)
}

function row(
  brand: Brand,
  game: string,
  moments: Moment[],
  econ: EconState,
  leg: number | null,
  opts: { aggregate?: boolean } = {},
): ExportRow {
  // Aggregate uses the brand's headline value (matches the on-screen $); per-game
  // rebuilds a scoped pseudo-brand from just that game's appearances.
  const scoped: Brand = opts.aggregate
    ? brand
    : { name: brand.name, appearances: moments, total_seconds: unionWeightedSeconds(moments, econ.weights).unionSecs }
  const wmv = brandValue(scoped, econ)
  const duration = opts.aggregate
    ? brand.total_seconds || unionWeightedSeconds(moments, econ.weights).unionSecs
    : unionWeightedSeconds(moments, econ.weights).unionSecs
  const outside = opts.aggregate
    ? brand.outside_whistle_to_whistle_seconds ?? sumOutsideW2W(moments)
    : sumOutsideW2W(moments)
  return {
    brand: brand.name,
    game,
    // Gross impressions implied by the media value: value = impressions/1000 × CPM.
    impressions: econ.cpm > 0 ? Math.round((wmv / econ.cpm) * 1000) : 0,
    duration_seconds: Math.round(duration * 10) / 10,
    moments: opts.aggregate ? brand.moments_count ?? moments.length : moments.length,
    outside_whistle_to_whistle_seconds: Math.round(outside * 10) / 10,
    avg_legibility: leg,
    cpm: econ.cpm,
    weighted_media_value: Math.round(wmv),
  }
}

/**
 * Build export rows: one per (brand × game) grouped by the appearance `video`
 * field, plus an aggregate "All games" total row per brand.
 */
export function buildExportRows(
  brands: Brand[],
  legibility: LegibilityReport | null,
  econ: EconState,
): ExportRow[] {
  const rows: ExportRow[] = []
  for (const b of brands) {
    const apps = b.appearances || b.top_moments || []
    const leg = avgLegibility(legibility, b.name)
    // Per-game rows, grouped by source video.
    const byGame = new Map<string, Moment[]>()
    for (const m of apps) {
      const g = m.video || "unknown"
      const list = byGame.get(g) || []
      list.push(m)
      byGame.set(g, list)
    }
    for (const [game, moments] of [...byGame.entries()].sort()) {
      rows.push(row(b, game, moments, econ, leg))
    }
    // Aggregate total row.
    rows.push(row(b, "All games", apps, econ, leg, { aggregate: true }))
  }
  return rows
}

const COLUMNS: (keyof ExportRow)[] = [
  "brand",
  "game",
  "impressions",
  "duration_seconds",
  "moments",
  "outside_whistle_to_whistle_seconds",
  "avg_legibility",
  "cpm",
  "weighted_media_value",
]

function csvCell(v: unknown): string {
  if (v == null) return ""
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(rows: ExportRow[]): string {
  const header = COLUMNS.join(",")
  const body = rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))
  return [header, ...body].join("\n") + "\n"
}

export function toJSON(rows: ExportRow[]): string {
  return JSON.stringify(rows, null, 2)
}

/** Trigger a client-side file download of `content`. */
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

export function exportData(
  brands: Brand[],
  legibility: LegibilityReport | null,
  econ: EconState,
  format: "csv" | "json",
  scopeLabel = "all-games",
) {
  const rows = buildExportRows(brands, legibility, econ)
  const stamp = scopeLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
  if (format === "csv") {
    download(`sponsor-spotlight-${stamp}.csv`, toCSV(rows), "text/csv;charset=utf-8")
  } else {
    download(`sponsor-spotlight-${stamp}.json`, toJSON(rows), "application/json")
  }
}
