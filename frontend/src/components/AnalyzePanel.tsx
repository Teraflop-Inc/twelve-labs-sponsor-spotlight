import { useMemo, useState } from "react"
import { Button, Chip } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { brandValue, fmtMoney } from "../lib/econ"
import { useApp } from "../state"
import { MetricTile, MomentRow, SectionCard, StatusLine } from "../ui"
import { Timeline } from "./Timeline"
import type { Brand, Moment } from "../lib/types"

export function AnalyzePanel() {
  const {
    activeStore,
    readyVideos,
    sessionId,
    setSessionId,
    econ,
    storeStatus,
    selectedBrands,
    inventory,
    setInventory,
    setBrandA,
    setBrandB,
  } = useApp()

  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  const ready = storeStatus === "ready"

  const onAnalyze = async () => {
    const names = selectedBrands.filter(Boolean)
    if (!names.length || !activeStore) return
    setBusy(true)
    setStatus(`Analyzing ${names.length} brand${names.length > 1 ? "s" : ""}…`)
    setInventory(null)
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
      }
      const data = await api.analyze(ctx, names, sessionId)
      setSessionId(data.session_id ?? sessionId)
      const brands = data.inventory?.brands || []
      setInventory(brands)
      // Hand the two analyzed brands to the Legibility audit (#5).
      setBrandA(names[0] || "")
      setBrandB(names[1] || "")
      const t = data.timings || {}
      setStatus(`Analyzed ${t.succeeded ?? "?"} of ${t.requested ?? "?"} brands in ${t.analyze_secs ?? "?"}s.`)
    } catch (e) {
      setStatus(`ERROR: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const ranked = useMemo(() => {
    if (!inventory) return null
    return inventory.map((b) => ({ b, v: brandValue(b, econ) })).sort((a, b) => b.v - a.v)
  }, [inventory, econ])

  return (
    <SectionCard
      step="4"
      title="Analyze brands"
      hint="Analyze the selected brands and rank them by weighted media value."
      actions={
        <Button onClick={onAnalyze} disabled={!ready || busy || selectedBrands.length === 0}>
          {busy ? "analyzing…" : `Analyze ${selectedBrands.length || ""} selected`.trim()}
        </Button>
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
        {selectedBrands.length === 0 ? (
          "Select up to 2 brands in Brand discovery (#3), then analyze them here."
        ) : (
          <>
            <span>Selected:</span>
            {selectedBrands.map((n) => (
              <Chip key={n} variant="subtle" size="sm">
                {n}
              </Chip>
            ))}
          </>
        )}
      </div>

      <StatusLine tone={status.startsWith("ERROR") ? "error" : "muted"}>{status}</StatusLine>

      {ranked && (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ranked.length === 0 && (
            <div className="text-xs text-foreground-subtle">No brands returned.</div>
          )}
          {ranked.map(({ b, v }, i) => (
            <BrandCard key={b.name} brand={b} value={v} rank={i + 1} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}

function BrandCard({ brand, value, rank }: { brand: Brand; value: number; rank: number }) {
  const apps: Moment[] = brand.appearances || []
  return (
    <div className="flex flex-col rounded-tlds-3 border border-border-secondary bg-surface-white p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <Chip variant={rank === 1 ? "success" : "subtle"} size="sm">
            #{rank}
          </Chip>
          <h3 className="font-tl-sans text-base font-semibold">{brand.name}</h3>
        </div>
        <span className="font-tl-mono text-sm text-tl-embed-dark-green">{fmtMoney(value)}</span>
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1">
        <MetricTile label="Exposure" value={`${(brand.total_seconds || 0).toFixed(0)}s`} />
        <MetricTile label="Moments" value={brand.moments_count ?? apps.length} />
        <MetricTile
          label="Outside W2W"
          value={`${(brand.outside_whistle_to_whistle_seconds || 0).toFixed(0)}s`}
        />
      </div>
      {brand.asset_types && brand.asset_types.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {brand.asset_types.map((a) => (
            <Chip key={a} variant="subtle" size="sm">
              {a}
            </Chip>
          ))}
        </div>
      )}
      {brand.legibility_notes && (
        <div className="mb-2 text-[11px] italic text-tl-analyze-dark-orange">
          {brand.legibility_notes}
        </div>
      )}
      <Timeline moments={apps} />
      <div className="mb-1 mt-1 text-[10px] uppercase tracking-wide text-foreground-subtle">
        Appearances ({apps.length})
      </div>
      <ul className="max-h-60 overflow-y-auto">
        {apps.length === 0 && <li className="text-xs text-foreground-subtle">none returned</li>}
        {apps.map((m, i) => (
          <MomentRow key={i} m={m}>
            {m.asset_type || m.description || ""}
          </MomentRow>
        ))}
      </ul>
    </div>
  )
}
