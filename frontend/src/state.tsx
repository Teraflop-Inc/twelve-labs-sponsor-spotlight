import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api } from "./lib/api"
import { DEFAULT_ECON, loadEcon, saveEcon, type EconState } from "./lib/econ"
import type {
  ActiveStore,
  Brand,
  DemoInfo,
  DiscoveryBrand,
  GameOption,
  LegibilityReport,
  ReelInfo,
  SportProfile,
  Video,
} from "./lib/types"

/** Sentinel game id for the whole-collection ("All games") scope. */
export const ALL_GAMES = "all"

/**
 * The single game the demo is pinned to. ars-tot-2018 has the strongest sponsor
 * detection accuracy (100% reel-QC), so the demo shows only this broadcast; the
 * other games' data still ships (fixtures + ALL_GAMES plumbing) but the picker
 * is hidden. Set to `ALL_GAMES` to restore the multi-game dropdown.
 */
export const PINNED_GAME_ID = "ars-tot-2018"

const STORE_LS = "sponsor-spotlight-store-v2" // BYO-key user's chosen collection

export type Mode = "demo" | "byok"

/** Imperative handle the Player registers so any panel can drive playback. */
export interface PlayerHandle {
  seekTo(sec: number, videoFilename?: string): void
  loadAsset(assetId: string): void
  /** Play an arbitrary MP4 URL (e.g. a highlight reel) in the sticky player. */
  playUrl(url: string, label?: string): void
}

interface AppContextValue {
  // --- mode (locked server-key demo vs. bring-your-own-key) ---
  mode: Mode
  demo: DemoInfo | null

  // --- knowledge store (held client-side; server is stateless) ---
  activeStore: ActiveStore | null
  setActiveStore(s: ActiveStore | null): void // BYO mode only; no-op in demo
  videos: Video[]
  readyVideos: Video[]
  refreshStore(): Promise<void>
  storeStatus: "idle" | "empty" | "indexing" | "ready" | "failed"

  // --- sports ---
  sports: SportProfile[]
  defaultSport: string

  // --- jockey session (multi-turn) ---
  sessionId: string | null
  setSessionId(id: string | null): void

  // --- economics ---
  econ: EconState
  setEcon(next: EconState | ((prev: EconState) => EconState)): void

  // --- per-game scope (5 games + "all") ---
  gameId: string
  /** Broadcast to scope to (TwelveLabs asset id); "" = every video. */
  assetId: string
  setAssetId(id: string): void
  setGameId(id: string): void
  games: GameOption[]

  // --- brand inventory (BYO generate flow: Discover #3 → Analyze #4) ---
  selectedBrands: string[]
  setSelectedBrands(names: string[]): void
  inventory: Brand[] | null
  setInventory(b: Brand[] | null): void
  // Legibility audit report (BYO; shared with the export/report tools).
  legibility: LegibilityReport | null
  setLegibility(r: LegibilityReport | null): void

  // --- the two analyzed brands (BYO Analyze #4 sets; Legibility #5 audits) ---
  brandA: string
  brandB: string
  setBrandA(v: string): void
  setBrandB(v: string): void

  // --- demo explore: view the pre-baked outputs for the selected scope ---
  demoBrands: string[]
  // All brands detected in the scope vs. the analyzed ("run") subset with data.
  scopeDiscovery: DiscoveryBrand[]
  setScopeDiscovery(b: DiscoveryBrand[]): void
  scopeInventory: Brand[]
  scopeLegibility: LegibilityReport | null
  scopeReels: Record<string, ReelInfo>
  scopeLoading: boolean
  // The analyzed brands the user has chosen to view (drives Analyze + Legibility).
  viewBrands: string[]
  setViewBrands(names: string[]): void

  // --- player bridge ---
  playerRef: React.MutableRefObject<PlayerHandle | null>
  seekTo(sec: number, videoFilename?: string): void

  // result panels listen to this to clear when the store/mode changes
  storeEpoch: number
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within <AppProvider>")
  return ctx
}

const INDEXING_DONE = new Set(["ready", "failed", "error"])

// Until /api/demo/info answers, assume the locked demo — the safe default, and
// what a public deployment runs. The server decides via DEMO_MODE; see
// backend/core/config.py.
function initialMode(): Mode {
  return "demo"
}

