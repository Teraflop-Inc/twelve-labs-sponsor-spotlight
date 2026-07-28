import type { ReactNode } from "react"
import { Chip } from "@twelvelabs-io/react"
import { cn } from "@/lib/utils"
import { fmtTime, formatGameTime } from "./lib/econ"
import { SOURCE_LABEL, type DataSource } from "./lib/econData"
import { momentEvents, momentView } from "./lib/moments"
import { useApp } from "./state"
import type { Moment } from "./lib/types"

// Data-provenance badge (PRD step 9): every economics number is labelled
// Detected / Customer-Uploaded / Simulated so a simulated placeholder never
// reads as a real measured value.
const SOURCE_STYLE: Record<DataSource, string> = {
  detected: "bg-tl-embed-lightest-green text-tl-embed-dark-green",
  customer_upload: "bg-tl-system-color-lightest-blue text-tl-system-color-dark-blue",
  simulated: "bg-tl-analyze-lightest-orange text-tl-analyze-dark-orange",
}

export function SourceBadge({
  source,
  label,
  title,
}: {
  source: DataSource
  /** Override the default source word (e.g. prefix with what it describes). */
  label?: string
  title?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-[6px] px-1.5 font-tl-mono text-[10px] uppercase leading-4 tracking-wide",
        SOURCE_STYLE[source],
      )}
      title={title ?? `Data source: ${SOURCE_LABEL[source]}`}
    >
      {label ?? SOURCE_LABEL[source]}
    </span>
  )
}

/**
 * Minimal inline SVG sparkline (no chart lib). Draws `values` as a filled line
 * over a fixed internal viewBox that CSS stretches to the container width, so it
 * stays crisp at any size. `peakIndex` gets a marker dot. Colour comes from
 * `currentColor`, so callers set it with a text-* class.
 */
export function Sparkline({
  values,
  peakIndex,
  className,
}: {
  values: number[]
  peakIndex?: number
  className?: string
}) {
  if (values.length < 2) return null
  const W = 240
  const H = 40
  const PAD = 3
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const stepX = W / (values.length - 1)
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
  const px = peakIndex != null ? peakIndex * stepX : null
  const py = peakIndex != null ? y(values[peakIndex]) : null
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      role="img"
      aria-hidden
    >
      <polyline points={`0,${H} ${pts} ${W},${H}`} fill="currentColor" opacity={0.1} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {px != null && py != null && <circle cx={px} cy={py} r={2.75} fill="currentColor" />}
    </svg>
  )
}

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
  substitution: "bg-tl-search-lightest-purple text-tl-search-dark-purple",
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
      {ctx.replace(/_/g, " ")}
    </span>
  )
}

/** Both axes of a moment as chips: each event (0..n) then the camera view.
 *  Falls back to a single "other" chip when a moment carries neither. */
export function MomentTags({ m }: { m: Moment }) {
  const events = momentEvents(m)
  const view = momentView(m)
  if (!events.length && !view) return <ContextChip context="other" />
  return (
    <>
      {events.map((e) => (
        <ContextChip key={`e-${e}`} context={e} />
      ))}
      {view && <ContextChip context={view} />}
    </>
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
      <MomentTags m={m} />
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
