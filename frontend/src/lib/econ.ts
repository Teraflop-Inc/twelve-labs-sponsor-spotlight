// Economics — rebuilt per Tom's "Economics Section Rebuild" PRD.
//
// The old model (manual CPM, reach slider, audience sliders, streaming
// multiplier, editable context-weight table) is gone. Economics now runs off a
// resolver: for each broadcast we use CUSTOMER-UPLOADED data if present, else
// SYNTHETIC data — and every number is tagged with its source. The only manual
// number is the rights fee (that one is *supposed* to be a manual input).
//
// EMV formula (never changes; only its data source does):
//     seconds × legibility × clutter × audience-at-that-moment × rate
//
// All of this stays in the browser (the backend does no economics), so the
// on-screen numbers, the export, and the report always agree.

import type { Brand, LegibilityReport, Moment } from "./types"
import {
  amaAtMinute,
  audienceModelFromUpload,
  broadcastFor,
  goalMinutes,
  resolveRate,
  scopeDurationMin,
  syntheticAudienceCurve,
  SYNTHETIC_RATE_CARD,
  type AudienceModel,
  type AudiencePoint,
  type Broadcast,
  type DataSource,
  type RateCard,
  type RateCardRow,
} from "./econData"

// Internal context multipliers — used to RANK moments ("top plays", reel/report
// selection), NOT to compute the EMV dollar figure (the PRD dropped context
// weighting from value in favour of audience-at-that-moment). No longer editable.
export const CONTEXT_WEIGHTS: Record<string, number> = {
  score: 3,
  goal: 3,
  celebration: 2.5,
  replay: 2,
  close_up: 1.5,
  wide_shot: 1,
  pregame: 1.2,
  halftime: 1.2,
  postgame: 1.0,
  timeout: 1.0,
  commercial: 0.5,
  other: 1,
}

// --- state (what the user can actually set / upload) -------------------------

export interface EconState {
  /** The one number that's supposed to be manual (PRD: "rights fee field stays"). */
  rightsFee: number
  /** Customer-uploaded audience curve (Nielsen/Comscore), or null → synthetic. */
  audienceUpload: AudiencePoint[] | null
  audienceUploadName: string | null
  /** Customer-uploaded media rate card, or null → synthetic. */
  rateCardUpload: RateCardRow[] | null
  rateCardUploadName: string | null
}

export const DEFAULT_ECON: EconState = {
  rightsFee: 2_000_000,
  audienceUpload: null,
  audienceUploadName: null,
  rateCardUpload: null,
  rateCardUploadName: null,
}

const ECON_LS_KEY = "sponsor-spotlight-econ-v3"

export function loadEcon(): EconState {
  try {
    const saved = JSON.parse(localStorage.getItem(ECON_LS_KEY) || "null")
    if (!saved) return { ...DEFAULT_ECON }
    return {
      rightsFee: num(saved.rightsFee, DEFAULT_ECON.rightsFee),
      audienceUpload: Array.isArray(saved.audienceUpload) ? saved.audienceUpload : null,
      audienceUploadName: saved.audienceUploadName ?? null,
      rateCardUpload: Array.isArray(saved.rateCardUpload) ? saved.rateCardUpload : null,
      rateCardUploadName: saved.rateCardUploadName ?? null,
    }
  } catch {
    return { ...DEFAULT_ECON }
  }
}

export function saveEcon(e: EconState) {
  try {
    localStorage.setItem(ECON_LS_KEY, JSON.stringify(e))
  } catch {
    /* private mode / quota — non-fatal */
  }
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v))
  return isFinite(n) ? n : fallback
}

// --- the resolver ("traffic cop") --------------------------------------------

export interface ResolvedEcon {
  audience: AudienceModel
  rate: { value: number; source: DataSource; broadcast: Broadcast; row: RateCardRow }
  /** The rate card actually consulted (customer upload or synthetic) — for UI preview. */
  card: RateCard
  rightsFee: number
  /** Rights fee is a manual customer input → labelled Customer-Uploaded. */
  rightsFeeSource: DataSource
}

/**
 * Resolve the economics inputs for one scope: audience curve + spot rate, each
 * tagged with its true source. Customer upload wins; otherwise synthetic.
 * `appearances` = every moment in the scope (used to size + spike the synthetic
 * curve, and to pick the broadcast for the rate lookup).
 */
