import { useEffect, useMemo, useState } from "react"
import { Button, Checkbox, Chip, TextField } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { ALL_GAMES, useApp } from "../state"
import { SectionCard, StatusLine } from "../ui"
import type { DiscoveryBrand } from "../lib/types"

/**
 * The brand surface, for both modes.
 *
 * With the demo locked, every brand in the pre-baked scope is listed and the
 * **analyzed** (run) ones are selectable; un-analyzed brands are greyed
 * ("detected · not analyzed") so the full inventory is visible without offering
 * data that doesn't exist.
 *
 * With `DEMO_MODE=False` there is no pre-baked scope, so **Find brands** runs
 * discovery against the loaded collection and fills the list. Selection drives
 * the Analyze + Legibility panels either way.
 */
export function BrandExplorerPanel() {
  const {
    mode,
    activeStore,
    readyVideos,
    gameId,
    assetId,
    videos,
    sessionId,
    setSessionId,
    scopeDiscovery,
    setScopeDiscovery,
    scopeInventory,
    viewBrands,
    setViewBrands,
    scopeLoading,
  } = useApp()
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [finding, setFinding] = useState(false)
  const [findError, setFindError] = useState("")
  // A live re-run replaces the pre-baked brand list, so every brand it
  // returns becomes selectable even in the locked demo.
  const [ranLive, setRanLive] = useState(false)

  // Locked demo loads its brands from the committed fixtures; unlocked has to
  // ask Jockey, because an arbitrary collection has no pre-baked scope.
  const canDiscover = mode !== "demo"

  const onFindBrands = async (opts: { live?: boolean } = {}) => {
    if (!activeStore) return
    setFinding(true)
    setFindError("")
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
        game_id: gameId === ALL_GAMES ? undefined : gameId,
        asset_id: assetId || undefined,
        asset_label:
          videos.find((v) => v.asset_id === assetId)?.video_filename || undefined,
      }
      const data = await api.discover(ctx, sessionId, opts.live)
      setSessionId(data.session_id ?? sessionId)
      setScopeDiscovery(data.discovery?.brands ?? [])
      setViewBrands([])
      if (opts.live) setRanLive(true)
    } catch (e) {
      setFindError((e as Error).message)
    } finally {
      setFinding(false)
    }
  }
  // Each scope opens collapsed (analyzed brands only) with a fresh search.
  useEffect(() => {
    setShowAll(false)
    setQuery("")
  }, [scopeInventory])

  // Which detected brands were actually analyzed (have data to view).
  const analyzedSet = useMemo(
    () => new Set(scopeInventory.map((b) => b.name.toLowerCase())),
    [scopeInventory],
  )
  const analyzedNames = useMemo(() => scopeInventory.map((b) => b.name), [scopeInventory])
  // Locked demo: only pre-analyzed brands. Unlocked: anything discovered.
  const openSelection = canDiscover || ranLive
  const selectableNames = openSelection ? scopeDiscovery.map((b) => b.name) : analyzedNames

  // Analyzed brands first (in exposure order from the fixture), then the rest
  // alphabetically. Guard against a brand appearing only in the analyze fixture.
  const ordered = useMemo<DiscoveryBrand[]>(() => {
    const byName = new Map(scopeDiscovery.map((b) => [b.name.toLowerCase(), b]))
    const run = scopeInventory.map(
      (b) => byName.get(b.name.toLowerCase()) ?? { name: b.name, asset_types: b.asset_types },
    )
    const rest = scopeDiscovery
      .filter((b) => !analyzedSet.has(b.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
    return [...run, ...rest]
  }, [scopeDiscovery, scopeInventory, analyzedSet])

  const q = query.trim().toLowerCase()
  // Default view = only the analyzed (run) brands; "show all" reveals the greyed
  // detected-but-not-analyzed ones. A search always spans the full list.
  const filtered = useMemo(() => {
    if (q) return ordered.filter((b) => b.name.toLowerCase().includes(q))
    if (showAll || openSelection) return ordered
    return ordered.filter((b) => analyzedSet.has(b.name.toLowerCase()))
  }, [ordered, q, showAll, analyzedSet, openSelection])

  const toggle = (name: string, on: boolean) =>
    setViewBrands(on ? [...viewBrands, name] : viewBrands.filter((n) => n !== name))

  const detected = scopeDiscovery.length
  const analyzed = analyzedNames.length
  const hiddenCount = detected - analyzed
  const showSearch = detected > 15

  return (
    <SectionCard
      step="3"
      title="Brands"
      hint={
        canDiscover
          ? "Find every sponsor in this collection, then pick the ones to analyze."
          : "Every brand detected in this scope. Pick the analyzed ones to view their exposure, economics, legibility and reel."
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onFindBrands({ live: !canDiscover })}
            disabled={finding || !activeStore}
            title="Runs brand discovery against the selected broadcast. Takes 1–3 minutes."
          >
            {finding ? "Finding brands…" : canDiscover ? "Find brands" : "Re-run brands"}
          </Button>
          <Button
            variant="ghosted"
            size="sm"
            onClick={() => setViewBrands(selectableNames)}
            disabled={viewBrands.length === selectableNames.length}
          >
            select all
          </Button>
          <Button
            variant="ghosted"
            size="sm"
            onClick={() => setViewBrands([])}
            disabled={viewBrands.length === 0}
          >
            clear
          </Button>
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-foreground-subtle">
          {scopeLoading ? (
            "Loading…"
          ) : (
            <>
              <span className="font-tl-mono text-foreground-body">{detected}</span> detected ·{" "}
              <span className="font-tl-mono text-foreground-body">{analyzed}</span> analyzed ·{" "}
              <span className="font-tl-mono text-foreground-body">{viewBrands.length}</span> viewing
            </>
          )}
        </div>
        {showSearch && (
          <TextField
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search brands…"
            className="w-56"
          />
        )}
      </div>

      {findError && <StatusLine tone="error">Find brands failed: {findError}</StatusLine>}

      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b) => {
          const isRun = openSelection || analyzedSet.has(b.name.toLowerCase())
          const isSel = viewBrands.includes(b.name)
          return (
            <label
              key={b.name}
              className={
                "flex items-start gap-2 rounded-tlds-1 px-2 py-1 " +
                (isRun ? "cursor-pointer hover:bg-surface-body" : "cursor-default opacity-45")
              }
              title={isRun ? "" : "Detected, but not analyzed in this pre-baked scope"}
            >
              <Checkbox
                size="sm"
                checked={isRun && isSel}
                disabled={!isRun}
                onCheckedChange={(c) => isRun && toggle(b.name, c === true)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-sm">
                  <span className="truncate">{b.name}</span>
                  {!isRun && (
                    <Chip variant="subtle" size="sm">
                      not analyzed
                    </Chip>
                  )}
                </div>
                {b.asset_types && b.asset_types.length > 0 && (
                  <div
                    className="truncate text-[10px] text-foreground-subtle"
                    title={b.asset_types.join(", ")}
                  >
                    {b.asset_types.join(", ")}
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </div>
      {!q && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-xs font-semibold text-foreground-status-info hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${detected} detected (+${hiddenCount} not analyzed)`}
        </button>
      )}
      {!scopeLoading && detected === 0 && (
        <div className="text-xs text-foreground-subtle">No brands cached for this scope.</div>
      )}
    </SectionCard>
  )
}
