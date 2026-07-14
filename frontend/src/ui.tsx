import type { ReactNode } from "react"
import { Chip } from "@twelvelabs-io/react"
import { cn } from "@/lib/utils"
import { fmtTime, formatGameTime } from "./lib/econ"
import { useApp } from "./state"
import type { Moment } from "./lib/types"

/** A numbered section card — the spine of the demo layout. */
export function SectionCard({
  title,
  hint,
  actions,
  children,
}: {
  /** Legacy step label — no longer rendered, kept so callers still type-check. */
  step?: string
  title: string
  hint?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-dialog border border-border-secondary bg-surface-white p-6 shadow-[0_1px_2px_rgba(29,28,27,0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-tl-sans text-base font-semibold leading-tight">{title}</h2>
          {hint && <p className="text-xs text-foreground-subtle">{hint}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

// Light-theme tints per broadcast context, derived from TLDS system colors.
const CTX_STYLE: Record<string, string> = {
  score: "bg-tl-system-color-lightest-red text-tl-system-color-dark-red",
  goal: "bg-tl-system-color-lightest-red text-tl-system-color-dark-red",
  celebration: "bg-tl-analyze-lightest-peach text-tl-analyze-dark-peach",
  replay: "bg-tl-analyze-lightest-orange text-tl-analyze-dark-orange",
  close_up: "bg-tl-embed-lightest-green text-tl-embed-dark-green",
  wide_shot: "bg-tl-system-color-lightest-blue text-tl-system-color-dark-blue",
  pregame: "bg-tl-search-lightest-purple text-tl-search-dark-purple",
  halftime: "bg-tl-search-lightest-purple text-tl-search-dark-purple",
  postgame: "bg-tl-search-lightest-purple text-tl-search-dark-purple",
  timeout: "bg-tl-search-lightest-purple text-tl-search-dark-purple",
  commercial: "bg-tl-gray-100 text-foreground-muted",
  other: "bg-tl-gray-100 text-foreground-subtle",
}

export function ContextChip({ context }: { context?: string }) {
  const ctx = context || "other"
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-[6px] px-1.5 font-tl-mono text-[11px] leading-4",
        CTX_STYLE[ctx] || CTX_STYLE.other,
      )}
    >
      {ctx}
    </span>
  )
}

/** Small stat tile used in brand/comparison cards. */
export function MetricTile({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="rounded-tlds-2 bg-surface-body px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">{label}</div>
      <div
        className={cn(
          "font-tl-mono text-base leading-tight",
          accent ? "text-tl-embed-dark-green" : "text-foreground-body",
        )}
      >
        {value}
      </div>
    </div>
  )
}

/** 0–10 score bar with red→amber→green ramp (legibility audit). */
export function ScoreBar({ score, max = 10 }: { score?: number; max?: number }) {
  const s = Math.max(0, Math.min(max, Number(score) || 0))
  const pct = (s / max) * 100
  const color =
    s <= 4
      ? "var(--tl-color-system-color-red)"
      : s <= 7
        ? "var(--tl-color-analyze-orange)"
        : "var(--tl-color-master-brand-dark-green)"
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 text-right font-tl-mono text-xs">{s.toFixed(1)}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
        <div style={{ width: `${pct}%`, background: color, height: "100%" }} />
      </div>
    </div>
  )
}

/** A clickable moment row that seeks the player to its timestamp. */
export function MomentRow({
  m,
  children,
}: {
  m: Moment
  children?: ReactNode
}) {
  const { seekTo } = useApp()
  return (
    <li
      className="flex cursor-pointer items-start gap-2 rounded-tlds-1 px-1.5 py-1 transition-colors hover:bg-surface-body"
      title={`Play from ${fmtTime(m.start_sec)}`}
      onClick={() => seekTo(Number(m.start_sec) || 0, m.video)}
    >
      <span className="w-[88px] shrink-0 font-tl-mono text-xs text-foreground-subtle">
        <span className="block">
          {fmtTime(m.start_sec)}–{fmtTime(m.end_sec)}
        </span>
        {formatGameTime(m.period, m.game_clock) && (
          <span className="block text-[10px] text-tl-search-dark-purple" title="match time">
            {formatGameTime(m.period, m.game_clock)}
          </span>
        )}
      </span>
      <ContextChip context={m.context} />
      {m.placement === "primary" && (
        <Chip variant="success" size="sm" title="primary / foreground exposure">
          primary
        </Chip>
      )}
      <span className="min-w-0 flex-1 text-xs text-foreground-muted">
        {children ?? m.description ?? m.asset_type ?? ""}
      </span>
      {m.video && (
        <span
          className="min-w-0 max-w-[40%] shrink truncate font-tl-mono text-[10px] text-foreground-subtle"
          title={m.video}
        >
          {m.video}
        </span>
      )}
    </li>
  )
}

/** Inline status / error line under an action. */
export function StatusLine({ children, tone }: { children: ReactNode; tone?: "error" | "muted" }) {
  if (!children) return null
  return (
    <p
      className={cn(
        "text-xs",
        tone === "error" ? "text-foreground-status-error" : "text-foreground-subtle",
      )}
    >
      {children}
    </p>
  )
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <Chip variant="subtle" size="md">
      {children}
    </Chip>
  )
}
