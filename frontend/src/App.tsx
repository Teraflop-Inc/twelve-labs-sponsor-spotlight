import { Chip, ToggleButton, ToggleButtons } from "@twelvelabs-io/react"
import { AppProvider, useApp, type Mode } from "./state"
import { Player } from "./components/Player"
import { ApiKeyPanel } from "./components/ApiKeyPanel"
import { FootagePanel } from "./components/FootagePanel"
import { EconomicsPanel } from "./components/EconomicsPanel"
import { DiscoverPanel } from "./components/DiscoverPanel"
import { AnalyzePanel } from "./components/AnalyzePanel"
import { LegibilityPanel } from "./components/LegibilityPanel"

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

const STATUS_CHIP: Record<string, { variant: "subtle" | "warning" | "success" | "error"; label: string }> = {
  idle: { variant: "subtle", label: "idle" },
  empty: { variant: "subtle", label: "empty" },
  indexing: { variant: "warning", label: "indexing…" },
  ready: { variant: "success", label: "ready" },
  failed: { variant: "error", label: "failed" },
}

function Header() {
  const { storeStatus } = useApp()
  const chip = STATUS_CHIP[storeStatus] ?? STATUS_CHIP.idle
  return (
    <header className="sticky top-0 z-20 border-b border-border-secondary bg-surface-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-block size-5 rounded-tlds-1"
            style={{ background: "var(--tl-color-master-brand-green)" }}
          />
          <div className="leading-tight">
            <div className="font-tl-sans text-lg font-semibold tracking-tight">Sponsor Spotlight</div>
            <div className="text-xs text-foreground-subtle">
              TwelveLabs · Jockey sponsor-exposure analytics
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-foreground-subtle sm:inline">Status</span>
          <Chip variant={chip.variant} size="md">
            {chip.label}
          </Chip>
        </div>
      </div>
    </header>
  )
}

function ModeTabs() {
  const { mode, setMode, demo } = useApp()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ToggleButtons value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <ToggleButton value="demo">Demo</ToggleButton>
        <ToggleButton value="byok">Use your own key</ToggleButton>
      </ToggleButtons>
      <p className="text-xs text-foreground-subtle">
        {mode === "demo"
          ? demo && !demo.enabled
            ? "Demo mode is not configured on this server."
            : "Runs on a preloaded collection — no API key or setup required."
          : "Use your own TwelveLabs API key and collections."}
      </p>
    </div>
  )
}

function Shell() {
  const { mode } = useApp()
  return (
    <div className="min-h-screen bg-surface-body text-foreground-body">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <ModeTabs />
        {mode === "byok" && <ApiKeyPanel />}
        <FootagePanel />
        <Player />
        <EconomicsPanel />
        <DiscoverPanel />
        <AnalyzePanel />
        <LegibilityPanel />
        <footer className="pb-10 pt-4 text-center text-xs text-foreground-subtle">
          Every result is produced by the Jockey <span className="font-tl-mono">/responses</span> API
          over a knowledge store. Economic figures are computed client-side from your assumptions.
        </footer>
      </main>
    </div>
  )
}
