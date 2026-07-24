import { useMemo, useRef, useState } from "react"
import { Button, TextField } from "@twelvelabs-io/react"
import { resolveEcon, type EconState } from "../lib/econ"
import {
  isSpreadsheetBinary,
  parseAudienceCSV,
  parseRateCardCSV,
  SOURCE_LABEL,
  type AudiencePoint,
  type DataSource,
  type RateCardRow,
} from "../lib/econData"
import { ALL_GAMES, useApp } from "../state"
import { SectionCard, SourceBadge } from "../ui"
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
        <span className="text-xs text-foreground-subtle">Drives ROI = EMV ÷ rights fee.</span>
      </div>

      {/* The two data sources the EMV formula needs. */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <UploadCard
          title="Audience data"
          formatHint="Nielsen / Comscore CSV — columns: minute, ama_millions"
          uploadedName={econ.audienceUploadName}
          source={econ.audienceUpload ? "customer_upload" : "simulated"}
          summary={
            resolved.audience.points.length
              ? `Peak ${resolved.audience.peak.toFixed(1)}M at min ${resolved.audience.peakMinute} · mean ${resolved.audience.mean.toFixed(1)}M`
              : "—"
          }
          onFile={async (file) => {
            const res = await readCsv(file, (t) => parseAudienceCSV(t))
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
          formatHint="CSV — columns: network, daypart, rate_per_30sec"
          uploadedName={econ.rateCardUploadName}
          source={resolved.rate.source}
          summary={`$${resolved.rate.value.toLocaleString()} /:30 · ${resolved.rate.broadcast.network} · ${resolved.rate.broadcast.daypart}`}
          onFile={async (file) => {
            const res = await readCsv(file, (t) => parseRateCardCSV(t))
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

/** Read a file as text and parse; returns rows or a friendly error string. */
async function readCsv<T>(
  file: File,
  parse: (text: string) => { rows: T[]; error?: string },
): Promise<{ rows: T[]; error?: string }> {
  if (isSpreadsheetBinary(file.name))
    return { rows: [], error: "XLSX isn't supported yet — please export the sheet as CSV." }
  try {
    const text = await file.text()
    return parse(text)
  } catch {
    return { rows: [], error: "Couldn't read the file." }
  }
}

function UploadCard({
  title,
  formatHint,
  uploadedName,
  source,
  summary,
  onFile,
  onClear,
}: {
  title: string
  formatHint: string
  uploadedName: string | null
  source: DataSource
  summary: string
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

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onChange} />
        <Button size="sm" variant="outlined-gray" onClick={pick} disabled={busy}>
          {busy ? "reading…" : uploadedName ? "Replace file" : "Upload CSV"}
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
