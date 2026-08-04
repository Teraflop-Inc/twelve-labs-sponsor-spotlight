import { Button } from "@twelvelabs-io/react"
import { exportData, exportNielsen } from "../lib/export"
import { ALL_GAMES, useApp } from "../state"

/**
 * Game-level data export, pinned in the left column under the video. Exports the
 * FULL run data for the whole selected game (every analyzed brand's appearances
 * + legibility + economics), independent of which brands are checked to view.
 */
export function GameExport() {
  const { econ, gameId, games, scopeInventory, scopeLegibility, scopeDiscovery } = useApp()
  if (!scopeInventory.length) return null

  const gameLabel =
    gameId === ALL_GAMES ? "All games" : games.find((g) => g.id === gameId)?.label ?? gameId
  const scopeGameId = gameId === ALL_GAMES ? null : gameId
  const detected = scopeDiscovery.map((d) => d.name)
  const run = (format: "csv" | "json") =>
    exportData(scopeInventory, scopeLegibility, econ, format, gameLabel, scopeGameId, detected)

  return (
    <div className="rounded-dialog border border-border-secondary bg-surface-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-foreground-subtle">
            Export data
          </div>
          <p className="text-xs text-foreground-subtle">
            Full run data for {gameLabel} — every appearance + legibility.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outlined-gray" onClick={() => run("csv")}>
            CSV
          </Button>
          <Button size="sm" variant="outlined-gray" onClick={() => run("json")}>
            JSON
          </Button>
          <Button
            size="sm"
            variant="outlined-gray"
            onClick={() => exportNielsen(scopeInventory, econ, gameLabel, scopeGameId, scopeLegibility)}
            title="Value / Impressions / Exposures / Duration / Share of Voice, by partner × asset"
          >
            Nielsen CSV
          </Button>
        </div>
      </div>
    </div>
  )
}
