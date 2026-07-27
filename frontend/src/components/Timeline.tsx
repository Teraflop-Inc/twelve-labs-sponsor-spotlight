import { useMemo } from "react"
import { fmtTime } from "../lib/econ"
import { useApp } from "../state"
import type { Moment } from "../lib/types"

// JIL "temporal" mark: a horizontal exposure track with context-colored
// segments positioned by timestamp. Clicking a segment seeks the player.
// Solid color per broadcast context, from the TLDS palette.
export const CTX_COLOR: Record<string, string> = {
  score: "var(--tl-color-system-color-red)",
  goal: "var(--tl-color-system-color-red)",
  celebration: "var(--tl-color-master-brand-peach)",
  replay: "var(--tl-color-analyze-orange)",
  close_up: "var(--tl-color-master-brand-green)",
  wide_shot: "var(--tl-color-system-color-blue)",
  pregame: "var(--tl-color-search-purple)",
  halftime: "var(--tl-color-search-purple)",
  postgame: "var(--tl-color-search-purple)",
  timeout: "var(--tl-color-search-purple)",
  commercial: "var(--tl-color-gray-400)",
  other: "var(--tl-color-gray-500)",
}

/** Friendly display label for a broadcast-context (event) key. */
const CTX_LABEL: Record<string, string> = {
  close_up: "close-up",
  wide_shot: "wide",
}
export const ctxLabel = (ctx: string): string =>
  CTX_LABEL[ctx] ?? ctx.replace(/_/g, " ")

export function Timeline({ moments }: { moments: Moment[] }) {
  const { seekTo } = useApp()

  const { segments, duration } = useMemo(() => {
    const valid = moments
      .map((m) => ({
        s: Number(m.start_sec) || 0,
        e: Number(m.end_sec) || 0,
        ctx: m.context || "other",
        video: m.video,
      }))
      .filter((m) => m.e > m.s)
    const duration = valid.reduce((max, m) => Math.max(max, m.e), 0) * 1.02 || 1
    return { segments: valid, duration }
  }, [moments])

  if (segments.length === 0) return null

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-foreground-subtle">
        <span>Exposure timeline</span>
        <span className="font-tl-mono">{fmtTime(duration)}</span>
      </div>
      <div className="relative h-6 w-full overflow-hidden rounded-tlds-1 bg-surface-secondary">
        {segments.map((m, i) => {
          const left = (m.s / duration) * 100
          const width = Math.max(0.6, ((m.e - m.s) / duration) * 100)
          return (
            <button
              key={i}
              type="button"
              onClick={() => seekTo(m.s, m.video)}
              title={`${fmtTime(m.s)}–${fmtTime(m.e)} · ${ctxLabel(m.ctx)}`}
              className="absolute top-0 h-full cursor-pointer transition-opacity hover:opacity-70"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: CTX_COLOR[m.ctx] || CTX_COLOR.other,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
