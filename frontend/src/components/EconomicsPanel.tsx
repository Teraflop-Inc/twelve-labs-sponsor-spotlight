import { Button, TextField } from "@twelvelabs-io/react"
import { DEFAULT_WEIGHTS, audienceMultiplier } from "../lib/econ"
import { useApp } from "../state"
import { ContextChip, SectionCard } from "../ui"
import type { EconState } from "../lib/econ"

function NumField({
  label,
  title,
  value,
  onChange,
  width = "w-20",
  step,
}: {
  label: string
  title?: string
  value: number
  onChange: (n: number) => void
  width?: string
  step?: string
}) {
  return (
    <label className="flex items-center gap-2" title={title}>
      <span className="whitespace-nowrap text-xs text-foreground-muted">{label}</span>
      <TextField
        size="small"
        type="number"
        step={step}
        value={String(value)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={width}
      />
    </label>
  )
}

export function EconomicsPanel() {
  const { econ, setEcon } = useApp()
  const set = (patch: Partial<EconState>) => setEcon((p) => ({ ...p, ...patch }))
  const mult = audienceMultiplier(econ)

  return (
    <SectionCard step="2" title="Economic assumptions" hint="Inputs that drive every figure below.">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <NumField label="CPM $" value={econ.cpm} onChange={(cpm) => set({ cpm })} width="w-20" />
        <NumField
          label="Reach M"
          value={econ.reach}
          step="0.1"
          onChange={(reach) => set({ reach })}
          width="w-20"
        />
        <span className="text-border-secondary">·</span>
        <span className="text-[11px] uppercase tracking-wide text-foreground-subtle">Audience %</span>
        <NumField
          label="Age 18-49"
          title="Share of viewers aged 18-49 — the prime ad demo"
          value={econ.audPremium}
          onChange={(audPremium) => set({ audPremium })}
        />
        <NumField
          label="Regional"
          title="Share of viewers in the team's home region"
          value={econ.audRegional}
          onChange={(audRegional) => set({ audRegional })}
        />
        <NumField
          label="Streaming"
          title="Share watching via streaming vs linear"
          value={econ.audStreaming}
          onChange={(audStreaming) => set({ audStreaming })}
        />
        <span className="flex items-center gap-1 text-xs text-foreground-subtle">
          multiplier
          <span className="font-tl-mono text-sm text-tl-embed-dark-green">×{mult.toFixed(2)}</span>
        </span>
      </div>

      <div className="mt-4 rounded-tlds-2 border border-border-secondary p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">
            Context weights{" "}
            <span className="text-xs font-normal text-foreground-subtle">
              — value multiplier per broadcast context
            </span>
          </div>
          <Button
            variant="ghosted"
            size="sm"
            onClick={() => set({ weights: { ...DEFAULT_WEIGHTS } })}
          >
            reset to defaults
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {Object.keys(DEFAULT_WEIGHTS).map((ctx) => (
            <label key={ctx} className="flex items-center gap-1.5">
              <ContextChip context={ctx} />
              <TextField
                size="mini"
                type="number"
                step="0.1"
                value={String(econ.weights[ctx] ?? 1)}
                onChange={(e) =>
                  set({
                    weights: { ...econ.weights, [ctx]: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-14"
              />
            </label>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs italic text-foreground-subtle">
        Audience inputs are illustrative placeholders — video alone can't determine audience.
        Connect a Nielsen or Samba feed for production.
      </p>
    </SectionCard>
  )
}
