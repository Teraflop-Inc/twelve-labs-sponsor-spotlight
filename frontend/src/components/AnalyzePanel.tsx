import { useMemo, useState } from "react"
import { Button, Chip } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import {
  brandEconomics,
  CONTEXT_WEIGHTS,
  fmtMoney,
  legibility01,
  resolveEcon,
  shareOfVoice,
  type BrandEconomics,
} from "../lib/econ"
import { SOURCE_LABEL } from "../lib/econData"
import { ALL_GAMES, useApp } from "../state"
import { MetricTile, MomentRow, SectionCard, SourceBadge, StatusLine } from "../ui"
import { Timeline } from "./Timeline"
import type { Brand, Moment } from "../lib/types"

/** Stable DOM id for a brand card, so the Viewing chips can scroll to it. */
const brandDomId = (name: string) => "brand-" + name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

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
  const legReport = demoView ? scopeLegibility : legibility

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

  // Resolve the scope's economics inputs once (audience curve + spot rate, each
  // source-tagged), then compute EMV / ROI / Clean-Exposure per brand and
  // Share-of-Voice across the set.
  const resolved = useMemo(() => {
    const apps: Moment[] = []
    for (const b of displayBrands ?? []) apps.push(...(b.appearances || b.top_moments || []))
    return resolveEcon(econ, gameId === ALL_GAMES ? null : gameId, apps)
  }, [displayBrands, econ, gameId])

  const ranked = useMemo(() => {
    if (!displayBrands) return null
    const withEcon = displayBrands.map((b) => ({
      b,
      ec: brandEconomics(b, resolved, legibility01(legReport, b.name)),
    }))
    const sov = shareOfVoice(withEcon.map((x) => x.ec.emv))
    return withEcon
      .map((x, i) => ({ ...x, sov: sov[i] }))
      .sort((a, b) => b.ec.emv - a.ec.emv)
  }, [displayBrands, resolved, legReport])

  const gameLabel =
    gameId === ALL_GAMES ? "All games" : games.find((g) => g.id === gameId)?.label ?? gameId
  const reelScope = gameId === ALL_GAMES ? "all" : gameId

  // Card expand/collapse is lifted here so the Viewing chips can open + scroll
  // to a brand. All start collapsed.
  const [openBrands, setOpenBrands] = useState<Record<string, boolean>>({})
  const toggleBrand = (name: string) =>
    setOpenBrands((m) => ({ ...m, [name]: !m[name] }))
  const goToBrand = (name: string) => {
    setOpenBrands((m) => ({ ...m, [name]: true }))
    setTimeout(
      () => document.getElementById(brandDomId(name))?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    )
  }

  const [reportBusy, setReportBusy] = useState<string | null>(null)
  const onReport = async (b: Brand) => {
    setReportBusy(b.name)
    try {
      const value = Math.round(brandEconomics(b, resolved, legibility01(legReport, b.name)).emv)
      const scopeKey = gameId === ALL_GAMES ? "aggregate" : gameId
      const html = await api.report({
        brand: b.name,
        game_ids: gameId === ALL_GAMES ? [] : [gameId],
        media_values: { [scopeKey]: value },
        total_media_value: value,
        context_weights: CONTEXT_WEIGHTS,
        generated_note: `Scope: ${gameLabel}.`,
        sources: {
          audience: resolved.audience.source,
          rate: resolved.rate.source,
          rights_fee: resolved.rightsFeeSource,
        },
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
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-subtle">
          <span className="inline-flex items-center gap-1">
            Audience <SourceBadge source={resolved.audience.source} />
          </span>
          <span className="inline-flex items-center gap-1">
            Rate ${resolved.rate.value.toLocaleString()}/:30 <SourceBadge source={resolved.rate.source} />
          </span>
          <span className="text-foreground-subtle">
            EMV = seconds × legibility × clutter × audience × rate
          </span>
        </div>
      )}

      {ranked && (
        <div className="mt-3 flex flex-col gap-2">
          {ranked.length === 0 && (
            <div className="text-xs text-foreground-subtle">No brands returned.</div>
          )}
          {ranked.map(({ b, ec, sov }, i) => (
            <BrandCard
              key={b.name}
              brand={b}
              ec={ec}
              sov={sov}
              rank={i + 1}
              open={Boolean(openBrands[b.name])}
              onToggle={() => toggleBrand(b.name)}
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
  ec,
  sov,
  rank,
  open,
  onToggle,
  onReport,
  onReel,
  reportBusy,
  hasReel,
}: {
  brand: Brand
  ec: BrandEconomics
  sov: number
  rank: number
  open: boolean
  onToggle: () => void
  onReport: () => void
  onReel: () => void
  reportBusy: boolean
  hasReel: boolean
}) {
  const apps: Moment[] = brand.appearances || []
  return (
    <div
      id={brandDomId(brand.name)}
      className="scroll-mt-24 rounded-tlds-3 border border-border-secondary bg-surface-white"
    >
      {/* Header row — click anywhere to minimize/maximize the brand. */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 pt-3 text-left"
        aria-expanded={open}
      >
        <span className="w-3 shrink-0 font-tl-mono text-xs text-foreground-subtle">
          {open ? "▾" : "▸"}
        </span>
        <Chip variant={rank === 1 ? "success" : "subtle"} size="sm">
          #{rank}
        </Chip>
        <h3 className="truncate font-tl-sans text-base font-semibold">{brand.name}</h3>
        <span className="ml-auto font-tl-mono text-sm text-tl-embed-dark-green" title="Estimated Media Value">
          {fmtMoney(ec.emv)}
        </span>
      </button>

      {/* Summary tiles stay visible when minimized. */}
      <div className="grid grid-cols-3 gap-1 p-3">
        <MetricTile label="Exposure" value={`${(brand.total_seconds || 0).toFixed(0)}s`} />
        <MetricTile label="Moments" value={brand.moments_count ?? apps.length} />
        <MetricTile
          label="Outside W2W"
          value={`${(brand.outside_whistle_to_whistle_seconds || 0).toFixed(0)}s`}
        />
        <MetricTile label="ROI" value={ec.roi == null ? "—" : `${ec.roi.toFixed(2)}×`} accent />
        <MetricTile label="Share of voice" value={`${sov.toFixed(1)}%`} />
        <MetricTile
          label="Clean exposure"
          value={ec.cleanExposurePct == null ? "—" : `${ec.cleanExposurePct.toFixed(0)}%`}
        />
      </div>

      {open && (
        <div className="px-3 pb-3">
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
      )}
    </div>
  )
}
