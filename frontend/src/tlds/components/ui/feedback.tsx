"use client"

import * as React from "react"

import {
  CloseIcon,
  ThumbsDownFilledIcon,
  ThumbsDownIcon,
  ThumbsUpFilledIcon,
  ThumbsUpIcon,
} from "@/icons"
import { cn } from "@/lib/utils"

import { Button } from "./button"
import { TextField } from "./text-field"

// Small controllable-state helper so each piece can be used either controlled
// (`value` + `onValueChange`) or uncontrolled (`defaultValue`). Kept local to
// avoid pulling in the transitive `@radix-ui/react-use-controllable-state`.
function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : uncontrolled

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [current, setValue] as const
}

function Feedback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="feedback"
      role="status"
      className={cn(
        // Floating pill: surface-body fill, primary outline, 16px radius and a
        // soft drop shadow. `min-h-15` (60px) centres a single line of text and
        // still comfortably fits the 40px input row of the input variant.
        "relative inline-flex w-fit min-h-15 items-center gap-8 rounded-tlds-4 border border-border-primary bg-surface-body px-4 py-2.5 text-sm leading-5 text-foreground-body shadow-[0px_32px_24px_-20px_rgba(29,28,27,0.2)]",
        className,
      )}
      {...props}
    />
  )
}

function FeedbackMessage({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="feedback-message" className={cn("shrink-0 text-pretty", className)} {...props} />
  )
}

type FeedbackRatingValue = "up" | "down"

function FeedbackThumb({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="feedback-thumb"
      className={cn(
        "inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-tlds-1 text-foreground-secondary opacity-70 outline-none transition-[opacity,transform] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.94] data-[pressed=true]:opacity-100 [&_svg]:size-5",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function FeedbackRating({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  value?: FeedbackRatingValue | null
  defaultValue?: FeedbackRatingValue | null
  onValueChange?: (value: FeedbackRatingValue | null) => void
}) {
  const [selected, setSelected] = useControllableState<FeedbackRatingValue | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  })

  // Clicking the active thumb again clears the selection.
  const toggle = (next: FeedbackRatingValue) => setSelected(selected === next ? null : next)

  return (
    <div
      role="group"
      data-slot="feedback-rating"
      className={cn("flex shrink-0 items-center gap-3", className)}
      {...props}
    >
      <FeedbackThumb
        aria-label="Good"
        aria-pressed={selected === "up"}
        data-pressed={selected === "up"}
        onClick={() => toggle("up")}
      >
        {selected === "up" ? <ThumbsUpFilledIcon /> : <ThumbsUpIcon />}
      </FeedbackThumb>
      <FeedbackThumb
        aria-label="Bad"
        aria-pressed={selected === "down"}
        data-pressed={selected === "down"}
        onClick={() => toggle("down")}
      >
        {selected === "down" ? <ThumbsDownFilledIcon /> : <ThumbsDownIcon />}
      </FeedbackThumb>
    </div>
  )
}

function FeedbackField({
  className,
  value,
  defaultValue,
  onValueChange,
  onSend,
  placeholder = "Enter your answer here",
  sendLabel = "Send",
  ...props
}: Omit<React.ComponentProps<"form">, "onChange" | "defaultValue"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onSend?: (value: string) => void
  placeholder?: string
  sendLabel?: React.ReactNode
}) {
  const [text, setText] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  })

  return (
    <form
      data-slot="feedback-field"
      className={cn("flex flex-1 items-center gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSend?.(text ?? "")
      }}
      {...props}
    >
      <TextField
        className="flex-1"
        size="large"
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Button type="submit" variant="primary" size="lg">
        {sendLabel}
      </Button>
    </form>
  )
}

function FeedbackClose({
  className,
  children,
  "aria-label": ariaLabel = "Dismiss",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="feedback-close"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-tlds-1 text-foreground-secondary opacity-70 outline-none transition-[opacity,transform] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.94] [&_svg]:size-5",
        className,
      )}
      {...props}
    >
      {children ?? <CloseIcon />}
    </button>
  )
}

export { Feedback, FeedbackMessage, FeedbackRating, FeedbackField, FeedbackClose }
export type { FeedbackRatingValue }