export function resolveEcon(
  econ: EconState,
  gameId: string | null,
  appearances: Moment[],
): ResolvedEcon {
  const broadcast = broadcastFor(gameId)

  const card: RateCard = econ.rateCardUpload
    ? { rows: econ.rateCardUpload, source: "customer_upload" }
    : SYNTHETIC_RATE_CARD
  const rate = resolveRate(card, broadcast)

  const audience: AudienceModel = econ.audienceUpload
    ? audienceModelFromUpload(econ.audienceUpload)
    : syntheticAudienceCurve(scopeDurationMin(appearances), goalMinutes(appearances))

  return {
    audience,
    rate: { ...rate, broadcast },
    card,
    rightsFee: econ.rightsFee,
    rightsFeeSource: "customer_upload",
  }
}

// --- interval merge (simultaneous exposures = one eyeball-second) -------------

export interface MergedInterval {
  start: number
  end: number
  /** True only when EVERY constituent is a secondary/background placement. */
  secondary: boolean
}

export function mergeIntervals(moments: Moment[]): MergedInterval[] {
  const norm = moments
    .map((m) => ({
      s: Number(m.start_sec) || 0,
      e: Number(m.end_sec) || 0,
      secondary: String(m.placement) === "secondary",
    }))
    .filter((m) => m.e > m.s)
    .sort((a, b) => a.s - b.s)
  if (!norm.length) return []

  const out: MergedInterval[] = []
  let curS = norm[0].s
  let curE = norm[0].e
  let curSecondary = norm[0].secondary
  for (let i = 1; i < norm.length; i++) {
    const m = norm[i]
    if (m.s <= curE) {
      curE = Math.max(curE, m.e)
      curSecondary = curSecondary && m.secondary // primary wins
    } else {
      out.push({ start: curS, end: curE, secondary: curSecondary })
      curS = m.s
      curE = m.e
      curSecondary = m.secondary
    }
  }
  out.push({ start: curS, end: curE, secondary: curSecondary })
  return out
}

/** Union (de-overlapped) exposure seconds for a set of moments. */
export function unionSeconds(moments: Moment[]): number {
  return mergeIntervals(moments).reduce((s, iv) => s + (iv.end - iv.start), 0)
}

/**
 * Back-compat: union seconds + context-weighted seconds. Kept for the export's
 * duration rollups; context weights here rank/roll-up, they don't set EMV.
 */
export function unionWeightedSeconds(
  moments: Moment[],
  weights: Record<string, number> = CONTEXT_WEIGHTS,
): { unionSecs: number; weightedSecs: number } {
  const merged = moments
    .map((m) => ({
      s: Number(m.start_sec) || 0,
      e: Number(m.end_sec) || 0,
      w: weights[m.context ?? "other"] ?? 1,
    }))
    .filter((m) => m.e > m.s)
    .sort((a, b) => a.s - b.s)
  if (!merged.length) return { unionSecs: 0, weightedSecs: 0 }
  let unionSecs = 0
  let weightedSecs = 0
  let curS = merged[0].s
  let curE = merged[0].e
  let curW = merged[0].w
  for (let i = 1; i < merged.length; i++) {
    const m = merged[i]
    if (m.s <= curE) {
      curE = Math.max(curE, m.e)
      curW = Math.max(curW, m.w)
    } else {
      unionSecs += curE - curS
      weightedSecs += (curE - curS) * curW
      curS = m.s
      curE = m.e
      curW = m.w
    }
  }
  unionSecs += curE - curS
  weightedSecs += (curE - curS) * curW
  return { unionSecs, weightedSecs }
}

// --- EMV + derived figures ---------------------------------------------------

const DEFAULT_LEGIBILITY_01 = 0.7 // neutral when no legibility audit exists

/** Legibility factor 0–1 for a brand from the legibility report (avg/10). */
export function legibility01(report: LegibilityReport | null, brand: string): number {
  const b = report?.brands.find(
    (x) => x.name.trim().toLowerCase() === brand.trim().toLowerCase(),
  )
  const scores = (b?.assets || [])
    .map((a) => Number(a.overall_score))
    .filter((n) => Number.isFinite(n))
  if (!scores.length) return DEFAULT_LEGIBILITY_01
  const mean = scores.reduce((s, n) => s + n, 0) / scores.length
  return Math.max(0.05, Math.min(1, mean / 10))
}

/**
 * EMV for a brand: Σ over merged exposure intervals of
 *     (seconds / 30) × rate × audienceFactor × legibility × clutter
 * where audienceFactor = AMA-at-that-minute ÷ mean AMA (mean → 1.0), and
 * clutter discounts background/secondary placements. If Jockey reported more
 * total seconds than the sampled moments cover, the remainder is extrapolated
 * at the sampled average.
 */
