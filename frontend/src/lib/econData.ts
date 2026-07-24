// Economics data layer (Tom's "Economics Section Rebuild" PRD).
//
// The resolver's raw material: synthetic fallbacks + customer-upload parsers for
// the two data sources the EMV formula needs — a minute-by-minute audience curve
// and a media rate card. Every value carries a `DataSource` tag so the UI, the
// export, and the API can label it Detected / Customer-Uploaded / Simulated.
//
//   "Synthetic data is a placeholder, not a lie." — every simulated number says so.

import type { Moment } from "./types"

// --- source tagging ----------------------------------------------------------

export type DataSource = "detected" | "customer_upload" | "simulated"

export const SOURCE_LABEL: Record<DataSource, string> = {
  detected: "Detected",
  customer_upload: "Customer-Uploaded",
  simulated: "Simulated",
}

// --- audience model (minute-by-minute average-minute-audience, in millions) ---

export interface AudiencePoint {
  minute: number
  ama: number // millions
}

export interface AudienceModel {
  points: AudiencePoint[]
  source: DataSource
  mean: number
  peak: number
  peakMinute: number
}

function summarize(points: AudiencePoint[], source: DataSource): AudienceModel {
  const valid = points.filter((p) => Number.isFinite(p.ama) && p.ama >= 0)
  if (!valid.length) return { points: [], source, mean: 0, peak: 0, peakMinute: 0 }
  let peak = -Infinity
  let peakMinute = 0
  let sum = 0
  for (const p of valid) {
    sum += p.ama
    if (p.ama > peak) {
      peak = p.ama
      peakMinute = p.minute
    }
  }
  return { points: valid, source, mean: sum / valid.length, peak, peakMinute }
}

/** AMA (millions) at a broadcast minute — nearest committed point, clamped. */
export function amaAtMinute(model: AudienceModel, minute: number): number {
  if (!model.points.length) return 0
  let best = model.points[0]
  let bestDist = Math.abs(best.minute - minute)
  for (const p of model.points) {
    const d = Math.abs(p.minute - minute)
    if (d < bestDist) {
      best = p
      bestDist = d
    }
  }
  return best.ama
}

/**
 * Fallback #1 — synthetic audience curve. Shape per the PRD: ramp up → dip →
 * recover → halftime spike → decay, with a localized spike on Jockey goal /
 * celebration minutes. Deterministic (no RNG) so the demo is stable.
 */
export function syntheticAudienceCurve(
  durationMin: number,
  goalMinutes: number[],
): AudienceModel {
  const D = Math.max(90, Math.min(140, Math.round(durationMin) || 110))
  const goals = new Set(goalMinutes.map((m) => Math.round(m)))
  const points: AudiencePoint[] = []
  for (let m = 0; m <= D; m++) {
    const f = m / D
    // Base shape in [0.45 .. 1.0] across the broadcast.
    let s: number
    if (f < 0.1)
      s = 0.55 + (f / 0.1) * 0.35 // ramp up 0.55 → 0.90
    else if (f < 0.4)
      s = 0.9 - ((f - 0.1) / 0.3) * 0.15 // settle/dip 0.90 → 0.75
    else if (f < 0.5)
      s = 0.75 + ((f - 0.4) / 0.1) * 0.2 // recover into halftime 0.75 → 0.95
    else if (f < 0.55)
      s = 1.0 + Math.sin(((f - 0.5) / 0.05) * Math.PI) * 0.1 // halftime-return spike
    else if (f < 0.9)
      s = 0.95 + ((f - 0.55) / 0.35) * 0.3 // second-half rise 0.95 → 1.25 (climax)
    else s = 1.25 - ((f - 0.9) / 0.1) * 0.45 // final-whistle decay 1.25 → 0.80

    let ama = 2.2 + 9.0 * Math.max(0, s) // ~2.2M .. ~13.5M
    // Goal / celebration bump: sharp local spike (±1 min falloff).
    for (const g of goals) {
      const d = Math.abs(m - g)
      if (d <= 2) ama += 2.6 * (1 - d / 3)
    }
    points.push({ minute: m, ama: Math.round(ama * 100) / 100 })
  }
  return summarize(points, "simulated")
}

/** Build an AudienceModel from parsed customer-upload points. */
export function audienceModelFromUpload(points: AudiencePoint[]): AudienceModel {
  return summarize(
    [...points].sort((a, b) => a.minute - b.minute),
    "customer_upload",
  )
}

// --- media rate card ($ per :30 spot, by network + daypart) -------------------

export interface RateCardRow {
  network: string
  daypart: string
  tier?: string
  ratePer30: number
}

export interface RateCard {
  rows: RateCardRow[]
  source: DataSource
}

/** Which network / daypart aired each broadcast — drives the rate-card lookup. */
export interface Broadcast {
  network: string
  daypart: string
  tier: string
}

export const DEFAULT_BROADCAST: Broadcast = {
  network: "NBC Sports",
  daypart: "Weekend Marquee",
  tier: "National",
}

