import { useCallback, useEffect, useState } from "react"
import {
  Button,
  Chip,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextField,
} from "@twelvelabs-io/react"
import { api } from "../lib/api"
import { useApp } from "../state"
import { SectionCard, StatusLine } from "../ui"
import type { StoreSummary, Video } from "../lib/types"

export function FootagePanel() {
  const {
    mode,
    demo,
    hasKey,
    keyTick,
    activeStore,
    setActiveStore,
    videos,
    storeStatus,
    refreshStore,
    sports,
    defaultSport,
  } = useApp()

  const [stores, setStores] = useState<StoreSummary[]>([])
  const [picked, setPicked] = useState<string>("")
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSport, setNewSport] = useState(defaultSport)
  const [assetIds, setAssetIds] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => setNewSport(defaultSport), [defaultSport])

  const loadStores = useCallback(
    async (selectId?: string) => {
      if (!hasKey) {
        setStores([])
        return
      }
      try {
        const { stores } = await api.listStores()
        setStores(stores || [])
        if (selectId && stores.find((s) => s.id === selectId)) setPicked(selectId)
        else if (stores.length && !picked) setPicked(stores[0].id)
      } catch {
        /* leave existing */
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasKey],
  )

  useEffect(() => {
    void loadStores(activeStore?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyTick])

  const onCreate = async () => {
    if (!newName.trim()) return
    setBusy("create")
    setError("")
    try {
      const { id, sport } = await api.createStore(newName.trim(), newSport)
      setActiveStore({ id, sport })
      setNewName("")
      setCreating(false)
      await loadStores(id)
      await refreshStore()
    } catch (e) {
      setError(`Could not create collection: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const onLoad = async () => {
    if (!picked) return
    setBusy("load")
    setError("")
    try {
      const data = await api.useStore(picked)
      setActiveStore({ id: picked, sport: data.sport })
      await refreshStore()
    } catch (e) {
      setError(`Could not load collection: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const onAttach = async () => {
    if (!activeStore) return
    const ids = assetIds.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
    if (!ids.length) return
    setBusy("attach")
    setError("")
    try {
      const data = await api.addAssets(activeStore.id, ids)
      const errs = (data.added || []).filter((a) => a.status === "error")
      if (errs.length) setError(`Some assets failed: ${errs.map((e) => e.asset_id).join(", ")}`)
      setAssetIds("")
      await refreshStore()
    } catch (e) {
      setError(`Attach failed: ${(e as Error).message}`)
    } finally {
      setBusy(null)
    }
  }

  const statusChip = {
    idle: <Chip variant="subtle">idle</Chip>,
    empty: <Chip variant="subtle">empty</Chip>,
    indexing: <Chip variant="warning">indexing…</Chip>,
    ready: <Chip variant="success">ready</Chip>,
    failed: <Chip variant="error">failed</Chip>,
  }[storeStatus]

  return (
    <SectionCard
      step="1"
      title="Footage"
      hint={
        mode === "demo"
          ? "Preloaded demo collection — locked."
          : "Pick or create a collection, then add broadcasts to index."
      }
      actions={
        <div className="flex items-center gap-2">
          {statusChip}
          {mode === "byok" && activeStore && (
            <Button variant="ghosted" size="sm" onClick={() => setActiveStore(null)}>
              reset
            </Button>
          )}
        </div>
      }
    >
      {mode === "demo" && (
        <div className="rounded-tlds-2 border border-border-secondary bg-surface-body p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">
                Collection (locked)
              </div>
              <div className="font-tl-sans text-sm font-semibold">
                {demo?.name || "Demo collection"}
              </div>
            </div>
            <Chip variant="subtle" size="sm">
              demo key
            </Chip>
          </div>
          {demo && !demo.enabled && (
            <p className="mt-2 text-xs text-foreground-status-error">
              Demo mode isn't configured on this server (SPONSOR_SPOTLIGHT_TL_KEY unset).
            </p>
          )}
        </div>
      )}

      {mode === "byok" && (
        <>
      {/* Collection picker */}
      <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">Collection</div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Select value={picked} onValueChange={setPicked} disabled={!hasKey || stores.length === 0}>
          <SelectTrigger size="medium" className="min-w-[18rem] flex-1">
            <SelectValue placeholder={hasKey ? "Select a collection" : "enter your API key first"} />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name || s.id} ({s.item_count} {s.item_count === 1 ? "video" : "videos"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onLoad} disabled={!hasKey || !picked || busy === "load"}>
          {busy === "load" ? "loading…" : "Load"}
        </Button>
        <Button variant="outlined-gray" onClick={() => setCreating((v) => !v)} disabled={!hasKey}>
          + New
        </Button>
      </div>

      {creating && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TextField
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="new collection name, e.g. Bundesliga 2024"
            className="min-w-[16rem] flex-1"
          />
          <Select value={newSport} onValueChange={setNewSport}>
            <SelectTrigger size="medium" className="min-w-[10rem]">
              <SelectValue placeholder="sport" />
            </SelectTrigger>
            <SelectContent>
              {sports.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onCreate} disabled={!newName.trim() || busy === "create"}>
            {busy === "create" ? "creating…" : "Create"}
          </Button>
        </div>
      )}

      {/* Add videos */}
      <div className="mt-5 border-t border-border-secondary pt-4">
        <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">
          Add videos{" "}
          <span className="normal-case text-foreground-subtle">
            {activeStore ? "→ into the current collection" : "→ load or create a collection first"}
          </span>
        </div>
        <p className="mt-1 max-w-prose text-xs text-foreground-muted">
          Upload broadcasts in the{" "}
          <a
            className="text-foreground-status-info underline-offset-2 hover:underline"
            href="https://playground.twelvelabs.io/assets"
            target="_blank"
            rel="noreferrer"
          >
            TwelveLabs Assets dashboard
          </a>
          , then add them to this collection there and click Load — or paste their asset IDs below to
          attach &amp; index them here.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TextField
            value={assetIds}
            onChange={(e) => setAssetIds(e.target.value)}
            placeholder="asset IDs, comma- or newline-separated"
            className="min-w-[18rem] flex-1 font-tl-mono"
          />
          <Button onClick={onAttach} disabled={!hasKey || !activeStore || !assetIds.trim() || busy === "attach"}>
            {busy === "attach" ? "attaching…" : "Attach & index"}
          </Button>
        </div>
      </div>

      {activeStore && (
        <div className="mt-3 font-tl-mono text-[11px] text-foreground-subtle">
          ks: {activeStore.id}
          {activeStore.sport ? ` · sport: ${activeStore.sport}` : ""} · {videos.length} video(s)
        </div>
      )}
        </>
      )}

      <VideoRoster videos={videos} />
      {error && (
        <div className="mt-2">
          <StatusLine tone="error">{error}</StatusLine>
        </div>
      )}
    </SectionCard>
  )
}

function VideoRoster({ videos }: { videos: Video[] }) {
  if (!videos.length) return null
  return (
    <div className="mt-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-foreground-subtle">
        Videos in this knowledge store ({videos.length})
      </div>
      <div className="space-y-0.5">
        {videos.map((v) => {
          const variant =
            v.status === "ready" ? "success" : v.status === "failed" ? "error" : "warning"
          return (
            <div key={v.asset_id} className="flex items-center gap-2 py-0.5">
              <Chip variant={variant} size="sm">
                {v.status || "pending"}
              </Chip>
              <span className="font-tl-mono text-xs text-foreground-body">
                {v.video_filename || v.asset_id}
              </span>
              {v.error && (
                <span className="text-xs text-foreground-status-error">{v.error.split("\n")[0]}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
