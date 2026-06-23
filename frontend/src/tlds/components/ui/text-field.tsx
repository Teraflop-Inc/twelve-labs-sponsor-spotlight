"use client"

import * as React from "react"

import { CloseIcon } from "@/icons"
import { cn } from "@/lib/utils"

type TextFieldSize = "mini" | "small" | "large" | "xlarge"

// Per-size geometry and typography, mirroring the TLDS 2.0 TextField spec.
// `control` drives the bordered box (radius + padding + inner gap); `input`
// and `label`/`message` carry the matching type ramp.
const SIZE_STYLES: Record<
  TextFieldSize,
  {
    control: string
    /** Left padding override applied when a leading icon (`startContent`) is present. */
    startPadding: string
    input: string
    /** Icon size class applied directly to an svg (clear button). */
    icon: string
    /** Icon size class applied to an adornment wrapper (`startContent`/`endContent`). */
    iconWrap: string
    label: string
    message: string
    labelGap: string
    messageGap: string
  }
> = {
  mini: {
    control: "rounded-tlds-2 py-1 pl-2 pr-1.5",
    startPadding: "pl-2",
    input: "text-[12px] leading-4",
    icon: "size-4",
    iconWrap: "[&_svg]:size-4",
    label: "text-[12px] leading-4",
    message: "text-[10px] leading-[14px]",
    labelGap: "mb-1",
    messageGap: "mt-0.5",
  },
  small: {
    control: "rounded-tlds-2 py-1.5 pl-3 pr-3",
    startPadding: "pl-2",
    input: "text-[12px] leading-4",
    icon: "size-4",
    iconWrap: "[&_svg]:size-4",
    label: "text-[12px] leading-4",
    message: "text-[10px] leading-[14px]",
    labelGap: "mb-1",
    messageGap: "mt-1",
  },
  large: {
    control: "rounded-tlds-3 py-2.5 pl-4 pr-4",
    startPadding: "pl-3",
    input: "text-sm leading-5",
    icon: "size-5",
    iconWrap: "[&_svg]:size-5",
    label: "text-sm leading-5",
    message: "text-[12px] leading-4",
    labelGap: "mb-2",
    messageGap: "mt-1",
  },
  xlarge: {
    control: "rounded-tlds-3 py-3 pl-4 pr-4",
    startPadding: "pl-4",
    input: "text-base leading-6",
    icon: "size-6",
    iconWrap: "[&_svg]:size-6",
    label: "text-sm leading-5",
    message: "text-[12px] leading-4",
    labelGap: "mb-2",
    messageGap: "mt-1",
  },
}

type TextFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Visual size of the field. Defaults to `large`. */
  size?: TextFieldSize
  /** Optional label rendered above the control and wired to the input. */
  label?: React.ReactNode
  /**
   * Error state. Pass `true` for error styling only, or a string/node to also
   * render a message below the control. `aria-invalid` enables it too.
   */
  error?: boolean | React.ReactNode
  /** Show a trailing clear (✕) button while the field has a value. */
  clearable?: boolean
  /** Called when the clear button is pressed. */
  onClear?: () => void
  /** Leading content (e.g. an icon) rendered inside the control, before the input. */
  startContent?: React.ReactNode
  /** Trailing content rendered inside the control (before the clear button). */
  endContent?: React.ReactNode
  /** Class for the bordered control box. */
  controlClassName?: string
  /** Class for the inner `<input>`; `className` targets the outer wrapper. */
  inputClassName?: string
}

