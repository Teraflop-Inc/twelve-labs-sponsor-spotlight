import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

// An entity reference (e.g. an `@mention`) rendered as a lavender pill. The
// colors map to the design system's search-lavender family: text =
// `search-lavender`, default fill = `search-lightest-lavender`, selected fill =
// `search-light-lavender`.
const entityChipVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] px-1 font-tl-sans font-normal text-tl-search-lavender",
  {
    variants: {
      size: {
        // No font-size/line-height classes: inherits from the container.
        inherit: "",
        sm: "text-[14px] leading-5",
        lg: "text-[17px] leading-6",
      },
      selected: {
        true: "bg-tl-search-light-lavender",
        false: "bg-tl-search-lightest-lavender",
      },
    },
    defaultVariants: {
      size: "inherit",
      selected: false,
    },
  },
)

function EntityChip({
  className,
  size,
  selected,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof entityChipVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="entity-chip"
      data-size={size ?? "inherit"}
      data-selected={selected || undefined}
      className={cn(entityChipVariants({ size, selected }), className)}
      {...props}
    />
  )
}

export { EntityChip, entityChipVariants }
