import { Chip, TwelveLabsLogoMark } from "@twelvelabs-io/react"
import { AppProvider, useApp } from "./state"
import { Player } from "./components/Player"
import { GameExport } from "./components/GameExport"
import { FootagePanel } from "./components/FootagePanel"
import { EconomicsPanel } from "./components/EconomicsPanel"
import { BrandExplorerPanel } from "./components/BrandExplorerPanel"
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <TwelveLabsLogoMark className="h-6 w-auto text-foreground-body" />
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

function Shell() {
  return (
    <div className="min-h-screen bg-surface-body text-foreground-body">
      <Header />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Video pinned on the left; all the analysis data scrolls on the right. */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 lg:sticky lg:top-[84px] lg:self-start">
            <Player />
            <GameExport />
          </div>
          <div className="space-y-6">
            <FootagePanel />
            <EconomicsPanel />
            <BrandExplorerPanel />
            <AnalyzePanel />
            <LegibilityPanel />
          </div>
        </div>
        <footer className="pb-10 pt-4 text-center text-xs text-foreground-subtle">
          Every result is produced by the Jockey <span className="font-tl-mono">/responses</span> API
          over a knowledge store. Economic figures are computed client-side from your assumptions.
        </footer>
      </main>
    </div>
  )
}