// PL marquee fixtures air weekend national in the US (NBC Sports / Peacock).
export const GAME_BROADCAST: Record<string, Broadcast> = {
  "mci-liv-2019": { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National" },
  "mci-tot-2023": { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National" },
  "ars-tot-2018": { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National" },
  "liv-mun-2025": { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National" },
  "tot-che-2024": { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National" },
}

export function broadcastFor(gameId: string | null | undefined): Broadcast {
  if (!gameId) return DEFAULT_BROADCAST
  return GAME_BROADCAST[gameId] ?? DEFAULT_BROADCAST
}

// Fallback #2 — synthetic rate card (PRD Appendix B). Placeholder spot rates,
// NOT verified real rates; sold as flat :30 spot rate, never CPM.
export const SYNTHETIC_RATE_CARD: RateCard = {
  source: "simulated",
  rows: [
    { network: "ESPN+", daypart: "Weekend Marquee", tier: "National", ratePer30: 42000 },
    { network: "ESPN+", daypart: "Weekday", tier: "National", ratePer30: 24000 },
    { network: "Fox Sports 1", daypart: "Weekend Marquee", tier: "National", ratePer30: 38000 },
    { network: "NBC Sports", daypart: "Weekend Marquee", tier: "National", ratePer30: 45000 },
    { network: "Regional Sports Net", daypart: "Weekend Marquee", tier: "Regional", ratePer30: 12000 },
    { network: "Streaming Exclusive (App)", daypart: "Weekday", tier: "National", ratePer30: 11000 },
  ],
}

/**
 * Resolve the $/:30 spot rate for a broadcast against a rate card. A card match
 * keeps the card's source; if the specific network/daypart isn't in a customer
 * upload, we fall back to the synthetic row and tag THAT number `simulated`
 * (per-number tagging — a customer file doesn't make every rate real).
 */
export function resolveRate(
  card: RateCard,
  b: Broadcast,
): { value: number; source: DataSource } {
  const match = (rows: RateCardRow[]) =>
    rows.find(
      (r) =>
        r.network.trim().toLowerCase() === b.network.toLowerCase() &&
        r.daypart.trim().toLowerCase() === b.daypart.toLowerCase(),
    ) ||
    rows.find((r) => r.network.trim().toLowerCase() === b.network.toLowerCase())

  const hit = match(card.rows)
  if (hit) return { value: hit.ratePer30, source: card.source }
  // No row for this broadcast in the (customer) card → synthetic fallback.
  const syn = match(SYNTHETIC_RATE_CARD.rows) ?? SYNTHETIC_RATE_CARD.rows[3]
  return { value: syn.ratePer30, source: "simulated" }
}

// --- broadcast duration + goal minutes from the run --------------------------

/** Longest exposure end (minutes) in the scope — sizes the synthetic curve. */
export function scopeDurationMin(appearances: Moment[]): number {
  let maxEnd = 0
  for (const m of appearances) {
    const e = Number(m.end_sec) || 0
    if (e > maxEnd) maxEnd = e
  }
  return maxEnd > 0 ? maxEnd / 60 : 110
}

const GOAL_CTX = new Set(["score", "goal", "celebration"])

/** Broadcast minutes with a scoring / celebration moment — audience spikes. */
export function goalMinutes(appearances: Moment[]): number[] {
  const mins: number[] = []
  for (const m of appearances) {
    if (GOAL_CTX.has(String(m.context))) mins.push((Number(m.start_sec) || 0) / 60)
  }
  return mins
}

// --- CSV parsers (client-side; bad file → error, never crash) -----------------

/** Minimal CSV line splitter that respects double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += c
    } else if (c === '"') q = true
    else if (c === ",") {
      out.push(cur)
      cur = ""
    } else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function headerIndex(header: string[], ...names: string[]): number {
  const lower = header.map((h) => h.toLowerCase().replace(/\s+/g, "_"))
  for (const n of names) {
    const i = lower.indexOf(n)
    if (i >= 0) return i
  }
  return -1
}

export interface ParseResult<T> {
  rows: T[]
  error?: string
}

/** PRD Appendix A — Nielsen/Comscore audience file: minute, ama_millions. */
export function parseAudienceCSV(text: string): ParseResult<AudiencePoint> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length < 2) return { rows: [], error: "File is empty or has no data rows." }
  const header = splitCsvLine(lines[0])
  const iMin = headerIndex(header, "minute", "min")
  const iAma = headerIndex(header, "ama_millions", "ama", "audience", "ama_m")
  if (iMin < 0 || iAma < 0)
    return {
      rows: [],
      error: 'Missing required columns. Need "minute" and "ama_millions".',
    }
  const rows: AudiencePoint[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const minute = Number(cells[iMin])
    const ama = Number(cells[iAma])
    if (Number.isFinite(minute) && Number.isFinite(ama)) rows.push({ minute, ama })
  }
  if (!rows.length) return { rows: [], error: "No valid (minute, ama_millions) rows found." }
  return { rows }
}

/** PRD Appendix B — media rate card: network, daypart, [tier,] rate_per_30sec. */
export function parseRateCardCSV(text: string): ParseResult<RateCardRow> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length < 2) return { rows: [], error: "File is empty or has no data rows." }
  const header = splitCsvLine(lines[0])
  const iNet = headerIndex(header, "network")
  const iDay = headerIndex(header, "daypart")
  const iTier = headerIndex(header, "tier")
  const iRate = headerIndex(header, "rate_per_30sec", "rate_per_30", "rate", "rate_per_30_sec")
  if (iNet < 0 || iDay < 0 || iRate < 0)
    return {
      rows: [],
      error: 'Missing required columns. Need "network", "daypart", "rate_per_30sec".',
    }
  const rows: RateCardRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const rate = Number(cells[iRate])
    if (cells[iNet] && cells[iDay] && Number.isFinite(rate) && rate > 0)
      rows.push({
        network: cells[iNet],
        daypart: cells[iDay],
        tier: iTier >= 0 ? cells[iTier] || undefined : undefined,
        ratePer30: rate,
      })
  }
  if (!rows.length) return { rows: [], error: "No valid rate rows found." }
  return { rows }
}

/** True for an .xlsx/.xls filename — we accept CSV only, and say so gracefully. */
export function isSpreadsheetBinary(filename: string): boolean {
  return /\.xlsx?$/i.test(filename)
}
