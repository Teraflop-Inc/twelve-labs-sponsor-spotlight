import { useEffect, useState } from "react"
import { Button, Chip } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { cn } from "@/lib/utils"
import { ALL_GAMES, useApp } from "../state"
import {
  MomentRow,
  ProvenanceBadge,
  ReRunButton,
  ScoreBar,
  SectionCard,
  StatusLine,
} from "../ui"
import type {
  LegibilityAsset,
  LegibilityBrand,
  LegibilityReport,
  Provenance,
} from "../lib/types"

/** Stable DOM id for a legibility card, so the Viewing chips can scroll to it. */
const legibDomId = (name: string) => "legib-" + name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

const DIMS: { key: keyof LegibilityAsset; label: string }[] = [
  { key: "contrast", label: "contrast" },
  { key: "size", label: "size" },
  { key: "position", label: "position" },
  { key: "camera_angle", label: "camera angle" },
  { key: "motion_blur", label: "motion blur" },
]

export function LegibilityPanel() {
  const {
    mode,
    activeStore,
    readyVideos,
    sessionId,
    setSessionId,
    storeStatus,
    storeEpoch,
    gameId,
    brandA,
    brandB,
    scopeLegibility,
    viewBrands,
    setLegibility,
  } = useApp()
  const [report, setReport] = useState<LegibilityReport | null>(null)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const [prov, setProv] = useState<Provenance | null>(null)
  // A live audit in demo mode replaces the pre-baked scope view with its result.
  const [liveRun, setLiveRun] = useState(false)

  useEffect(() => {
    setReport(null)
    setStatus("")
    setProv(null)
  }, [storeEpoch])

  // Mirror the report into shared state so the export/report tools can read the
  // legibility scores (avg legibility per brand).
  useEffect(() => {
    setLegibility(report)
  }, [report, setLegibility])

  const ready = storeStatus === "ready"
  const haveBrands = Boolean(brandA.trim() && brandB.trim())
  const demoView = mode === "demo"

  // Demo = the scope's cached audit filtered to the viewed brands; BYO = the
  // locally-run `report`. Only some scopes/brands have legibility data.
  const displayReport: LegibilityReport | null =
    demoView && !liveRun
      ? scopeLegibility
        ? { brands: scopeLegibility.brands.filter((b) => viewBrands.includes(b.name)) }
        : null
      : report

  // Which brands an audit covers: demo audits the brands being viewed, BYO the
  // pair carried over from the analyze step.
  const auditBrands = demoView ? viewBrands : [brandA.trim(), brandB.trim()].filter(Boolean)

  // Card expand/collapse lifted here so the Viewing chips can open + scroll to a
  // brand's audit. All start collapsed.
  const [openBrands, setOpenBrands] = useState<Record<string, boolean>>({})
  const toggleBrand = (name: string) => setOpenBrands((m) => ({ ...m, [name]: !m[name] }))
  const goToBrand = (name: string) => {
    setOpenBrands((m) => ({ ...m, [name]: true }))
    setTimeout(
      () => document.getElementById(legibDomId(name))?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    )
  }

  const onAudit = async (opts: { live?: boolean } = {}) => {
    if (opts.live) setLiveRun(true)
    const a = brandA.trim()
    const b = brandB.trim()
    if (!a || !b || !activeStore) return
    setBusy(true)
    setStatus("Running legibility audit…")
    setReport(null)
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
        game_id: gameId === ALL_GAMES ? undefined : gameId,
      }
      const data = await api.legibility(ctx, [a, b], sessionId, opts.live)
      setSessionId(data.session_id ?? sessionId)
      setReport(data.report)
      setProv(data.provenance ?? null)
      setStatus(data.report ? "" : "No audit could be generated for these brands — please try again.")
    } catch (e) {
      setStatus(`ERROR: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      step="5"
      title="Legibility audit"
      hint="Per-asset visibility scores for the selected brands."
      actions={
        demoView ? (
          auditBrands.length > 0 && (
            <ReRunButton
              onClick={() => onAudit({ live: true })}
              disabled={!ready || busy}
              busy={busy}
            />
          )
        ) : (
          <Button onClick={() => onAudit()} disabled={!ready || busy || !haveBrands}>
            {busy ? "auditing…" : "Run audit"}
          </Button>
        )
      }
    >
      {!demoView && (
        <p className="mb-2 text-xs text-foreground-subtle">
          {haveBrands ? (
            <>
              Auditing{" "}
              <span className="font-tl-mono text-foreground-body">{brandA}</span> vs{" "}
              <span className="font-tl-mono text-foreground-body">{brandB}</span>{" "}
              <span className="text-foreground-subtle">(the brands you analyzed above)</span>
            </>
          ) : (
            "Analyze 2 brands above, then audit them here."
          )}
        </p>
      )}
      {!demoView && (
        <StatusLine tone={status.startsWith("ERROR") ? "error" : "muted"}>
          <span className="inline-flex items-center gap-1.5">
            {status}
            {prov && !status.startsWith("ERROR") && <ProvenanceBadge prov={prov} />}
          </span>
        </StatusLine>
      )}
      {demoView && !displayReport && (
        <p className="text-xs text-foreground-subtle">
          No legibility audit is cached for the selected brands in this scope.
        </p>
      )}
      {displayReport && (
        <div className="mt-2 space-y-4">
          {displayReport.brands.length === 0 && (
            <p className="text-xs text-foreground-subtle">
              Select analyzed brands above to see their legibility scores.
            </p>
          )}
          {displayReport.brands.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
              <span>Viewing:</span>
              {displayReport.brands.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => goToBrand(b.name)}
                  className="cursor-pointer"
                  title={`Go to ${b.name}`}
                >
                  <Chip variant="subtle" size="sm">
                    {b.name}
                  </Chip>
                </button>
              ))}
            </div>
          )}
          {displayReport.brands.map((b) => (
            <BrandLegibility
              key={b.name}
              brand={b}
              open={Boolean(openBrands[b.name])}
              onToggle={() => toggleBrand(b.name)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}

function overallColor(score: number) {
  return score <= 4
    ? "text-foreground-status-error"
    : score <= 7
      ? "text-tl-analyze-dark-orange"
      : "text-tl-master-brand-dark-green"
}

function BrandLegibility({
  brand,
  open,
  onToggle,
}: {
  brand: LegibilityBrand
  open: boolean
  onToggle: () => void
}) {
  const assets = brand.assets || []
  const avg = assets.length
    ? assets.reduce((s, a) => s + (Number(a.overall_score) || 0), 0) / assets.length
    : null
  return (
    <div
      id={legibDomId(brand.name)}
      className="scroll-mt-24 rounded-tlds-3 border border-border-secondary bg-surface-white"
    >
      {/* Click to minimize/maximize the brand's per-asset scores. */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 p-3 text-left"
        aria-expanded={open}
      >
        <span className="w-3 shrink-0 font-tl-mono text-xs text-foreground-subtle">
          {open ? "▾" : "▸"}
        </span>
        <h3 className="flex-1 truncate font-tl-sans text-lg font-semibold">{brand.name}</h3>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-foreground-subtle">
          {assets.length} asset{assets.length === 1 ? "" : "s"}
        </span>
        {avg != null && (
          <span className={cn("font-tl-mono text-base", overallColor(avg))}>
            {avg.toFixed(1)}
            <span className="text-xs text-foreground-subtle">/10</span>
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {brand.summary && (
            <p className="mb-2 text-xs italic text-foreground-subtle">{brand.summary}</p>
          )}
          {assets.length === 0 && (
            <div className="text-xs text-foreground-subtle">No assets returned.</div>
          )}
          {assets.map((a, i) => (
            <AssetReport key={i} asset={a} first={i === 0} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssetReport({ asset, first }: { asset: LegibilityAsset; first: boolean }) {
  const overall = Number(asset.overall_score) || 0
  return (
    <div className={cn("mt-2 pt-2", !first && "border-t border-border-secondary")}>
      <div className="mb-1 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold">{asset.asset_type || "other"}</h4>
        <span className={cn("font-tl-mono text-lg", overallColor(overall))}>
          {overall.toFixed(1)}
          <span className="text-xs text-foreground-subtle">/10</span>
        </span>
      </div>
      {DIMS.map((d) => (
        <div key={d.key} className="grid grid-cols-[100px_1fr] items-center gap-2 py-0.5 text-xs">
          <span className="text-foreground-subtle">{d.label}</span>
          <ScoreBar score={asset[d.key] as number | undefined} />
        </div>
      ))}
      {asset.issues && (
        <div className="mt-2 text-xs text-foreground-muted">
          <span className="uppercase tracking-wide text-foreground-subtle">Issues: </span>
          {asset.issues}
        </div>
      )}
      {asset.suggestions && (
        <div className="mt-1 text-xs text-foreground-status-info">
          <span className="uppercase tracking-wide text-foreground-subtle">Fix: </span>
          {asset.suggestions}
        </div>
      )}
      {asset.examples && asset.examples.length > 0 && (
        <ul className="mt-2">
          {asset.examples.map((ex, i) => (
            <MomentRow key={i} m={{ start_sec: ex.start_sec, end_sec: ex.end_sec, video: ex.video }}>
              {ex.note || ""}
            </MomentRow>
          ))}
        </ul>
      )}
    </div>
  )
}
