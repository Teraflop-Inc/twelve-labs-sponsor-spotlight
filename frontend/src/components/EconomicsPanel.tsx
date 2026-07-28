import { useMemo, useRef, useState, type ReactNode } from "react"
import { Button, TextField } from "@twelvelabs-io/react"
import { DEFAULT_ECON, resolveEcon, type EconState, type ResolvedEcon } from "../lib/econ"
import {
  fileToCsvText,
  parseAudienceCSV,
  parseRateCardCSV,
  SOURCE_LABEL,
  SYNTHETIC_RATE_CARD,
  type AudiencePoint,
  type DataSource,
  type RateCardRow,
} from "../lib/econData"
import { ALL_GAMES, useApp } from "../state"
import { SectionCard, SourceBadge, Sparkline } from "../ui"
import type { Moment } from "../lib/types"

/** All appearances across the brands currently in scope — sizes the resolver. */
function scopeAppearances(brands: { appearances?: Moment[]; top_moments?: Moment[] }[]): Moment[] {
  const out: Moment[] = []
  for (const b of brands) out.push(...(b.appearances || b.top_moments || []))
  return out
}

export function EconomicsPanel() {
  const { econ, setEcon, mode, gameId, inventory, scopeInventory } = useApp()
  const set = (patch: Partial<EconState>) => setEcon((p) => ({ ...p, ...patch }))

  const brands = mode === "demo" ? scopeInventory : inventory || []
  const resolved = useMemo(
    () => resolveEcon(econ, gameId === ALL_GAMES ? null : gameId, scopeAppearances(brands)),
    [econ, gameId, brands],
  )

  return (
    <SectionCard
      step="2"
      title="Economic assumptions"
      hint="Real data if you upload it, synthetic if you don't — every number is labelled by source."
    >
      {/* Rights fee — the one intentionally-manual input. */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2" title="Annual sponsorship rights fee — used for ROI (EMV ÷ rights fee)">
          <span className="whitespace-nowrap text-xs text-foreground-muted">Rights fee $</span>
          <TextField
            size="small"
            type="number"
            step="100000"
            value={String(econ.rightsFee)}
            onChange={(e) => set({ rightsFee: parseFloat(e.target.value) || 0 })}
            className="w-32"
          />
        </label>
        <SourceBadge source="customer_upload" label="Manual" title="Rights fee is a manual input" />
        {econ.rightsFee !== DEFAULT_ECON.rightsFee && (
          <Button
            size="sm"
            variant="ghosted"
            onClick={() => set({ rightsFee: DEFAULT_ECON.rightsFee })}
            title={`Reset to default ($${DEFAULT_ECON.rightsFee.toLocaleString()})`}
          >
            reset
          </Button>
        )}
        <span className="text-xs text-foreground-subtle">Drives ROI = EMV ÷ rights fee.</span>
      </div>

      {/* The two data sources the EMV formula needs. */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <UploadCard
          title="Audience data"
          formatHint="Nielsen / Comscore CSV or XLSX — columns: minute, ama_millions"
          uploadedName={econ.audienceUploadName}
          source={econ.audienceUpload ? "customer_upload" : "simulated"}
          summary={
            resolved.audience.points.length
              ? `Peak ${resolved.audience.peak.toFixed(1)}M at min ${resolved.audience.peakMinute} · mean ${resolved.audience.mean.toFixed(1)}M · ${resolved.audience.points.length} pts`
              : "—"
          }
          preview={<AudiencePreview resolved={resolved} />}
          onFile={async (file) => {
            const res = await readUpload(file, (t) => parseAudienceCSV(t))
            if (res.error) {
              // Bad file → fall back to synthetic (PRD Definition of Done).
              set({ audienceUpload: null, audienceUploadName: null })
              return res.error
            }
            set({ audienceUpload: res.rows as AudiencePoint[], audienceUploadName: file.name })
            return null
          }}
          onClear={() => set({ audienceUpload: null, audienceUploadName: null })}
        />

        <UploadCard
          title="Media rate card"
          formatHint="CSV or XLSX — columns: network, daypart, rate_per_30sec"
          uploadedName={econ.rateCardUploadName}
          source={resolved.rate.source}
          summary={`$${resolved.rate.value.toLocaleString()} /:30 · ${resolved.rate.broadcast.network} · ${resolved.rate.broadcast.daypart}`}
          preview={<RateCardPreview resolved={resolved} />}
          onFile={async (file) => {
            const res = await readUpload(file, (t) => parseRateCardCSV(t))
            if (res.error) {
              // Bad file → fall back to synthetic (PRD Definition of Done).
              set({ rateCardUpload: null, rateCardUploadName: null })
              return res.error
            }
            set({ rateCardUpload: res.rows as RateCardRow[], rateCardUploadName: file.name })
            return null
          }}
          onClear={() => set({ rateCardUpload: null, rateCardUploadName: null })}
        />
      </div>

      <p className="mt-3 text-xs italic text-foreground-subtle">
        Synthetic data is a placeholder, not a lie — every{" "}
        <span className="font-tl-mono not-italic text-tl-analyze-dark-orange">
          {SOURCE_LABEL.simulated}
        </span>{" "}
        figure is labelled on screen, in the export, and in the API. Upload a file to replace it with{" "}
        <span className="font-tl-mono not-italic text-tl-system-color-dark-blue">
          {SOURCE_LABEL.customer_upload}
        </span>{" "}
        data.
      </p>
    </SectionCard>
  )
}

/** Minute-by-minute audience curve (the AMA that scales every EMV). */
function AudiencePreview({ resolved }: { resolved: ResolvedEcon }) {
  const { points, peakMinute, source } = resolved.audience
  if (points.length < 2) return null
  const values = points.map((p) => p.ama)
  const peakIndex = points.findIndex((p) => p.minute === peakMinute)
  const lastMinute = points[points.length - 1].minute
  const tone =
    source === "customer_upload" ? "text-tl-system-color-dark-blue" : "text-tl-analyze-dark-orange"
  return (
    <div className="mt-2">
      <Sparkline values={values} peakIndex={peakIndex >= 0 ? peakIndex : undefined} className={tone} />
      <div className="mt-0.5 flex justify-between font-tl-mono text-[10px] text-foreground-subtle">
        <span>0′</span>
        <span>AMA (millions) · minute-by-minute</span>
        <span>{lastMinute}′</span>
      </div>
    </div>
  )
}

/** The rate-card rows in play, with the active broadcast's row highlighted. */
function RateCardPreview({ resolved }: { resolved: ResolvedEcon }) {
  const MAX = 8
  // Show the card the rate actually came from: the customer card if it matched,
  // otherwise the synthetic card we fell back to (per-number tagging).
  const usingCard = resolved.rate.source === resolved.card.source
  const rows = usingCard ? resolved.card.rows : SYNTHETIC_RATE_CARD.rows
  const shown = rows.slice(0, MAX)
  const active = resolved.rate.row
  const fellBack = resolved.card.source === "customer_upload" && resolved.rate.source === "simulated"

  return (
    <div className="mt-2">
      <div className="overflow-hidden rounded-tlds-1 border border-border-secondary">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-tl-gray-50 text-foreground-subtle">
              <th className="px-2 py-1 text-left font-medium">Network</th>
              <th className="px-2 py-1 text-left font-medium">Daypart</th>
              <th className="px-2 py-1 text-right font-medium">$/:30</th>
            </tr>
          </thead>
          <tbody className="font-tl-mono">
            {shown.map((r, i) => {
              const isActive = r === active
              return (
                <tr
                  key={`${r.network}-${r.daypart}-${i}`}
                  className={
                    isActive
                      ? "bg-tl-system-color-lightest-blue text-tl-system-color-dark-blue"
                      : "text-foreground-muted"
                  }
                >
                  <td className="px-2 py-1">
                    {isActive && <span aria-hidden>▸ </span>}
                    {r.network}
                  </td>
                  <td className="px-2 py-1">{r.daypart}</td>
                  <td className="px-2 py-1 text-right tabular-nums">${r.ratePer30.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length > MAX && (
        <div className="mt-1 text-[10px] text-foreground-subtle">+{rows.length - MAX} more rows</div>
      )}
      {fellBack && (
        <div className="mt-1 text-[10px] text-tl-analyze-dark-orange">
          “{resolved.rate.broadcast.network} · {resolved.rate.broadcast.daypart}” isn’t in your file —
          using the synthetic rate for this broadcast.
        </div>
      )}
    </div>
  )
}

/** Read a file (CSV or XLSX) as text and parse; returns rows or a friendly error. */
async function readUpload<T>(
  file: File,
  parse: (text: string) => { rows: T[]; error?: string },
): Promise<{ rows: T[]; error?: string }> {
  try {
    const text = await fileToCsvText(file)
    return parse(text)
  } catch {
    return { rows: [], error: "Couldn't read the file — is it a valid CSV or XLSX?" }
  }
}

function UploadCard({
  title,
  formatHint,
  uploadedName,
  source,
  summary,
  preview,
  onFile,
  onClear,
}: {
  title: string
  formatHint: string
  uploadedName: string | null
  source: DataSource
  summary: string
  preview?: ReactNode
  onFile: (file: File) => Promise<string | null>
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pick = () => inputRef.current?.click()
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setBusy(true)
    setError(null)
    const err = await onFile(file)
    setError(err)
    setBusy(false)
  }

  return (
    <div className="rounded-tlds-2 border border-border-secondary p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <SourceBadge source={source} />
      </div>
      <div className="mt-1 text-xs text-foreground-subtle">{summary}</div>

      {preview}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onChange}
        />
        <Button size="sm" variant="outlined-gray" onClick={pick} disabled={busy}>
          {busy ? "reading…" : uploadedName ? "Replace file" : "Upload CSV / XLSX"}
        </Button>
        {uploadedName && (
          <>
            <span className="max-w-[45%] truncate font-tl-mono text-[11px] text-foreground-muted" title={uploadedName}>
              {uploadedName}
            </span>
            <Button
              size="sm"
              variant="ghosted"
              onClick={() => {
                setError(null)
                onClear()
              }}
            >
              clear
            </Button>
          </>
        )}
      </div>

      {error ? (
        <div className="mt-2 text-[11px] text-foreground-status-error">
          {error} Falling back to synthetic.
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-foreground-subtle">{formatHint}</div>
      )}
    </div>
  )
}
