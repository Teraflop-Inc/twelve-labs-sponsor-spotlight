import { useEffect, useMemo, useState } from "react"
import { Button, Checkbox, Chip, TextField } from "@twelvelabs-io/react"
import { useApp } from "../state"
import { SectionCard } from "../ui"
import type { DiscoveryBrand } from "../lib/types"

/**
 * Demo explore surface: every brand detected in the current scope, with the
 * **analyzed** (run) ones selectable to view. Un-analyzed brands are shown greyed
 * ("detected · not analyzed") so the full inventory is visible without offering
 * data that doesn't exist. Selection drives the Analyze + Legibility panels.
 */
export function BrandExplorerPanel() {
  const {
    scopeDiscovery,
    scopeInventory,
    viewBrands,
    setViewBrands,
    scopeLoading,
  } = useApp()
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
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
    return showAll ? ordered : ordered.filter((b) => analyzedSet.has(b.name.toLowerCase()))
  }, [ordered, q, showAll, analyzedSet])

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
      hint="Every brand detected in this scope. Pick the analyzed ones to view their exposure, economics, legibility and reel."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghosted"
            size="sm"
            onClick={() => setViewBrands(analyzedNames)}
            disabled={viewBrands.length === analyzed}
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

      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((b) => {
          const isRun = analyzedSet.has(b.name.toLowerCase())
          const isSel = viewBrands.includes(b.name)
          return (
            <label
              key={b.name}
              className={
                "flex items-start gap-2 rounded-tlds-1 px-2 py-1 " +
                (isRun ? "cursor-pointer hover:bg-surface-body" : "cursor-default opacity-45")
              }
              title={isRun ? "" : "Detected but not analyzed in this demo scope"}
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
