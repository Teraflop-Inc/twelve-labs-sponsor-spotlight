import type { Brand, Moment } from "./types"

// Per-context value multipliers. Keys match the backend context enum
// (`score` is the scoring play; the dark-app's `goal` alias maps to it).
export const DEFAULT_WEIGHTS: Record<string, number> = {
  score: 3,
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

export interface EconState {
  cpm: number
  reach: number // millions
  audPremium: number // % age 18-49
  audRegional: number // % in home region
  audStreaming: number // % streaming vs linear
  weights: Record<string, number>
}

export const DEFAULT_ECON: EconState = {
  cpm: 14,
  reach: 2.1,
  audPremium: 55,
  audRegional: 65,
  audStreaming: 35,
  weights: { ...DEFAULT_WEIGHTS },
}

const ECON_LS_KEY = "sponsor-spotlight-econ-v2"

export function loadEcon(): EconState {
  try {
    const saved = JSON.parse(localStorage.getItem(ECON_LS_KEY) || "null")
    if (!saved) return { ...DEFAULT_ECON, weights: { ...DEFAULT_WEIGHTS } }
    return {
      cpm: num(saved.cpm, DEFAULT_ECON.cpm),
      reach: num(saved.reach, DEFAULT_ECON.reach),
      audPremium: num(saved.audPremium, DEFAULT_ECON.audPremium),
      audRegional: num(saved.audRegional, DEFAULT_ECON.audRegional),
      audStreaming: num(saved.audStreaming, DEFAULT_ECON.audStreaming),
      weights: { ...DEFAULT_WEIGHTS, ...(saved.weights || {}) },
    }
  } catch {
    return { ...DEFAULT_ECON, weights: { ...DEFAULT_WEIGHTS } }
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

/**
 * Simple, transparent demo audience model:
 *   premium-demo (18-49) boost up to +40% at 100%
 *   regional concentration discount up to -20% (worth less to national buyers)
 *   streaming engagement boost up to +30%
 */
export function audienceMultiplier(e: EconState): number {
  return (
    (1 + (e.audPremium / 100) * 0.4) *
    (1 - (e.audRegional / 100) * 0.2) *
    (1 + (e.audStreaming / 100) * 0.3)
  )
}

/**
 * Merge overlapping appearances into time-union intervals so simultaneous
 * exposures on multiple surfaces count as ONE eyeball-second, not N. Each
 * merged interval inherits the MAX context weight of its constituents — the
 * strongest classification wins, matching how a viewer perceives the moment.
 */
export function unionWeightedSeconds(
  moments: Moment[],
  weights: Record<string, number>,
): { unionSecs: number; weightedSecs: number } {
  const norm = moments
    .map((m) => ({
      s: Number(m.start_sec) || 0,
      e: Number(m.end_sec) || 0,
      w: weights[m.context ?? "other"] ?? 1,
    }))
    .filter((m) => m.e > m.s)
    .sort((a, b) => a.s - b.s)

  if (!norm.length) return { unionSecs: 0, weightedSecs: 0 }

  let unionSecs = 0
  let weightedSecs = 0
  let curS = norm[0].s
  let curE = norm[0].e
  let curW = norm[0].w
  for (let i = 1; i < norm.length; i++) {
    const m = norm[i]
    if (m.s <= curE) {
      curE = Math.max(curE, m.e)
      curW = Math.max(curW, m.w)
    } else {
      const dur = curE - curS
      unionSecs += dur
      weightedSecs += dur * curW
      curS = m.s
      curE = m.e
      curW = m.w
    }
  }
  const dur = curE - curS
  unionSecs += dur
  weightedSecs += dur * curW
  return { unionSecs, weightedSecs }
}

/**
 * Weighted media value: union-of-intervals × weight × per-second rate.
 * per-sec rate = (CPM × reach_M × 1000) / 30 × audience multiplier.
 * Accepts either head-to-head `top_moments` or inventory `appearances`.
 */
export function brandValue(b: Brand, e: EconState): number {
  const moments = b.top_moments || b.appearances || []
  const ratePerSec = ((e.cpm * e.reach * 1000) / 30) * audienceMultiplier(e)
  let { unionSecs, weightedSecs } = unionWeightedSeconds(moments, e.weights)

  // If Jockey reported a larger total_seconds than the sampled union covers,
  // extrapolate the remainder using the average weight of the sampled moments.
  const total = b.total_seconds || 0
  if (unionSecs > 0 && total > unionSecs) {
    const avgWeight = weightedSecs / unionSecs
    weightedSecs += (total - unionSecs) * avgWeight
  } else if (unionSecs === 0) {
    weightedSecs = total // weight 1.0 fallback
  }
  return weightedSecs * ratePerSec
}

// --- formatting -------------------------------------------------------------

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
