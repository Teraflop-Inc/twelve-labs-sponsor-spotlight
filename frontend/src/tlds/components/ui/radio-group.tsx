"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

type RadioGroupSize = "sm" | "md"

// md = 20px circle, sm = 16px circle. Label / error-message type ramps follow
// the Figma spec (Paragraph Medium/Small for the label, Paragraph Small/Mini
// for the message). `indent` aligns the error message under the label (circle
// width + the 4px row gap).
const SIZE_CONFIG: Record<
  RadioGroupSize,
  { box: string; label: string; message: string; indent: string; gap: string }
> = {
  sm: {
    box: "size-4",
    label: "text-[12px] leading-[16px]",
    message: "text-[10px] leading-[14px]",
    indent: "pl-[20px]",
    gap: "gap-0.5",
  },
  md: {
    box: "size-5",
    label: "text-[14px] leading-[20px]",
    message: "text-[12px] leading-[16px]",
    indent: "pl-[24px]",
    gap: "gap-1",
  },
}

// Unchecked ring — always visible. evenodd punches the hole.
const RING_PATH =
  "M3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3C5.23858 3 3 5.23858 3 8ZM8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z"

// Center dot — pops in on top of the ring when checked.
const DOT_PATH =
  "M8 5C9.65685 5 11 6.34315 11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8C5 6.34315 6.34315 5 8 5Z"

function RadioGlyph({ d, hollow }: { d: string; hollow?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <path
        fillRule={hollow ? "evenodd" : undefined}
        clipRule={hollow ? "evenodd" : undefined}
        d={d}
      />
    </svg>
  )
}

const RadioGroupContext = React.createContext<{ size: RadioGroupSize }>({
  size: "md",
})

function RadioGroup({
  className,
  size = "md",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  size?: RadioGroupSize
}) {
  return (
    <RadioGroupContext.Provider value={{ size }}>
      <RadioGroupPrimitive.Root
        data-slot="radio-group"
        className={cn("flex flex-col gap-3", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

type RadioGroupItemProps = Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  "aria-invalid"
> & {
  size?: RadioGroupSize
  /** Renders the circle in the error (red) state. Also derived from `aria-invalid`. */
  error?: boolean
  /** Optional label rendered next to the circle; makes the whole row clickable. */
  label?: React.ReactNode
  /** Message shown below the row when `error` is set. */
  errorMessage?: React.ReactNode
  "aria-invalid"?: boolean
}

function RadioGroupItem({
  className,
  size: sizeProp,
  error,
  label,
  errorMessage,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  const size = sizeProp ?? context.size
  const generatedId = React.useId()
  const isError = error ?? ariaInvalid ?? false
  const hasField = label != null || (isError && errorMessage != null)
  const itemId = id ?? (hasField ? generatedId : undefined)
  const cfg = SIZE_CONFIG[size]

  const radio = (
    <RadioGroupPrimitive.Item
      id={itemId}
      data-slot="radio-group-item"
      disabled={disabled}
      aria-invalid={isError || undefined}
      className={cn(
        "peer relative inline-block shrink-0 cursor-default rounded-full text-foreground-body outline-none transition-colors duration-150",
        cfg.box,
        "focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:text-foreground-disabled",
        "aria-invalid:text-misc-status-error",
        !hasField && className,
      )}
      {...props}
    >
      {/* Unchecked ring — always visible, joined by the dot when checked. */}
      <RadioGlyph d={RING_PATH} hollow />

      {/* Center dot that pops in on check. */}
      <RadioGroupPrimitive.Indicator
        forceMount
        data-slot="radio-group-indicator"
        className={cn(
          "absolute inset-0 origin-center",
          "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "data-[state=unchecked]:scale-0 data-[state=unchecked]:opacity-0",
        )}
      >
        <RadioGlyph d={DOT_PATH} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )

  if (!hasField) return radio

  return (
    <div className={cn("flex flex-col", cfg.gap, className)}>
      <label
        htmlFor={itemId}
        className={cn(
          "flex items-center gap-1 select-none",
          disabled ? "cursor-not-allowed" : "cursor-default",
        )}
      >
        {radio}
        {label != null && (
          <span
            className={cn(
              cfg.label,
              isError
                ? "text-misc-status-error"
                : disabled
                  ? "text-foreground-disabled"
                  : "text-foreground-body",
            )}
          >
            {label}
          </span>
        )}
      </label>
      {isError && errorMessage != null && (
        <p className={cn(cfg.message, cfg.indent, "text-misc-status-error")}>{errorMessage}</p>
      )}
    </div>
  )
}

export { RadioGroup, RadioGroupItem }
export type { RadioGroupItemProps, RadioGroupSize }