function TextField({
  className,
  controlClassName,
  inputClassName,
  size = "large",
  label,
  error,
  clearable,
  onClear,
  startContent,
  endContent,
  id,
  ref,
  value,
  defaultValue,
  disabled,
  onChange,
  "aria-invalid": ariaInvalid,
  ...props
}: TextFieldProps) {
  const reactId = React.useId()
  const inputId = id ?? reactId
  const messageId = `${inputId}-message`
  const styles = SIZE_STYLES[size]

  const innerRef = React.useRef<HTMLInputElement>(null)
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  // Always render a controlled input: consumer-controlled when `value` is
  // provided, otherwise self-controlled (seeded from `defaultValue`) so the
  // clear button works in both modes.
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(
    defaultValue != null ? String(defaultValue) : "",
  )
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue != null && String(currentValue).length > 0

  const errorMessage = typeof error === "boolean" ? undefined : error
  const hasError =
    error === true || errorMessage != null || ariaInvalid === true || ariaInvalid === "true"

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(event.target.value)
    onChange?.(event)
  }

  const handleClear = () => {
    if (!isControlled) setInternalValue("")
    onClear?.()
    innerRef.current?.focus()
  }

  const showClear = clearable && hasValue && !disabled

  // Icon adornments inherit the field's text color and are sized to match the
  // control. `currentColor` icons (the icon set) pick this up automatically.
  const adornmentClassName = cn(
    "flex shrink-0 items-center justify-center",
    styles.iconWrap,
    disabled
      ? "text-foreground-disabled"
      : hasError
        ? "text-foreground-status-error"
        : "text-foreground-subtle",
  )

  // Clicking the padding around the input (the control box itself, not the
  // input or trailing controls) should focus the input like a native field.
  const handleControlPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.target !== event.currentTarget) return
    event.preventDefault()
    innerRef.current?.focus()
  }

  return (
    <div
      data-slot="text-field"
      data-size={size}
      data-disabled={disabled || undefined}
      data-error={hasError || undefined}
      className={cn("flex flex-col", className)}
    >
      {label != null && (
        <label
          htmlFor={inputId}
          data-slot="text-field-label"
          className={cn(
            "w-fit select-none",
            styles.label,
            styles.labelGap,
            disabled ? "text-foreground-disabled" : "text-foreground-body",
          )}
        >
          {label}
        </label>
      )}

      <div
        data-slot="text-field-control"
        onPointerDown={handleControlPointerDown}
        className={cn(
          "group flex w-full cursor-text items-center border border-solid border-border-secondary bg-transparent transition-colors",
          "focus-within:border-border-primary",
          hasError && "border-border-destructive focus-within:border-border-destructive",
          disabled &&
            "cursor-default border-border-disabled bg-surface-card focus-within:border-border-disabled",
          styles.control,
          startContent != null && styles.startPadding,
          controlClassName,
        )}
      >
        {startContent != null && (
          <span data-slot="text-field-start" className={cn("mr-2", adornmentClassName)}>
            {startContent}
          </span>
        )}

        <input
          ref={setRef}
          id={inputId}
          data-slot="text-field-input"
          disabled={disabled}
          value={currentValue}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          aria-describedby={errorMessage != null ? messageId : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-foreground-body outline-none",
            "placeholder:text-foreground-subtle",
            "disabled:cursor-default disabled:text-foreground-disabled disabled:placeholder:text-foreground-disabled",
            hasError && "text-foreground-status-error placeholder:text-foreground-status-error",
            styles.input,
            inputClassName,
          )}
          {...props}
        />

        {endContent != null && (
          <span data-slot="text-field-end" className={cn("ml-2", adornmentClassName)}>
            {endContent}
          </span>
        )}

        {showClear && (
          // Collapsed to zero width (reclaiming its space, so the input reaches
          // the edge) until the field is hovered or focused — then it smoothly
          // expands via the grid 0fr→1fr trick. The button's own pl-2 supplies
          // the gap and collapses with it.
          <span
            data-slot="text-field-clear"
            className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-150 ease-out group-focus-within:grid-cols-[1fr] group-hover:grid-cols-[1fr]"
          >
            <span className="overflow-hidden">
              <button
                type="button"
                aria-label="Clear"
                onClick={handleClear}
                className={cn(
                  "flex cursor-default items-center justify-center rounded-tlds-1 pl-2 opacity-0 outline-none transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                  hasError
                    ? "text-foreground-status-error"
                    : "text-foreground-subtle hover:text-foreground-body focus-visible:text-foreground-body",
                )}
              >
                <CloseIcon className={styles.icon} />
              </button>
            </span>
          </span>
        )}
      </div>

      {errorMessage != null && (
        <p
          id={messageId}
          data-slot="text-field-message"
          className={cn("text-foreground-status-error", styles.message, styles.messageGap)}
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export { TextField }
export type { TextFieldProps, TextFieldSize }
