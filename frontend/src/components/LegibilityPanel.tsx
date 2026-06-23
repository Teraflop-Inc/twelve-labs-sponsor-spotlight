import { useEffect, useState } from "react"
import { Button } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { cn } from "@/lib/utils"
import { useApp } from "../state"
import { MomentRow, ScoreBar, SectionCard, StatusLine } from "../ui"
import type { LegibilityAsset, LegibilityBrand, LegibilityReport } from "../lib/types"

const DIMS: { key: keyof LegibilityAsset; label: string }[] = [
  { key: "contrast", label: "contrast" },
  { key: "size", label: "size" },
  { key: "position", label: "position" },
  { key: "camera_angle", label: "camera angle" },
  { key: "motion_blur", label: "motion blur" },
]

export function LegibilityPanel() {
  const { activeStore, readyVideos, sessionId, setSessionId, storeStatus, storeEpoch, brandA, brandB } =
    useApp()
  const [report, setReport] = useState<LegibilityReport | null>(null)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setReport(null)
    setStatus("")
  }, [storeEpoch])

  const ready = storeStatus === "ready"
  const haveBrands = Boolean(brandA.trim() && brandB.trim())

  const onAudit = async () => {
    const a = brandA.trim()
    const b = brandB.trim()
    if (!a || !b || !activeStore) return
    setBusy(true)
    setStatus("Auditing with Jockey…")
    setReport(null)
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
      }
      const data = await api.legibility(ctx, [a, b], sessionId)
      setSessionId(data.session_id ?? sessionId)
      setReport(data.report)
      setStatus(data.report ? "" : `No structured output; raw: ${(data.answer || "").slice(0, 200)}`)
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
      hint="Per-asset visibility scores for the two analyzed brands."
      actions={
        <Button onClick={onAudit} disabled={!ready || busy || !haveBrands}>
          {busy ? "auditing…" : "Audit current brands"}
        </Button>
      }
    >
      <p className="mb-2 text-xs text-foreground-subtle">
        {haveBrands ? (
          <>
            Auditing{" "}
            <span className="font-tl-mono text-foreground-body">{brandA}</span> vs{" "}
            <span className="font-tl-mono text-foreground-body">{brandB}</span>{" "}
            <span className="text-foreground-subtle">(the brands you analyzed above)</span>
          </>
        ) : (
          "Analyze 2 brands in the Brand inventory above, then audit them here."
        )}
      </p>
      <StatusLine tone={status.startsWith("ERROR") ? "error" : "muted"}>{status}</StatusLine>
      {report && (
        <div className="mt-2 space-y-4">
          {report.brands.map((b) => (
            <BrandLegibility key={b.name} brand={b} />
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

function BrandLegibility({ brand }: { brand: LegibilityBrand }) {
  return (
    <div className="rounded-tlds-3 border border-border-secondary bg-surface-white p-3">
      <h3 className="font-tl-sans text-lg font-semibold">{brand.name}</h3>
      {brand.summary && <p className="mb-2 text-xs italic text-foreground-subtle">{brand.summary}</p>}
      {(brand.assets || []).length === 0 && (
        <div className="text-xs text-foreground-subtle">No assets returned.</div>
      )}
      {(brand.assets || []).map((a, i) => (
        <AssetReport key={i} asset={a} first={i === 0} />
      ))}
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
