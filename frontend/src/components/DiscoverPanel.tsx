import { useEffect, useState } from "react"
import { Button, Checkbox } from "@twelvelabs-io/react"
import { api, type StoreCtx } from "../lib/api"
import { useApp } from "../state"
import { SectionCard, StatusLine } from "../ui"
import type { DiscoveryBrand } from "../lib/types"

const MAX_SELECT = 2 // Jockey's 2 req/min limit → analyze at most 2 brands

export function DiscoverPanel() {
  const {
    activeStore,
    readyVideos,
    sessionId,
    setSessionId,
    storeStatus,
    storeEpoch,
    selectedBrands,
    setSelectedBrands,
    setInventory,
  } = useApp()

  const [discovered, setDiscovered] = useState<DiscoveryBrand[] | null>(null)
  const [summary, setSummary] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDiscovered(null)
    setSummary("")
    setStatus("")
  }, [storeEpoch])

  const ready = storeStatus === "ready"

  const onDiscover = async () => {
    if (!activeStore) return
    setBusy(true)
    setStatus("Discovering brands…")
    setDiscovered(null)
    setSelectedBrands([])
    setInventory(null)
    try {
      const ctx: StoreCtx = {
        store_id: activeStore.id,
        sport: activeStore.sport,
        videos: readyVideos.map((v) => v.video_filename).filter(Boolean),
      }
      const data = await api.discover(ctx, sessionId)
      setSessionId(data.session_id ?? sessionId)
      const brands = data.discovery?.brands || []
      setDiscovered(brands)
      if (data.discovery?.summary) setSummary(data.discovery.summary)
      setStatus(`Found ${brands.length} brands in ${data.timings?.discover_secs ?? "?"}s.`)
    } catch (e) {
      setStatus(`ERROR: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (name: string, on: boolean) => {
    if (on) {
      if (selectedBrands.length >= MAX_SELECT) return
      setSelectedBrands([...selectedBrands, name])
    } else {
      setSelectedBrands(selectedBrands.filter((n) => n !== name))
    }
  }

  return (
    <SectionCard
      step="3"
      title="Brand discovery"
      hint="Find every sponsor, then pick up to 2 to analyze in the next step."
      actions={
        <Button onClick={onDiscover} disabled={!ready || busy}>
          {busy ? "discovering…" : "Discover brands"}
        </Button>
      }
    >
      <StatusLine tone={status.startsWith("ERROR") ? "error" : "muted"}>{status}</StatusLine>

      {discovered && discovered.length > 0 && (
        <div className="mt-2 rounded-tlds-2 border border-border-secondary p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-foreground-muted">
              Found {discovered.length} brands — pick up to 2 ({selectedBrands.length}/2):
            </div>
            <Button
              variant="ghosted"
              size="sm"
              onClick={() => setSelectedBrands([])}
              disabled={selectedBrands.length === 0}
            >
              clear
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-4">
            {discovered.map((b) => {
              const isSel = selectedBrands.includes(b.name)
              const disabled = !isSel && selectedBrands.length >= MAX_SELECT
              return (
                <label
                  key={b.name}
                  className={
                    "flex items-start gap-2 rounded-tlds-1 px-2 py-1 " +
                    (disabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer hover:bg-surface-body")
                  }
                >
                  <Checkbox
                    size="sm"
                    checked={isSel}
                    disabled={disabled}
                    onCheckedChange={(c) => toggle(b.name, c === true)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{b.name}</div>
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
        </div>
      )}

      {summary && <p className="mt-3 text-sm text-foreground-muted">{summary}</p>}
    </SectionCard>
  )
}
