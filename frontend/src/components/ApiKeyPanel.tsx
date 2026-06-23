import { useState } from "react"
import { Button, Chip, TextField } from "@twelvelabs-io/react"
import { getKey } from "../lib/api"
import { useApp } from "../state"
import { SectionCard } from "../ui"

export function ApiKeyPanel() {
  const { hasKey, saveKey, clearKey } = useApp()
  const [value, setValue] = useState(getKey())

  return (
    <SectionCard
      step="0"
      title="TwelveLabs API key"
      hint="Stored only in this browser; sent per-request, never persisted server-side."
      actions={
        <Chip variant={hasKey ? "success" : "warning"} size="md">
          {hasKey ? "key set" : "no key"}
        </Chip>
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <TextField
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="tlk_…  (Jockey requires an allowlisted key)"
          className="min-w-[20rem] flex-1 font-tl-mono"
        />
        <Button onClick={() => value.trim() && saveKey(value)}>Save</Button>
        <Button
          variant="ghosted"
          onClick={() => {
            clearKey()
            setValue("")
          }}
        >
          Clear
        </Button>
      </div>
      <p className="mt-2 text-xs text-foreground-subtle">
        Get a key from the{" "}
        <a
          className="text-foreground-status-info underline-offset-2 hover:underline"
          href="https://playground.twelvelabs.io"
          target="_blank"
          rel="noreferrer"
        >
          TwelveLabs dashboard
        </a>
        .
      </p>
    </SectionCard>
  )
}
