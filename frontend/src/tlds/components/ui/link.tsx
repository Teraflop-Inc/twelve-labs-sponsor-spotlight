import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const linkVariants = cva(
  // Underlined, inherits its color from the surrounding text (`text-current`),
  // so it adapts to whatever surface it sits on. `gap-1` spaces an optional
  // trailing icon (e.g. an external-link arrow) from the label.
  "inline-flex w-fit cursor-pointer items-center gap-1 rounded-tlds-1 font-semibold whitespace-nowrap text-current underline decoration-from-font underline-offset-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm: "text-xs leading-4 [&_svg:not([class*='size-'])]:size-3.5",
        md: "text-sm leading-[22px] [&_svg:not([class*='size-'])]:size-4",
        lg: "text-base leading-6 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

function Link({
  className,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    asChild?: boolean
  }) {
  // `asChild` lets the link render a custom element while keeping its styles —
  // e.g. a Next.js `<Link asChild><NextLink href="…">…</NextLink></Link>`.
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="link"
      data-size={size}
      className={cn(linkVariants({ size }), className)}
      {...props}
    />
  )
}

export { Link, linkVariants }
