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
import { momentTags } from "../lib/moments"
import { ALL_GAMES, useApp } from "../state"
import {
  MetricTile,
  MomentRow,
  ProvenanceBadge,
  ReRunButton,
  SectionCard,
  SourceBadge,
  StatusLine,
} from "../ui"
import { CTX_COLOR, ctxLabel, Timeline } from "./Timeline"
import type { Brand, Moment, Provenance } from "../lib/types"

/** Stable DOM id for a brand card, so the Viewing chips can scroll to it. */
const brandDomId = (name: string) => "brand-" + name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()

// One Jockey call per brand, against a ~2 req/min beta limit.
const MAX_LIVE_BRANDS = 2

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
  const [prov, setProv] = useState<Provenance | null>(null)
  // A live run in demo mode replaces the pre-baked scope view with its result.
  const [liveRun, setLiveRun] = useState(false)

  const ready = storeStatus === "ready"
  const demoView = mode === "demo"

  // Demo = explore the pre-baked scope filtered to the chosen brands; BYO = the
  // generated `inventory`. Legibility/econ sources follow the same split.
  // Once a live run completes in demo mode we show its result instead, so the
  // "Run live" button visibly replaces the cached numbers.
  const displayBrands =
    demoView && !liveRun ? scopeInventory.filter((b) => viewBrands.includes(b.name)) : inventory

  // Which brands a run applies to: the demo surface drives off the brands being
  // viewed (BrandExplorerPanel), BYO off the discover selection.
  //
  // Capped either way: analyze fans out one Jockey call per brand and the beta
  // allows ~2 requests/minute, so running the full viewed set (often 5+) is a
  // guaranteed 429 storm. The backoff recovers, but it turns a demo into a
  // three-minute wait.
  const runBrands = (demoView ? viewBrands : selectedBrands.filter(Boolean)).slice(
    0,
    MAX_LIVE_BRANDS,
  )
  const cappedFrom = demoView ? viewBrands.length : selectedBrands.filter(Boolean).length
  const legReport = demoView ? scopeLegibility : legibility

  const onAnalyze = async (opts: { live?: boolean } = {}) => {
    const names = runBrands
    if (!names.length || !activeStore) return
    if (opts.live) setLiveRun(true)
    setBusy(true)
    setStatus(`Analyzing ${names.length} brand${names.length > 1 ? "s" : ""}…`)
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
      setProv(data.provenance ?? null)
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

  // Tag filter — POSITIVE/solo: click a tag (e.g. `goal`) to show ONLY moments
  // carrying it in the Timeline + Appearances list. Click more to widen the
  // selection (OR); click again to remove; "all" clears. Economics above are
  // never touched. Counts are computed across every displayed brand so the row
  // is stable regardless of what's selected.
  const [activeCtx, setActiveCtx] = useState<Set<string>>(new Set())
  const ctxCounts = useMemo(() => {
    // Count per TAG (a moment contributes to each of its events + its view), so
    // a goal+close-up moment shows under both the "goal" and "close-up" chips.
    const counts = new Map<string, number>()
    for (const b of displayBrands ?? [])
      for (const m of b.appearances || b.top_moments || [])
        for (const t of momentTags(m)) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [displayBrands])
  const toggleCtx = (ctx: string) =>
    setActiveCtx((prev) => {
      const next = new Set(prev)
      if (next.has(ctx)) next.delete(ctx)
      else next.add(ctx)
      return next
    })
  const anyActive = activeCtx.size > 0

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
        demoView ? (
          runBrands.length > 0 && (
            <ReRunButton
              onClick={() => onAnalyze({ live: true })}
              disabled={!ready || busy}
              busy={busy}
              scope={
                cappedFrom > runBrands.length
                  ? `${runBrands.length} of ${cappedFrom} brands`
                  : undefined
              }
            />
          )
        ) : (
          <Button onClick={() => onAnalyze()} disabled={!ready || busy || runBrands.length === 0}>
            {busy ? "analyzing…" : `Analyze ${runBrands.length || ""} selected`.trim()}
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
        <span className="inline-flex items-center gap-1.5">
          {status}
          {prov && status && !status.startsWith("ERROR") && <ProvenanceBadge prov={prov} />}
        </span>
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

      {ranked && ranked.length > 0 && ctxCounts.length > 1 && (
        <div className="mt-3 rounded-tlds-2 border border-border-secondary bg-surface-secondary/40 p-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground-body">
              Filter by tag
            </span>
            <span className="text-[10px] text-foreground-subtle">
              {anyActive ? "showing only selected — click to add/remove" : "click a tag to show only those moments"}
            </span>
            {anyActive && (
              <Button size="sm" variant="ghosted" onClick={() => setActiveCtx(new Set())}>
                clear ({activeCtx.size})
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCtx(new Set())}
              aria-pressed={!anyActive}
              title="Show all moments"
              className={`inline-flex items-center rounded-tlds-1 border px-2 py-1 text-xs font-medium transition-colors ${
                !anyActive
                  ? "border-tl-embed-dark-green bg-tl-embed-dark-green text-white"
                  : "border-border-secondary bg-surface-white text-foreground-body hover:border-foreground-subtle"
              }`}
            >
              All
            </button>
            {ctxCounts.map(([ctx, count]) => {
              const active = activeCtx.has(ctx)
              const color = CTX_COLOR[ctx] || CTX_COLOR.other
              return (
                <button
                  key={ctx}
                  type="button"
                  onClick={() => toggleCtx(ctx)}
                  aria-pressed={active}
                  title={active ? `Stop filtering ${ctxLabel(ctx)}` : `Show only ${ctxLabel(ctx)} moments`}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-tlds-1 border px-2 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-transparent text-white"
                      : "border-border-secondary bg-surface-white text-foreground-body hover:border-foreground-subtle"
                  }`}
                  style={active ? { background: color } : undefined}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: active ? "rgba(255,255,255,0.9)" : color }}
                  />
                  {ctxLabel(ctx)}
                  <span className={active ? "font-tl-mono text-white/80" : "font-tl-mono text-foreground-subtle"}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
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
              activeCtx={activeCtx}
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
  activeCtx,
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
  activeCtx: Set<string>
  open: boolean
  onToggle: () => void
  onReport: () => void
  onReel: () => void
  reportBusy: boolean
  hasReel: boolean
}) {
  const allApps: Moment[] = brand.appearances || []
  // Positive/solo tag filter: with nothing selected, show every moment; once
  // tags are active, keep only moments carrying at least one of them (OR) — so
  // selecting "goal" shows just the goal moments. Summary tiles + economics
  // above always stay on the full set.
  const apps = useMemo(
    () =>
      activeCtx.size === 0
        ? allApps
        : allApps.filter((m) => momentTags(m).some((t) => activeCtx.has(t))),
    [allApps, activeCtx],
  )
  const hiddenCount = allApps.length - apps.length
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
            {hiddenCount > 0 && (
              <span className="ml-1 normal-case text-foreground-subtle">
                · {hiddenCount} filtered out
              </span>
            )}
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {apps.length === 0 && (
              <li className="text-xs text-foreground-subtle">
                {hiddenCount > 0 ? "no moments match the selected tag(s)" : "none returned"}
              </li>
            )}
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
