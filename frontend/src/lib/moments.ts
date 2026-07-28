// Two-axis moment tagging — single source of truth for reading a Moment's tags.
//
// A sponsor moment carries two orthogonal axes (backend `PER_BRAND_SCHEMA`):
//   • view   — how it's framed by the camera (single): close_up / wide_shot / other
//   • events — match game-state at that moment (0..n): goal / celebration / replay / …
//
// The other four games' committed fixtures predate the split and still carry a
// single `context` string. Every helper below falls back to `context` so both
// shapes render identically — nothing downstream needs to know which it got.
//
// Mirrors backend `weights.py` (`CONTEXT_WEIGHTS` + `weight_for_moment`). Kept in
// its own module (not econ.ts) so Timeline/AnalyzePanel/ui/export can import the
// helpers without pulling in the economics graph — and to avoid an import cycle
// (econ.ts re-exports CONTEXT_WEIGHTS from here).

import type { Moment } from "./types"

// Per-tag value multipliers — the "monetizability" of a moment. Used to RANK
// moments (top plays, reel/report selection) and to weight roll-ups, NOT to set
// the EMV dollar figure. View keys and event keys are disjoint, so one flat
// table covers both axes. `goal` is an alias for `score` (the scoring play).
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
  substitution: 1.0,
  commercial: 0.5,
  other: 1,
}

// The two values that live on the `view` axis. A legacy `context` holding one of
// these is a framing tag; anything else is an event (or the empty "other").
const VIEW_VALUES = new Set(["close_up", "wide_shot"])

/** Camera framing for a moment (single), or undefined if none is recorded. */
export function momentView(m: Moment): string | undefined {
  if (m.view) return m.view
  const ctx = m.context ? String(m.context) : undefined
  return ctx && VIEW_VALUES.has(ctx) ? ctx : undefined
}

/** Match game-state tags for a moment (0..n), derived from the legacy `context`
 *  when the new `events` array is absent. Legacy `"other"` → no event. */
export function momentEvents(m: Moment): string[] {
  if (Array.isArray(m.events)) return m.events.map((e) => String(e))
  const ctx = m.context ? String(m.context) : undefined
  return ctx && !VIEW_VALUES.has(ctx) && ctx !== "other" ? [ctx] : []
}

/** All tags on a moment (events + view), for chips / filtering / color. Always
 *  non-empty: a moment with neither axis falls back to ["other"]. */
export function momentTags(m: Moment): string[] {
  const tags = [...momentEvents(m)]
  const view = momentView(m)
  if (view) tags.push(view)
  return tags.length ? tags : ["other"]
}

/** The single most valuable tag on a moment (highest CONTEXT_WEIGHTS), for the
 *  one-color timeline segment / primary chip. */
export function primaryTag(m: Moment): string {
  const tags = momentTags(m)
  let best = tags[0]
  let bestW = CONTEXT_WEIGHTS[best] ?? 1
  for (const t of tags) {
    const w = CONTEXT_WEIGHTS[t] ?? 1
    if (w > bestW) {
      best = t
      bestW = w
    }
  }
  return best
}

/** Value multiplier for a moment: max weight across its tags (min 1). */
export function momentWeight(
  m: Moment,
  weights: Record<string, number> = CONTEXT_WEIGHTS,
): number {
  let best = 1
  for (const t of momentTags(m)) {
    const w = weights[t]
    if (w != null && w > best) best = w
  }
  return best
}