export function brandEMV(b: Brand, r: ResolvedEcon, leg01: number): number {
  const moments = b.appearances || b.top_moments || []
  const merged = mergeIntervals(moments)
  if (!merged.length) {
    // Only a rollup total, no timed moments → value at mean audience.
    const total = b.total_seconds || 0
    return (total / 30) * r.rate.value * 1 * leg01 * 1
  }
  let emv = 0
  let sampledSecs = 0
  for (const iv of merged) {
    const secs = iv.end - iv.start
    sampledSecs += secs
    const minute = Math.floor(iv.start / 60)
    const ama = amaAtMinute(r.audience, minute)
    const audienceFactor = r.audience.mean > 0 ? ama / r.audience.mean : 1
    const clutter = iv.secondary ? 0.6 : 1.0
    emv += (secs / 30) * r.rate.value * audienceFactor * leg01 * clutter
  }
  // Extrapolate to Jockey's fuller total_seconds when it exceeds the sample.
  const total = b.total_seconds || 0
  if (sampledSecs > 0 && total > sampledSecs) emv *= total / sampledSecs
  return emv
}

export interface BrandEconomics {
  emv: number
  roi: number | null // EMV ÷ rights fee
  cleanExposurePct: number | null // in-play (whistle-to-whistle) share of exposure
  impressions: number // gross audience-seconds impressions
}

/** Full economics for one brand (EMV, ROI, Clean Exposure %, impressions). */
export function brandEconomics(b: Brand, r: ResolvedEcon, leg01: number): BrandEconomics {
  const emv = brandEMV(b, r, leg01)
  const roi = r.rightsFee > 0 ? emv / r.rightsFee : null

  const total = b.total_seconds || 0
  const outside = b.outside_whistle_to_whistle_seconds || 0
  const cleanExposurePct = total > 0 ? Math.max(0, Math.min(100, ((total - outside) / total) * 100)) : null

  // Gross impressions = Σ over merged intervals (viewers present × 1 exposure).
  const merged = mergeIntervals(b.appearances || b.top_moments || [])
  let impressions = 0
  for (const iv of merged) {
    const minute = Math.floor(iv.start / 60)
    impressions += amaAtMinute(r.audience, minute) * 1_000_000
  }

  return { emv, roi, cleanExposurePct, impressions: Math.round(impressions) }
}

/** Share-of-voice %: a brand's EMV as a fraction of the scope's total EMV. */
export function shareOfVoice(emvByBrand: number[]): number[] {
  const total = emvByBrand.reduce((s, v) => s + v, 0) || 1
  return emvByBrand.map((v) => Math.round((v / total) * 1000) / 10)
}

// --- formatting --------------------------------------------------------------

export function fmtTime(sec: number | null | undefined): string {
  if (sec == null) return "—"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—"
  if (Math.abs(n) >= 1000) return "$" + Math.round(n).toLocaleString()
  return "$" + n.toFixed(0)
}

/** Parse a scorebug clock ("23:31" or "01:07:34") to whole match minutes. */
function clockMinutes(clock?: string): number | null {
  if (!clock) return null
  const p = clock.trim().split(":").map(Number)
  if (p.some((n) => !isFinite(n))) return null
  const mins = p.length === 3 ? p[0] * 60 + p[1] + p[2] / 60 : p.length === 2 ? p[0] + p[1] / 60 : NaN
  return isFinite(mins) ? Math.floor(mins) : null
}

/**
 * Human match time from the scorebug `period` + `game_clock`, e.g.
 * "2nd half · 67'" or "1st half · 45+2'". Soccer clocks count up continuously,
 * so `period` disambiguates stoppage: >45 in the 1st half is 45+X, >90 in the
 * 2nd half is 90+X. Non-play periods return a plain label.
 */
export function formatGameTime(period?: string, clock?: string): string {
  const p = (period || "").toLowerCase()
  if (p.startsWith("pre")) return "Pre-game"
  if (p.startsWith("post")) return "Post-game"
  if (p === "halftime" || p === "half-time" || p === "half time") return "Half-time"

  const min = clockMinutes(clock)
  const first = p.includes("first") || p === "1st half"
  const second = p.includes("second") || p === "2nd half"
  const stoppage = p.includes("stoppage")
  const label = first ? "1st half" : second ? "2nd half" : period ? period : ""
  if (min == null) return label

  let m: string
  if (second || (stoppage && min >= 46)) {
    m = min > 90 ? `90+${min - 90}'` : `${min}'`
  } else if (first || stoppage) {
    m = min > 45 ? `45+${min - 45}'` : `${min}'`
  } else {
    m = `${min}'`
  }
  return label ? `${label} · ${m}` : m
}
