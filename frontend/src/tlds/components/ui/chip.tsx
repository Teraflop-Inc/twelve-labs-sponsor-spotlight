import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap border border-solid font-normal",
  {
    variants: {
      variant: {
        filled: "border-foreground-body bg-foreground-body text-foreground-primary",
        outline: "border-foreground-body bg-transparent text-foreground-body",
        subtle: "border-foreground-subtle bg-transparent text-foreground-subtle",
        "gray-outline": "border-foreground-subtle bg-transparent text-foreground-body",
        "white-outline": "border-white bg-white/[0.04] text-white backdrop-blur-[20px]",
        "white-filled": "border-white bg-white text-foreground-body",
        success:
          "border-tl-system-color-dark-green bg-tl-system-color-dark-green text-tl-system-color-light-green",
        warning: "border-misc-status-warning bg-misc-status-warning text-foreground-status-warning",
        error: "border-surface-destructive bg-surface-destructive text-white",
      },
      size: {
        mini: "h-3 rounded-[2px] px-[2px] text-[8px] leading-[10px]",
        sm: "h-4 rounded-[4px] px-1 text-[10px] leading-[14px]",
        md: "h-5 rounded-[6px] px-1 text-[12px] leading-4",
      },
      mono: {
        true: "font-tl-mono",
        false: "font-tl-sans",
      },
      uppercase: {
        true: "uppercase",
        false: "",
      },
    },
    compoundVariants: [
      // Mono medium uses larger text per the Figma spec
      { mono: true, size: "md", class: "text-[14px] leading-5 tracking-[-0.28px]" },
    ],
    defaultVariants: {
      variant: "filled",
      size: "md",
      mono: false,
      uppercase: false,
    },
  },
)

function Chip({
  className,
  variant,
  size,
  mono,
  uppercase,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-size={size}
      className={cn(chipVariants({ variant, size, mono, uppercase }), className)}
      {...props}
    />
  )
}

export { Chip, chipVariants }
