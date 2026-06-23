import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { SpinnerIcon } from "@/icons"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-default items-center whitespace-nowrap font-tl-sans font-normal transition-all duration-150 outline-none motion-safe:active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2 data-no-focus-ring:focus-visible:ring-0 data-no-focus-ring:focus-visible:ring-offset-0 disabled:pointer-events-none disabled:active:scale-100 aria-invalid:border-border-destructive aria-invalid:ring-border-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-surface-primary text-foreground-primary hover:bg-surface-primary-hover active:bg-surface-primary-hover disabled:bg-surface-disabled disabled:text-foreground-disabled",
        // White fill for use on dark surfaces (e.g. the popover).
        "primary-inverted":
          "bg-surface-primary-inverse text-foreground-primary-inverse hover:bg-surface-primary-inverse/90 active:bg-surface-primary-inverse/90 disabled:bg-surface-disabled disabled:text-foreground-disabled",
        secondary:
          "bg-surface-secondary text-foreground-secondary hover:bg-surface-secondary-hover active:bg-surface-secondary-hover disabled:bg-surface-disabled disabled:text-foreground-disabled",
        "outlined-black":
          "border border-border-primary bg-transparent text-foreground-secondary hover:bg-surface-secondary active:bg-surface-secondary disabled:border-border-disabled disabled:bg-transparent disabled:text-foreground-disabled",
        // White outline + text for use on dark surfaces (e.g. the popover).
        "outlined-black-inverted":
          "border border-foreground-primary bg-transparent text-foreground-primary hover:bg-foreground-primary/10 active:bg-foreground-primary/10 disabled:border-border-disabled disabled:bg-transparent disabled:text-foreground-disabled",
        "outlined-gray":
          "border border-border-secondary bg-transparent text-foreground-secondary hover:bg-surface-secondary active:bg-surface-secondary disabled:border-border-disabled disabled:bg-transparent disabled:text-foreground-disabled",
        ghosted:
          "bg-transparent text-foreground-secondary hover:bg-surface-secondary active:bg-surface-secondary disabled:bg-transparent disabled:text-foreground-disabled",
        destructive:
          "bg-surface-destructive text-tl-white hover:bg-surface-destructive/90 active:bg-surface-destructive/90 disabled:bg-surface-disabled disabled:text-foreground-disabled",
      },
      size: {
        xl: "h-12 gap-1 rounded-button-x-large px-4 text-base leading-6 hover:rounded-button-x-large-hover [&_svg:not([class*='size-'])]:size-6",
        lg: "h-10 gap-1 rounded-button-large px-4 text-sm leading-6 hover:rounded-button-large-hover [&_svg:not([class*='size-'])]:size-5",
        md: "h-8 gap-1 rounded-button-medium px-2 text-sm leading-5 hover:rounded-button-medium-hover [&_svg:not([class*='size-'])]:size-4",
        regular:
          "h-7 gap-1 rounded-button-regular px-2 text-xs leading-5 hover:rounded-button-regular-hover [&_svg:not([class*='size-'])]:size-4",
        sm: "h-6 gap-1 rounded-button-small px-2 text-xs leading-4 hover:rounded-button-small-hover [&_svg:not([class*='size-'])]:size-4",
        mini: "h-5.5 gap-1 rounded-button-mini px-2 text-[10px] leading-3.5 hover:rounded-button-mini-hover [&_svg:not([class*='size-'])]:size-3",
      },
      // Horizontal alignment of the content. `center` packs the icons and label
      // together in the middle (the default). `left`/`right` push the content to
      // that edge so the leading and trailing icons sit at the opposite ends —
      // useful for full-width buttons. See `alignLeading`/`alignTrailing` below,
      // which add the `auto` margin that spaces the icons apart.
      textAlign: {
        center: "justify-center",
        left: "justify-start",
        right: "justify-end",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      textAlign: "center",
    },
  },
)

function Button({
  className,
  variant = "primary",
  size = "md",
  textAlign = "center",
  asChild = false,
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const isDisabled = disabled || loading
  const firstChild = React.Children.toArray(children)[0]
  const isAnchorChild = React.isValidElement(firstChild) && firstChild.type === "a"

  // For left/right alignment, an `auto` margin on the opposite-edge icon pushes
  // it away from the label so the icons end up spaced apart at the two ends.
  const alignLeading = textAlign === "right" ? "mr-auto" : undefined
  const alignTrailing = textAlign === "left" ? "ml-auto" : undefined

  const leading =
    leftIcon != null ? (
      <span className={cn("relative grid place-items-center", alignLeading)}>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex transition-[opacity,transform] duration-200 ease-out",
            loading ? "scale-0 opacity-0" : "scale-100 opacity-100",
          )}
        >
          {leftIcon}
        </span>
        <SpinnerIcon
          className={cn(
            "col-start-1 row-start-1 animate-spin transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            loading ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
      </span>
    ) : (
      <span
        aria-hidden={!loading}
        className={cn(
          "-ml-1 grid grid-cols-[0fr] transition-[grid-template-columns,margin-left] duration-200 ease-out",
          loading && "ml-0 grid-cols-[1fr]",
          alignLeading,
        )}
      >
        <span className="inline-flex items-center overflow-hidden">
          <SpinnerIcon
            className={cn(
              "animate-spin transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              loading ? "scale-100" : "scale-0",
            )}
          />
        </span>
      </span>
    )

  // When there's only a right icon (no left icon), collapse the right icon
  // while loading so the spinner pop-in on the left is balanced by a pop-out
  // on the right.
  const collapseRightWhileLoading = leftIcon == null && rightIcon != null
  const trailing = collapseRightWhileLoading ? (
    <span
      aria-hidden={loading || undefined}
      className={cn(
        "mr-0 grid grid-cols-[1fr] transition-[grid-template-columns,margin-right] duration-200 ease-out",
        loading && "-mr-1 grid-cols-[0fr]",
        alignTrailing,
      )}
    >
      <span className="inline-flex items-center overflow-hidden">
        <span
          className={cn(
            "inline-flex transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            loading ? "scale-0" : "scale-100",
          )}
        >
          {rightIcon}
        </span>
      </span>
    </span>
  ) : alignTrailing != null && rightIcon != null ? (
    <span className={alignTrailing}>{rightIcon}</span>
  ) : (
    rightIcon
  )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, textAlign }),
        // Pointer when the child is an anchor, with or without asChild.
        isAnchorChild && "cursor-pointer",
        className,
      )}
      {...props}
    >
      {leading}
      <Slot.Slottable>{children}</Slot.Slottable>
      {trailing}
    </Comp>
  )
}

export { Button, buttonVariants }
