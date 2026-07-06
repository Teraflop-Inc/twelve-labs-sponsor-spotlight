import { useMemo, useState } from "react"
import { Button, Chip } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { brandValue, fmtMoney } from "../lib/econ"
import { exportData } from "../lib/export"
import { ALL_GAMES, useApp } from "../state"
import { MetricTile, MomentRow, SectionCard, StatusLine } from "../ui"
import { Timeline } from "./Timeline"
import type { Brand, Moment } from "../lib/types"

export function AnalyzePanel() {
  const {
    mode,
    activeStore,
    readyVideos,
    sessionId,
    setSessionId,
    econ,
    storeStatus,
    gameId,
    games,
    selectedBrands,
    inventory,
    setInventory,
    legibility,
    setBrandA,
    setBrandB,
    demoCached,
    scopeInventory,
    scopeLegibility,
    scopeReels,
    viewBrands,
    playerRef,
  } = useApp()

  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  const ready = storeStatus === "ready"
  const demoView = mode === "demo"
  const showCacheHint = mode === "demo" && demoCached

  // Demo = explore the pre-baked scope filtered to the chosen brands; BYO = the
  // generated `inventory`. Legibility/econ sources follow the same split.
  const displayBrands = demoView
    ? scopeInventory.filter((b) => viewBrands.includes(b.name))
    : inventory
  const exportLegibility = demoView ? scopeLegibility : legibility

  const onAnalyze = async (opts: { live?: boolean } = {}) => {
    const names = selectedBrands.filter(Boolean)
    if (!names.length || !activeStore) return
    setBusy(true)
    setStatus(
      `Analyzing ${names.length} brand${names.length > 1 ? "s" : ""}${opts.live ? " (live)" : ""}…`,
    )
    setInventory(null)
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
        game_id: gameId === ALL_GAMES ? undefined : gameId,
      }
      const data = await api.analyze(ctx, names, sessionId, opts.live)
      setSessionId(data.session_id ?? sessionId)
      const brands = data.inventory?.brands || []
      setInventory(brands)
      setFromCache(showCacheHint && !opts.live)
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
    if (!displayBrands) return null
    return displayBrands.map((b) => ({ b, v: brandValue(b, econ) })).sort((a, b) => b.v - a.v)
  }, [displayBrands, econ])

  const scopeLabel =
    gameId === ALL_GAMES ? "all-games" : games.find((g) => g.id === gameId)?.label ?? gameId
  const reelScope = gameId === ALL_GAMES ? "all" : gameId

  const [reportBusy, setReportBusy] = useState<string | null>(null)
  const onReport = async (b: Brand) => {
    setReportBusy(b.name)
    try {
      const value = Math.round(brandValue(b, econ))
      const scopeKey = gameId === ALL_GAMES ? "aggregate" : gameId
      const html = await api.report({
        brand: b.name,
        game_ids: gameId === ALL_GAMES ? [] : [gameId],
        media_values: { [scopeKey]: value },
        total_media_value: value,
        generated_note: `Scope: ${scopeLabel}.`,
      })
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (e) {
      setStatus(`Report error: ${(e as Error).message}`)
    } finally {
      setReportBusy(null)
    }
  }
  const onReel = (b: Brand) => {
    // Prefer playing the reel in the sticky player (demo has the Blob URL);
    // fall back to the redirect endpoint in a new tab if we don't have a URL.
    const reel = scopeReels[b.name.toLowerCase()]
    if (reel?.url) {
      playerRef.current?.playUrl(reel.url, `${b.name} — highlight reel`)
    } else {
      window.open(api.reelUrl(reelScope, b.name), "_blank")
    }
  }

  return (
    <SectionCard
      step="4"
      title="Analyze brands"
      hint={
        demoView
          ? "Weighted media value for the brands you selected, ranked."
          : "Analyze the selected brands and rank them by weighted media value."
      }
      actions={
        demoView ? undefined : (
          <Button onClick={() => onAnalyze()} disabled={!ready || busy || selectedBrands.length === 0}>
            {busy ? "analyzing…" : `Analyze ${selectedBrands.length || ""} selected`.trim()}
          </Button>
        )
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
        {demoView ? (
          viewBrands.length === 0 ? (
            "Select analyzed brands in Brands (#3) to view their exposure and value."
          ) : (
            <>
              <span>Viewing:</span>
              {(displayBrands ?? []).map((b) => (
                <Chip key={b.name} variant="subtle" size="sm">
                  {b.name}
                </Chip>
              ))}
            </>
          )
        ) : selectedBrands.length === 0 ? (
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

      <StatusLine tone={status.startsWith("ERROR") ? "error" : "muted"}>
        {status}
        {fromCache && status && (
          <span className="ml-1 text-foreground-subtle">· cached demo result</span>
        )}
      </StatusLine>

      {ranked && ranked.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-tlds-2 border border-border-secondary bg-surface-body p-2">
          <span className="text-xs text-foreground-subtle">
            Export <span className="font-tl-mono">{scopeLabel}</span> — per-game rows + totals:
          </span>
          <Button
            size="sm"
            variant="outlined-gray"
            onClick={() => exportData(displayBrands ?? [], exportLegibility, econ, "csv", scopeLabel)}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="outlined-gray"
            onClick={() => exportData(displayBrands ?? [], exportLegibility, econ, "json", scopeLabel)}
          >
            JSON
          </Button>
        </div>
      )}

      {ranked && (
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ranked.length === 0 && (
            <div className="text-xs text-foreground-subtle">No brands returned.</div>
          )}
          {ranked.map(({ b, v }, i) => (
            <BrandCard
              key={b.name}
              brand={b}
              value={v}
              rank={i + 1}
              onReport={() => onReport(b)}
              onReel={() => onReel(b)}
              reportBusy={reportBusy === b.name}
              hasReel={!demoView || Boolean(scopeReels[b.name.toLowerCase()])}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}

function BrandCard({
  brand,
  value,
  rank,
  onReport,
  onReel,
  reportBusy,
  hasReel,
}: {
  brand: Brand
  value: number
  rank: number
  onReport: () => void
  onReel: () => void
  reportBusy: boolean
  hasReel: boolean
}) {
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
      <div className="mb-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outlined-gray" onClick={onReport} disabled={reportBusy}>
          {reportBusy ? "building…" : "Report"}
        </Button>
        {hasReel && (
          <Button size="sm" variant="outlined-gray" onClick={onReel}>
            ▶ Play reel
          </Button>
        )}
      </div>
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