/** Locked demo, or open collection selection? Decided by the server. */
function modeFor(info: DemoInfo | null): Mode {
  return info && info.demo_mode === false ? "byok" : "demo"
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(initialMode)
  const [demo, setDemo] = useState<DemoInfo | null>(null)


  // The BYO-key user's chosen store (persisted). In demo mode the active store
  // is derived from `demo` instead, and this is ignored.
  const [byokStore, setByokStore] = useState<ActiveStore | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_LS) || "null")
    } catch {
      return null
    }
  })
  const [videos, setVideos] = useState<Video[]>([])
  const [sports, setSports] = useState<SportProfile[]>([])
  const [defaultSport, setDefaultSport] = useState("generic")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [econ, setEconState] = useState<EconState>(() => loadEcon())
  const [storeEpoch, setStoreEpoch] = useState(0)
  // Per-game scope. Demo is pinned to one game (PINNED_GAME_ID); "all" = whole
  // collection (the aggregate fixture) remains available via the ALL_GAMES paths.
  const [gameId, setGameId] = useState<string>(PINNED_GAME_ID)
  const [assetId, setAssetId] = useState<string>("")
  // BYO generate flow: brand inventory shared across Discover/Analyze/Legibility.
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [inventory, setInventory] = useState<Brand[] | null>(null)
  const [legibility, setLegibility] = useState<LegibilityReport | null>(null)
  // The two analyzed brands; Legibility audits these.
  const [brandA, setBrandA] = useState("")
  const [brandB, setBrandB] = useState("")

  // Demo explore: cached data for the current scope + the viewed brand subset.
  const [scopeDiscovery, setScopeDiscovery] = useState<DiscoveryBrand[]>([])
  const [scopeInventory, setScopeInventory] = useState<Brand[]>([])
  const [scopeLegibility, setScopeLegibility] = useState<LegibilityReport | null>(null)
  const [scopeReels, setScopeReels] = useState<Record<string, ReelInfo>>({})
  const [scopeLoading, setScopeLoading] = useState(false)
  const [viewBrands, setViewBrands] = useState<string[]>([])

  const playerRef = useRef<PlayerHandle | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const demoBrands = useMemo(() => demo?.demo_brands ?? [], [demo])
  const games = useMemo<GameOption[]>(() => demo?.games ?? [], [demo])
  const pickedInitialGame = useRef(false)

  // Effective active store: pinned demo collection, or the BYO user's store.
  const activeStore = useMemo<ActiveStore | null>(() => {
    if (mode === "demo") {
      return demo?.enabled ? { id: demo.store_id, sport: demo.sport } : null
    }
    return byokStore
  }, [mode, demo, byokStore])

  // Persist econ on change.
  const setEcon = useCallback((next: EconState | ((prev: EconState) => EconState)) => {
    setEconState((prev) => {
      const value = typeof next === "function" ? (next as (p: EconState) => EconState)(prev) : next
      saveEcon(value)
      return value
    })
  }, [])

  const persistStore = useCallback((s: ActiveStore | null) => {
    if (s) localStorage.setItem(STORE_LS, JSON.stringify(s))
    else localStorage.removeItem(STORE_LS)
  }, [])

  // BYO mode only — picking/clearing a collection. No-op in the locked demo.
  const setActiveStore = useCallback(
    (s: ActiveStore | null) => {
      if (mode !== "byok") return
      setByokStore((prev) => {
        const changed = !prev || !s || prev.id !== s.id
        if (changed) {
          setSessionId(null)
          setStoreEpoch((e) => e + 1)
        }
        return s
      })
      persistStore(s)
    },
    [mode, persistStore],
  )

  const stopPoll = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  // Re-fetch the active store's roster (sport + videos) from the stateless API.
  const refreshStore = useCallback(async () => {
    if (!activeStore) {
      setVideos([])
      return
    }
    try {
      const data = await api.useStore(activeStore.id)
      if (mode === "byok" && data.sport && data.sport !== byokStore?.sport) {
        const updated = { id: activeStore.id, sport: data.sport }
        setByokStore(updated)
        persistStore(updated)
      }
      setVideos(data.videos || [])
    } catch (e) {
      console.warn("refreshStore failed", e)
    }
  }, [activeStore, mode, byokStore, persistStore])

  // Poll only while something is still indexing.
  useEffect(() => {
    const indexing = videos.some((v) => v.status && !INDEXING_DONE.has(v.status))
    if (activeStore && indexing) {
      if (!pollTimer.current) {
        pollTimer.current = setTimeout(() => {
          pollTimer.current = null
          void refreshStore()
        }, 3000)
      }
    } else {
      stopPoll()
    }
    return stopPoll
  }, [videos, activeStore, refreshStore, stopPoll])

  // Load sports + demo availability once; the server decides the mode.
  useEffect(() => {
    api
      .sports()
      .then((r) => {
        setSports(r.sports || [])
        setDefaultSport(r.default || "generic")
      })
      .catch(() => {})
    api
      .demoInfo()
      .then((info) => {
        setDemo(info)
        // DEMO_MODE=False unlocks the collection picker + game selection.
        setModeState(modeFor(info))
      })
      .catch(() => setDemo(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear all analysis state whenever the store/mode changes.
  useEffect(() => {
    setSelectedBrands([])
    setInventory(null)
    setLegibility(null)
    setBrandA("")
    setBrandB("")
    setGameId(PINNED_GAME_ID)
    setAssetId("")
    setScopeDiscovery([])
    setScopeInventory([])
    setScopeLegibility(null)
    setScopeReels({})
    setViewBrands([])
  }, [storeEpoch])

  // On key change / store change / mode change: refresh the roster.
  useEffect(() => {
    void refreshStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStore?.id, mode])

  const seekTo = useCallback((sec: number, videoFilename?: string) => {
    playerRef.current?.seekTo(sec, videoFilename)
  }, [])

  // Raw roster readiness — drives the status chip (watches ALL store videos).
  const readyVideosAll = useMemo(() => videos.filter((v) => v.status === "ready"), [videos])

  // Demo is pinned to one game (PINNED_GAME_ID): show only that game's broadcast
  // in the player + roster. Join game→video by asset_id. BYOK shows all videos.
  const pinnedAssetId = useMemo(
    () => games.find((g) => g.id === gameId)?.asset_id ?? null,
    [games, gameId],
  )
  const visibleVideos = useMemo(
    () =>
      mode === "demo" && pinnedAssetId
        ? videos.filter((v) => v.asset_id === pinnedAssetId)
        : videos,
    [mode, pinnedAssetId, videos],
  )
  const readyVideos = useMemo(
    () => visibleVideos.filter((v) => v.status === "ready"),
    [visibleVideos],
  )

  const storeStatus = useMemo<AppContextValue["storeStatus"]>(() => {
    if (!activeStore) return "idle"
    if (videos.some((v) => v.status && !INDEXING_DONE.has(v.status))) return "indexing"
    if (readyVideosAll.length > 0) return "ready"
    if (videos.length > 0) return "failed"
    return "empty"
  }, [activeStore, videos, readyVideosAll])

  // Open the demo on the pinned game (PINNED_GAME_ID) — the aggregate scope has
  // no reels and thin legibility, and this is our highest-accuracy broadcast, so
  // it's the strongest first impression. Falls back to the first available game
  // if the pinned id isn't in the collection. Runs once per load.
  useEffect(() => {
    if (mode !== "demo" || pickedInitialGame.current) return
    const gs = demo?.games ?? []
    if (!gs.length) return
    pickedInitialGame.current = true
    const pinned = gs.find((g) => g.id === PINNED_GAME_ID)
    setGameId(pinned ? pinned.id : gs[0].id)
  }, [mode, demo])

  // Demo explore: load the selected scope's pre-baked outputs (all detected
  // brands + the analyzed subset + legibility + reels) from the cache — no
  // Jockey, no clicks. Re-fetches on scope change; defaults the viewed set to
  // every analyzed brand. Panels render instantly from this shared state.
  useEffect(() => {
    if (mode !== "demo" || !demo?.enabled || storeStatus !== "ready") return
    let cancelled = false
    setScopeLoading(true)
    api
      .demoScope(gameId)
      .then((s) => {
        if (cancelled) return
        setScopeDiscovery(s.discovery ?? [])
        setScopeInventory(s.inventory ?? [])
        setScopeLegibility(s.legibility ?? null)
        setScopeReels(s.reels ?? {})
        setViewBrands((s.inventory ?? []).map((b) => b.name))
      })
      .catch((e) => {
        if (cancelled) return
        console.warn("demoScope failed", e)
        setScopeDiscovery([])
        setScopeInventory([])
        setScopeLegibility(null)
        setScopeReels({})
        setViewBrands([])
      })
      .finally(() => {
        if (!cancelled) setScopeLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, demo, storeStatus, gameId])

  const value: AppContextValue = {
    mode,
    demo,
    activeStore,
    setActiveStore,
    videos: visibleVideos,
    readyVideos,
    refreshStore,
    storeStatus,
    sports,
    defaultSport,
    sessionId,
    setSessionId,
    econ,
    setEcon,
    gameId,
    assetId,
    setAssetId,
    setGameId,
    games,
    selectedBrands,
    setSelectedBrands,
    inventory,
    setInventory,
    legibility,
    setLegibility,
    brandA,
    brandB,
    setBrandA,
    setBrandB,
    demoBrands,
    scopeDiscovery,
    scopeInventory,
    scopeLegibility,
    scopeReels,
    scopeLoading,
    viewBrands,
    setViewBrands,
    setScopeDiscovery,
    playerRef,
    seekTo,
    storeEpoch,
  }

  void DEFAULT_ECON

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
