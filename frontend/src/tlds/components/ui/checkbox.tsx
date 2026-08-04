"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { cn } from "@/lib/utils"

type CheckboxSize = "sm" | "md"

// Regular = 20px box, Small = 16px box. Label / error-message type ramps
// follow the Figma spec (Paragraph Medium/Small for the label, Paragraph
// Small/Mini for the message).
const SIZE_CONFIG: Record<
  CheckboxSize,
  { box: string; radius: string; label: string; message: string }
> = {
  sm: {
    box: "size-4",
    radius: "rounded-[5px]",
    label: "text-[12px] leading-[16px]",
    message: "text-[10px] leading-[14px]",
  },
  md: {
    box: "size-5",
    radius: "rounded-[6px]",
    label: "text-[14px] leading-[20px]",
    message: "text-[12px] leading-[16px]",
  },
}

// Outlined frame — the unchecked border. Always rendered behind the indicator.
const OUTLINE_PATH =
  "M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961C3.61157 13.9998 2 12.3875 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM5.59961 3C4.16396 3.00018 3.00018 4.16396 3 5.59961V10.3994C3 11.8352 4.16385 12.9998 5.59961 13H10.3994C11.8353 13 13 11.8353 13 10.3994V5.59961C12.9998 4.16385 11.8352 3 10.3994 3H5.59961Z"

// Solid rounded box matching the outline's outer edge — the hover fill. Shares
// the outline's geometry so it never extends past the visible checkbox.
const FILL_PATH =
  "M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961C3.61157 13.9998 2 12.3875 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994Z"

// Filled box with a check carved out (fill-rule evenodd punches the hole).
const CHECK_PATH =
  "M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961L5.41504 13.9951C3.51277 13.8989 2 12.3256 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM7.45605 10.0811C7.39375 10.1932 7.23396 10.1959 7.16797 10.0859L5.76172 7.74219L4.9043 8.25684L6.31055 10.6006C6.77252 11.3704 7.89492 11.3521 8.33105 10.5674L11.1035 5.57617L10.2295 5.09082L7.45605 10.0811Z"

// Filled box with a horizontal dash carved out — the indeterminate state.
const INDETERMINATE_PATH =
  "M10.3994 2C12.3875 2 13.9998 3.61157 14 5.59961V10.3994C14 12.3876 12.3876 14 10.3994 14H5.59961L5.41504 13.9951C3.51277 13.8989 2 12.3256 2 10.3994V5.59961C2.00018 3.61168 3.61168 2.00018 5.59961 2H10.3994ZM5.4043 7.5H10.5957C10.872 7.5 11.0957 7.72386 11.0957 8C11.0957 8.27614 10.872 8.5 10.5957 8.5H5.4043C5.12816 8.5 4.9043 8.27614 4.9043 8C4.9043 7.72386 5.12816 7.5 5.4043 7.5Z"

function CheckboxGlyph({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="absolute inset-0 size-full"
    >
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  )
}

type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "aria-invalid"> & {
  size?: CheckboxSize
  /**
   * Puts the checkbox in the error (red) state. This is the recommended way to
   * flag a validation error — it also sets `aria-invalid` on the DOM for you,
   * so assistive tech announces the control as invalid.
   *
   * @example
   * <Checkbox error label="I accept the terms" errorMessage="This is required" />
   */
  error?: boolean
  /** Optional label rendered next to the box; makes the whole row clickable. */
  label?: React.ReactNode
  /** Validation message shown below the row while the checkbox is in the error state. */
  errorMessage?: React.ReactNode
  /**
   * Honored for form-library interop (e.g. react-hook-form spreading field
   * props). In app code prefer the `error` prop — it is clearer and drives the
   * same state.
   */
  "aria-invalid"?: boolean
}

function Checkbox({
  className,
  size = "md",
  error,
  label,
  errorMessage,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
  ...props
}: CheckboxProps) {
  const generatedId = React.useId()
  const isError = error ?? ariaInvalid ?? false
  const hasField = label != null || (isError && errorMessage != null)
  const checkboxId = id ?? (hasField ? generatedId : undefined)
  const cfg = SIZE_CONFIG[size]

  const box = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      data-slot="checkbox"
      disabled={disabled}
      aria-invalid={isError || undefined}
      className={cn(
        "group/checkbox peer relative inline-block shrink-0 cursor-default text-foreground-body outline-none transition-colors duration-150",
        cfg.box,
        cfg.radius,
        "focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:text-foreground-disabled",
        "aria-invalid:text-misc-status-error",
        !hasField && className,
      )}
      {...props}
    >
      {/* Active fill — confined to the checkbox shape, behind the outline. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 text-surface-secondary opacity-0 transition-opacity duration-150",
          "group-active/checkbox:opacity-100 group-disabled/checkbox:opacity-0",
        )}
      >
        <CheckboxGlyph d={FILL_PATH} />
      </span>

      {/* Unchecked border — always visible, covered by the indicator when set. */}
      <CheckboxGlyph d={OUTLINE_PATH} />

      {/* Filled glyph (check or dash) that pops in on check / indeterminate. */}
      <CheckboxPrimitive.Indicator
        forceMount
        data-slot="checkbox-indicator"
        className={cn(
          "group/indicator absolute inset-0 origin-center",
          "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "data-[state=unchecked]:scale-0 data-[state=unchecked]:opacity-0",
        )}
      >
        <span className="absolute inset-0 opacity-0 group-data-[state=checked]/indicator:opacity-100">
          <CheckboxGlyph d={CHECK_PATH} />
        </span>
        <span className="absolute inset-0 opacity-0 group-data-[state=indeterminate]/indicator:opacity-100">
          <CheckboxGlyph d={INDETERMINATE_PATH} />
        </span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (!hasField) return box

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex items-center gap-1 select-none",
          disabled ? "cursor-not-allowed" : "cursor-default",
        )}
      >
        {box}
        {label != null && (
          <span
            className={cn(
              cfg.label,
              disabled ? "text-foreground-disabled" : "text-foreground-body",
            )}
          >
            {label}
          </span>
        )}
      </label>
      {isError && errorMessage != null && (
        <p className={cn(cfg.message, "text-misc-status-error")}>{errorMessage}</p>
      )}
    </div>
  )
}

export { Checkbox }
export type { CheckboxProps, CheckboxSize }
