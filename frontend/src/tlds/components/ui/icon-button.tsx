import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex shrink-0 cursor-default items-center justify-center transition-all duration-150 outline-none motion-safe:active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2 data-no-focus-ring:focus-visible:ring-0 data-no-focus-ring:focus-visible:ring-offset-0 disabled:pointer-events-none disabled:active:scale-100 aria-invalid:border-border-destructive aria-invalid:ring-border-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        xl: "size-12 rounded-button-x-large p-3 hover:rounded-button-x-large-hover [&_svg:not([class*='size-'])]:size-6",
        lg: "size-10 rounded-button-large p-2.5 hover:rounded-button-large-hover [&_svg:not([class*='size-'])]:size-5",
        md: "size-8 rounded-button-medium p-2 hover:rounded-button-medium-hover [&_svg:not([class*='size-'])]:size-4",
        regular:
          "size-7 rounded-button-regular p-1.5 hover:rounded-button-regular-hover [&_svg:not([class*='size-'])]:size-4",
        sm: "size-6 rounded-button-small p-1 hover:rounded-button-small-hover [&_svg:not([class*='size-'])]:size-4",
        mini: "size-5 rounded-button-mini p-1 hover:rounded-button-mini-hover [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

function IconButton({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="icon-button"
      data-variant={variant}
      data-size={size}
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
